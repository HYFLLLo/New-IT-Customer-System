import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/tickets/[id]/messages - Add message to ticket
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  
  try {
    const body = await request.json()
    const { content, senderId, senderType, attachments } = body

    if (!content || !senderId || !senderType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const message = await prisma.message.create({
      data: {
        ticketId: id,
        senderId,
        content,
        type: senderType,
        attachments: attachments ? {
          create: attachments.map((att: { fileName: string; fileUrl: string; fileSize: number; fileType: string }) => ({
            fileName: att.fileName,
            fileUrl: att.fileUrl,
            fileSize: att.fileSize,
            fileType: att.fileType,
          })),
        } : undefined,
      },
      include: {
        sender: true,
        attachments: true,
      },
    })

    // Update ticket status if needed
    await prisma.ticket.update({
      where: { id },
      data: {
        status: senderType === 'USER' ? 'IN_PROGRESS' : undefined,
      },
    })

    return NextResponse.json({ message }, { status: 201 })
  } catch (error) {
    console.error('Create message error:', error)
    return NextResponse.json(
      { error: 'Failed to create message' },
      { status: 500 }
    )
  }
}
