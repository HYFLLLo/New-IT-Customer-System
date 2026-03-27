import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { searchChunks } from '@/lib/chroma'
import { generateAnswerWithConfidence } from '@/lib/minimax'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { question, employeeId, ticketId, conversationHistory } = body

    if (!question || !employeeId) {
      return NextResponse.json(
        { error: 'Missing required fields: question, employeeId' },
        { status: 400 }
      )
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

    // Search knowledge base for relevant context
    const searchResults = await searchChunks(question, 5)
    const contextChunks = searchResults.map((r) => r.content)

    // Generate answer with confidence score
    const { answer, confidence, retrievedChunks } = await generateAnswerWithConfidence(
      question,
      contextChunks,
      chatHistory
    )

    // Determine ticket creation based on confidence
    let shouldCreateTicket = false
    let showAnswer = true
    let status: 'AI_ANSWERED' | 'OPEN' = 'AI_ANSWERED'

    if (confidence < 0.6) {
      shouldCreateTicket = true
      showAnswer = false
      status = 'OPEN'
    } else if (confidence < 0.8) {
      shouldCreateTicket = true
    }

    // Use existing ticket or create new one
    if (ticketId) {
      // Get existing ticket first
      const existingTicket = await prisma.ticket.findUnique({
        where: { id: ticketId }
      })

      // Update existing ticket
      const updatedTicket = await prisma.ticket.update({
        where: { id: ticketId },
        data: {
          confidence: confidence > (existingTicket?.confidence || 0) ? confidence : existingTicket?.confidence,
          status: confidence >= 0.6 ? 'AI_ANSWERED' : 'OPEN',
        },
      })

      // Add user message
      await prisma.message.create({
        data: {
          ticketId: updatedTicket.id,
          senderId: employeeId,
          content: question,
          type: 'USER',
        },
      })

      // Add AI response if showing answer
      if (showAnswer && answer) {
        await prisma.message.create({
          data: {
            ticketId: updatedTicket.id,
            senderId: employeeId,
            content: `[AI 回答]\n${answer}`,
            type: 'AI',
          },
        })
      }

      return NextResponse.json({
        ticketId: updatedTicket.id,
        answer: showAnswer ? answer : null,
        confidence,
        shouldCreateTicket,
        showAnswer,
        status: updatedTicket.status,
        retrievedChunksCount: retrievedChunks.length,
        conversationTurns: chatHistory.length,
      })
    } else {
      // Create new ticket
      const newTicket = await prisma.ticket.create({
        data: {
          title: question.slice(0, 100),
          description: question,
          employeeId,
          confidence,
          status,
          extractedData: {
            retrievedChunks: retrievedChunks.length,
            confidenceBreakdown: {},
            isMultiTurn: chatHistory.length > 0,
          },
        },
      })

      // Add user message
      await prisma.message.create({
        data: {
          ticketId: newTicket.id,
          senderId: employeeId,
          content: question,
          type: 'USER',
        },
      })

      // Add AI response if showing answer
      if (showAnswer && answer) {
        await prisma.message.create({
          data: {
            ticketId: newTicket.id,
            senderId: employeeId,
            content: `[AI 回答]\n${answer}`,
            type: 'AI',
          },
        })
      }

      return NextResponse.json({
        ticketId: newTicket.id,
        answer: showAnswer ? answer : null,
        confidence,
        shouldCreateTicket,
        showAnswer,
        status: newTicket.status,
        retrievedChunksCount: retrievedChunks.length,
        conversationTurns: chatHistory.length,
      })
    }
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
