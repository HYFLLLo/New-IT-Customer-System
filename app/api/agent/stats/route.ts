import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()

  if (!session || (session.role !== 'AGENT' && session.role !== 'ADMIN')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Total tickets
    const totalTickets = await prisma.ticket.count()

    // Tickets by status
    const ticketsByStatus = await prisma.ticket.groupBy({
      by: ['status'],
      _count: { status: true },
    })

    // Average confidence score
    const confidenceStats = await prisma.ticket.aggregate({
      _avg: { confidence: true },
      where: { confidence: { not: null } },
    })

    // Tickets created in last 7 days
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    
    const ticketsThisWeek = await prisma.ticket.count({
      where: { createdAt: { gte: weekAgo } },
    })

    // Resolved tickets this week
    const resolvedThisWeek = await prisma.ticket.count({
      where: {
        status: 'RESOLVED',
        updatedAt: { gte: weekAgo },
      },
    })

    // Average resolution time (for resolved tickets)
    const resolvedTickets = await prisma.ticket.findMany({
      where: { status: { in: ['RESOLVED', 'CLOSED'] } },
      select: {
        createdAt: true,
        updatedAt: true,
      },
    })

    let avgResolutionTime = 0
    if (resolvedTickets.length > 0) {
      const totalTime = resolvedTickets.reduce((sum, t) => {
        return sum + (t.updatedAt.getTime() - t.createdAt.getTime())
      }, 0)
      avgResolutionTime = totalTime / resolvedTickets.length / (1000 * 60 * 60) // in hours
    }

    // Feedback stats
    const feedbackStats = await prisma.feedback.aggregate({
      _avg: { rating: true },
      _count: true,
    })

    // Rating distribution
    const ratingDistribution = await prisma.feedback.groupBy({
      by: ['rating'],
      _count: { rating: true },
    })

    // Knowledge base stats
    const totalDocuments = await prisma.document.count()
    const processedDocuments = await prisma.document.count({
      where: { status: 'PROCESSED' },
    })
    const totalChunks = await prisma.chunk.count()

    // Category distribution (based on extracted data or title keywords)
    const allTickets = await prisma.ticket.findMany({
      select: { title: true },
    })

    const categoryStats = {
      系统故障: 0,
      网络问题: 0,
      硬件问题: 0,
      软件问题: 0,
      账号权限: 0,
      其他: 0,
    }

    allTickets.forEach(t => {
      const title = t.title.toLowerCase()
      if (title.includes('蓝屏') || title.includes('死机') || title.includes('崩溃')) {
        categoryStats.系统故障++
      } else if (title.includes('网络') || title.includes('wifi') || title.includes('连不上')) {
        categoryStats.网络问题++
      } else if (title.includes('打印') || title.includes('键盘') || title.includes('鼠标')) {
        categoryStats.硬件问题++
      } else if (title.includes('软件') || title.includes('安装') || title.includes('卸载')) {
        categoryStats.软件问题++
      } else if (title.includes('账号') || title.includes('密码') || title.includes('权限')) {
        categoryStats.账号权限++
      } else {
        categoryStats.其他++
      }
    })

    return NextResponse.json({
      overview: {
        totalTickets,
        ticketsThisWeek,
        resolvedThisWeek,
        resolutionRate: totalTickets > 0 
          ? Math.round((resolvedThisWeek / ticketsThisWeek) * 100) 
          : 0,
        avgResolutionTimeHours: Math.round(avgResolutionTime * 10) / 10,
      },
      ticketsByStatus: ticketsByStatus.reduce((acc, item) => {
        acc[item.status] = item._count.status
        return acc
      }, {} as Record<string, number>),
      confidence: {
        average: Math.round((confidenceStats._avg.confidence || 0) * 100),
      },
      feedback: {
        averageRating: Math.round((feedbackStats._avg.rating || 0) * 10) / 10,
        totalResponses: feedbackStats._count,
        distribution: ratingDistribution.reduce((acc, item) => {
          acc[item.rating] = item._count.rating
          return acc
        }, {} as Record<number, number>),
      },
      knowledgeBase: {
        totalDocuments,
        processedDocuments,
        totalChunks,
      },
      categoryDistribution: categoryStats,
    })
  } catch (error) {
    console.error('Stats error:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
