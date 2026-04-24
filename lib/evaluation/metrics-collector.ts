import { prisma } from '@/lib/prisma'

export interface MetricsSummary {
  totalRequests: number
  avgConfidence: number
  avgLatencyMs: number
  passRate: number
  failReasonsDistribution: Record<string, number>
}

export async function collectRealtimeMetrics(
  timeRange: { start: Date; end: Date }
): Promise<MetricsSummary> {
  const logs = await prisma.realtimeCheckLog.findMany({
    where: {
      createdAt: {
        gte: timeRange.start,
        lte: timeRange.end
      }
    }
  })

  if (logs.length === 0) {
    return {
      totalRequests: 0,
      avgConfidence: 0,
      avgLatencyMs: 0,
      passRate: 0,
      failReasonsDistribution: {}
    }
  }

  const totalRequests = logs.length
  const avgConfidence = logs.reduce((sum, l) => sum + l.confidence, 0) / totalRequests
  const avgLatencyMs = Math.round(logs.reduce((sum, l) => sum + l.latencyMs, 0) / totalRequests)
  const passCount = logs.filter(l => l.passed).length
  const passRate = passCount / totalRequests

  const failReasonsDistribution: Record<string, number> = {}
  logs.forEach(log => {
    if (!log.passed && log.failReasons) {
      let reasons: string[] = []
      try {
        reasons = JSON.parse(log.failReasons) as string[]
      } catch {
        console.warn(`Corrupted failReasons for log ${log.id}`)
      }
      reasons.forEach(reason => {
        failReasonsDistribution[reason] = (failReasonsDistribution[reason] || 0) + 1
      })
    }
  })

  return {
    totalRequests,
    avgConfidence: Math.round(avgConfidence * 100) / 100,
    avgLatencyMs,
    passRate: Math.round(passRate * 100) / 100,
    failReasonsDistribution
  }
}

export async function logRealtimeCheck(
  sessionId: string,
  question: string,
  answer: string,
  confidence: number,
  latencyMs: number,
  result: { passed: boolean; failReasons: string[] }
): Promise<void> {
  await prisma.realtimeCheckLog.create({
    data: {
      sessionId,
      question,
      answer,
      confidence,
      latencyMs,
      passed: result.passed,
      failReasons: JSON.stringify(result.failReasons)
    }
  })
}