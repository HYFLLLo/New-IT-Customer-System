import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const days = parseInt(searchParams.get('days') || '7')

  const end = new Date()
  const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000)

  const badcases = await prisma.badcase.findMany({
    where: {
      createdAt: { gte: start }
    },
    select: {
      createdAt: true,
      verifiedAt: true,
      status: true
    }
  })

  // 按天统计
  const dailyMap = new Map<string, { created: number; resolved: number }>()

  for (let d = 0; d < days; d++) {
    const date = new Date(start.getTime() + d * 24 * 60 * 60 * 1000)
    const key = date.toISOString().split('T')[0]
    dailyMap.set(key, { created: 0, resolved: 0 })
  }

  badcases.forEach(b => {
    const dateKey = b.createdAt.toISOString().split('T')[0]
    const entry = dailyMap.get(dateKey)
    if (entry) entry.created++
  })

  const resolvedBadcases = badcases.filter(b => b.verifiedAt && b.verifiedAt >= start)
  resolvedBadcases.forEach(b => {
    const dateKey = b.verifiedAt!.toISOString().split('T')[0]
    const entry = dailyMap.get(dateKey)
    if (entry) entry.resolved++
  })

  const daily = Array.from(dailyMap.entries()).map(([date, stats]) => ({
    date,
    ...stats
  }))

  return NextResponse.json({ daily })
}