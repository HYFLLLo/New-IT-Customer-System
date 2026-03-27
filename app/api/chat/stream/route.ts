import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { searchChunks, SearchResult } from '@/lib/chroma'
import { streamChatCompletion } from '@/lib/minimax'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { question, employeeId, ticketId, conversationHistory } = body

    if (!question || !employeeId) {
      return new Response('Missing required fields', { status: 400 })
    }

    // Get conversation history if ticketId provided
    let chatHistory: Array<{role: string; content: string}> = []
    if (ticketId) {
      const messages = await prisma.message.findMany({
        where: { ticketId },
        orderBy: { createdAt: 'asc' },
        take: 10,
      })
      
      chatHistory = messages.map(m => ({
        role: m.type === 'USER' ? 'user' : 'assistant',
        content: m.content.replace(/^\[AI 回答\]\n/, ''),
      }))
    }

    // Search knowledge base
    const searchResults: SearchResult[] = await searchChunks(question, 5, {
      hybridSearch: true,
      bm25Weight: 0.4,
    })

    // Extract context
    const contextChunks = searchResults.map(r => r.content)
    const contextText = contextChunks.map((c, i) => `[文档${i + 1}]:\n${c}`).join('\n\n')

    // Build messages
    let systemPrompt = `你是一个IT桌面运维助手，基于以下知识库内容回答员工的问题。

要求：
1. 如果知识库中有相关内容，基于内容给出准确答案
2. 如果没有相关内容，明确告知"抱歉，知识库中没有找到相关信息，建议提交人工工单"
3. 回答要清晰、实用，包含具体步骤
4. 重要：请在回答前先输出你的思考过程，用<thinking>标签包裹，例如：<thinking>我需要分析这个问题，这涉及到XX系统...</thinking>然后再给出正式回答
5. 如果是追问，请结合之前的对话上下文回答`

    if (conversationHistory.length > 0) {
      systemPrompt += `\n\n[对话历史]\n${chatHistory.map(m => `${m.role === 'user' ? '员工' : '助手'}: ${m.content}`).join('\n')}`
    }

    systemPrompt += `\n\n[知识库内容]\n${contextText}`

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...chatHistory.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      { role: 'user' as const, content: question },
    ]

    // Use streaming
    const stream = await streamChatCompletion(messages)

    // Return as SSE
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Stream chat error:', error)
    return new Response('Internal server error', { status: 500 })
  }
}
