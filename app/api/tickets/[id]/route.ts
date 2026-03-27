import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/tickets/[id] - Get single ticket with all messages
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { searchParams } = new URL(request.url)
  const employeeId = searchParams.get('employeeId')

  try {
    const ticket = await prisma.ticket.findFirst({
      where: {
        id,
        ...(employeeId ? { employeeId } : {}),
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            sender: true,
            attachments: true,
          },
        },
        feedback: true,
        qaReports: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ ticket })
  } catch (error) {
    console.error('Get ticket error:', error)
    return NextResponse.json(
      { error: 'Failed to get ticket' },
      { status: 500 }
    )
  }
}

// PATCH /api/tickets/[id] - Update ticket status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  
  try {
    const body = await request.json()
    const { status } = body

    const ticket = await prisma.ticket.update({
      where: { id },
      data: { status },
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
