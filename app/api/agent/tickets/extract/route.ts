import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { extractTicketFields } from '@/lib/minimax'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { ticketId } = body

    if (!ticketId) {
      return NextResponse.json({ error: 'Missing ticketId' }, { status: 400 })
    }

    // Get ticket details
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Get conversation context
    const conversationContext = ticket.messages
      .map(m => `${m.type}: ${m.content}`)
      .join('\n')

    // Extract fields using AI
    const fields = await extractTicketFields(
      `${ticket.description}\n\n对话上下文:\n${conversationContext}`
    )

    return NextResponse.json({ fields })
  } catch (error) {
    console.error('Extract fields error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
