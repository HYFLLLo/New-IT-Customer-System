import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { searchChunks, SearchResult } from '@/lib/chroma'
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

    // Search knowledge base for relevant context (hybrid: BM25 + vector)
    const searchResults: SearchResult[] = await searchChunks(question, 5, {
      hybridSearch: true,
      bm25Weight: 0.4,
    })

    // Generate answer with confidence score (new Phase 3)
    const { 
      answer, 
      confidence, 
      confidenceBreakdown,
      isLowConfidence,
      suggestion,
      retrievedChunks 
    } = await generateAnswerWithConfidence(
      question,
      searchResults,
      chatHistory
    )

    // Determine behavior based on new confidence system
    let shouldCreateTicket = false
    let showAnswer = true
    let status: 'AI_ANSWERED' | 'OPEN' = 'AI_ANSWERED'
    let displaySuggestion = suggestion

    if (isLowConfidence) {
      // Low confidence: don't show answer, create ticket
      shouldCreateTicket = true
      showAnswer = false
      status = 'OPEN'
    } else if (confidence < 0.6) {
      // Medium-low confidence: show answer but suggest ticket
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
        confidenceBreakdown,
        isLowConfidence,
        shouldCreateTicket,
        showAnswer,
        status: updatedTicket.status,
        suggestion: displaySuggestion,
        retrievedChunksCount: retrievedChunks.length,
        conversationTurns: chatHistory.length,
        searchResultsTop3: searchResults.slice(0, 3).map(r => ({
          header: r.metadata?.header,
          docName: r.metadata?.doc_name,
          similarity: Math.round((1 - Math.min(r.distance, 1)) * 100),
        })),
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
            confidenceBreakdown,
            isMultiTurn: chatHistory.length > 0,
            retrievalScore: confidenceBreakdown.retrievalScore,
            answerScore: confidenceBreakdown.answerScore,
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
        confidenceBreakdown,
        isLowConfidence,
        shouldCreateTicket,
        showAnswer,
        status: newTicket.status,
        suggestion: displaySuggestion,
        retrievedChunksCount: retrievedChunks.length,
        conversationTurns: chatHistory.length,
        searchResultsTop3: searchResults.slice(0, 3).map(r => ({
          header: r.metadata?.header,
          docName: r.metadata?.doc_name,
          similarity: Math.round((1 - Math.min(r.distance, 1)) * 100),
        })),
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
