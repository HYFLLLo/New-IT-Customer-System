import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/agent/tickets - Get all tickets for agent dashboard
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')

  const where = status ? { status: status as any } : {}

  const tickets = await prisma.ticket.findMany({
    where,
    include: {
      employee: {
        select: { id: true, name: true, email: true },
      },
      assignedTo: {
        select: { id: true, name: true },
      },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
      _count: {
        select: { messages: true, qaReports: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ tickets })
}

// PATCH /api/agent/tickets - Update ticket (assign, change status)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { ticketId, status, assignedToId } = body

    if (!ticketId) {
      return NextResponse.json(
        { error: 'Missing ticketId' },
        { status: 400 }
      )
    }

    const updateData: any = {}
    if (status) updateData.status = status
    if (assignedToId) updateData.assignedToId = assignedToId

    const ticket = await prisma.ticket.update({
      where: { id: ticketId },
      data: updateData,
      include: {
        employee: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json({ ticket })
  } catch (error) {
    console.error('Update ticket error:', error)
    return NextResponse.json(
      { error: 'Failed to update ticket' },
      { status: 500 }
    )
  }
}
