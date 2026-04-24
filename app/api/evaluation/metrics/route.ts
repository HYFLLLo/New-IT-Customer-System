import { NextRequest, NextResponse } from 'next/server'
import { collectRealtimeMetrics } from '@/lib/evaluation/metrics-collector'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const hours = parseInt(searchParams.get('hours') || '24')

    const end = new Date()
    const start = new Date(end.getTime() - hours * 60 * 60 * 1000)

    const metrics = await collectRealtimeMetrics({ start, end })
    return NextResponse.json(metrics)
  } catch (error) {
    console.error('Failed to collect metrics:', error)
    return NextResponse.json(
      { error: 'Failed to collect metrics' },
      { status: 500 }
    )
  }
}