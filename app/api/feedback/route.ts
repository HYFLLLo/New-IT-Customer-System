import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { detectFromUserFeedback } from '@/lib/badcase/detector'

// POST /api/feedback - Submit feedback
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { ticketId, userId, rating, comment } = body

    if (!ticketId || !userId || !rating) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      )
    }

    // Check if feedback already exists
    const existing = await prisma.feedback.findUnique({
      where: { ticketId },
    })

    if (existing) {
      // Update existing feedback
      const feedback = await prisma.feedback.update({
        where: { ticketId },
        data: { rating, comment },
      })
      // Detect badcase if rating is low
      if (rating <= 2) {
        const ticket = await prisma.ticket.findUnique({
          where: { id: ticketId },
          include: { messages: { where: { type: 'agent' }, orderBy: { createdAt: 'desc' }, take: 1 } }
        })
        const lastAgentMessage = ticket?.messages[0]?.content ?? null
        await detectFromUserFeedback(
          ticketId,
          ticket?.description ?? '',
          lastAgentMessage,
          ticket?.confidence ?? null,
          feedback.id,
          rating
        )
      }
      return NextResponse.json({ feedback })
    }

    const feedback = await prisma.feedback.create({
      data: {
        ticketId,
        userId,
        rating,
        comment,
      },
    })

    // Detect badcase if rating is low
    if (rating <= 2) {
      const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
        include: { messages: { where: { type: 'agent' }, orderBy: { createdAt: 'desc' }, take: 1 } }
      })
      const lastAgentMessage = ticket?.messages[0]?.content ?? null
      await detectFromUserFeedback(
        ticketId,
        ticket?.description ?? '',
        lastAgentMessage,
        ticket?.confidence ?? null,
        feedback.id,
        rating
      )
    }

    return NextResponse.json({ feedback }, { status: 201 })
  } catch (error) {
    console.error('Feedback error:', error)
    return NextResponse.json(
      { error: 'Failed to submit feedback' },
      { status: 500 }
    )
  }
}

// GET /api/feedback - Get feedback stats (for agent dashboard)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const ticketId = searchParams.get('ticketId')

  if (ticketId) {
    const feedback = await prisma.feedback.findUnique({
      where: { ticketId },
    })
    return NextResponse.json({ feedback })
  }

  // Get overall stats
  const stats = await prisma.feedback.aggregate({
    _avg: { rating: true },
    _count: true,
  })

  const distribution = await prisma.feedback.groupBy({
    by: ['rating'],
    _count: true,
  })

  return NextResponse.json({
    stats: {
      averageRating: stats._avg.rating || 0,
      totalFeedback: stats._count,
    },
    distribution: distribution.reduce((acc, d) => {
      acc[d.rating] = d._count
      return acc
    }, {} as Record<number, number>),
  })
}
