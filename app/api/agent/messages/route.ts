import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/agent/messages - Send message to employee
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { ticketId, senderId, content, type } = body

    if (!ticketId || !senderId || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const message = await prisma.message.create({
      data: {
        ticketId,
        senderId,
        content,
        type: type || 'AGENT',
      },
      include: {
        ticket: {
          select: { employeeId: true },
        },
      },
    })

    // Update ticket status to IN_PROGRESS if it's still OPEN
    await prisma.ticket.updateMany({
      where: { id: ticketId, status: 'OPEN' },
      data: { status: 'IN_PROGRESS' },
    })

    return NextResponse.json({ message }, { status: 201 })
  } catch (error) {
    console.error('Send message error:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}
