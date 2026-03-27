import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get('employeeId')

    if (!employeeId) {
      return NextResponse.json({ error: 'Missing employeeId' }, { status: 400 })
    }

    // Get all messages sent to this employee via tickets
    const tickets = await prisma.ticket.findMany({
      where: { employeeId },
      include: {
        messages: {
          where: {
            type: 'AGENT', // Only messages from agents
          },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Flatten and format messages
    const messages = tickets.flatMap(ticket => 
      ticket.messages.map(msg => ({
        id: msg.id,
        content: msg.content,
        ticketId: ticket.id,
        ticketTitle: ticket.title,
        createdAt: msg.createdAt,
        read: true, // For now, all messages are read
      }))
    )

    return NextResponse.json({ messages })
  } catch (error) {
    console.error('Get messages error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
