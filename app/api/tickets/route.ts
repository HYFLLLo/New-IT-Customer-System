import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/tickets - Get tickets (for employee: own tickets)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const employeeId = searchParams.get('employeeId')

  if (!employeeId) {
    return NextResponse.json(
      { error: 'Missing employeeId parameter' },
      { status: 400 }
    )
  }

  const tickets = await prisma.ticket.findMany({
    where: { employeeId },
    include: {
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
      feedback: true,
      qaReports: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ tickets })
}

// POST /api/tickets - Create a new ticket
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, description, employeeId } = body

    if (!title || !description || !employeeId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const ticket = await prisma.ticket.create({
      data: {
        title,
        description,
        employeeId,
        status: 'OPEN',
      },
    })

    // Add initial message
    await prisma.message.create({
      data: {
        ticketId: ticket.id,
        senderId: employeeId,
        content: description,
        type: 'USER',
      },
    })

    return NextResponse.json({ ticket }, { status: 201 })
  } catch (error) {
    console.error('Create ticket error:', error)
    return NextResponse.json(
      { error: 'Failed to create ticket' },
      { status: 500 }
    )
  }
}
