import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const [total, byStatus, byCategory, byPriority, bySourceType] = await Promise.all([
    prisma.badcase.count(),

    prisma.badcase.groupBy({
      by: ['status'],
      _count: true
    }).then(results => {
      const dict: Record<string, number> = {}
      results.forEach(r => { dict[r.status] = r._count })
      return dict
    }),

    prisma.badcase.groupBy({
      by: ['category'],
      _count: true
    }).then(results => {
      const dict: Record<string, number> = {}
      results.forEach(r => { if (r.category) dict[r.category] = r._count })
      return dict
    }),

    prisma.badcase.groupBy({
      by: ['priority'],
      _count: true
    }).then(results => {
      const dict: Record<string, number> = {}
      results.forEach(r => { dict[r.priority] = r._count })
      return dict
    }),

    prisma.badcase.groupBy({
      by: ['sourceType'],
      _count: true
    }).then(results => {
      const dict: Record<string, number> = {}
      results.forEach(r => { dict[r.sourceType] = r._count })
      return dict
    })
  ])

  // 计算平均解决时间和改善率
  const resolvedBadcases = await prisma.badcase.findMany({
    where: {
      verified: true,
      verifiedAt: { not: null }
    },
    select: {
      createdAt: true,
      verifiedAt: true,
      verificationResult: true
    }
  })

  const avgResolutionTime = resolvedBadcases.length > 0
    ? resolvedBadcases.reduce((sum, b) => {
        const diff = (b.verifiedAt!.getTime() - b.createdAt.getTime()) / (1000 * 60 * 60)
        return sum + diff
      }, 0) / resolvedBadcases.length
    : 0

  const improvementRate = resolvedBadcases.length > 0
    ? resolvedBadcases.filter(b => b.verificationResult === 'improved').length / resolvedBadcases.length
    : 0

  return NextResponse.json({
    total,
    byStatus,
    byCategory,
    byPriority,
    bySourceType,
    avgResolutionTime: Math.round(avgResolutionTime * 10) / 10,
    improvementRate: Math.round(improvementRate * 100) / 100
  })
}