import { NextRequest, NextResponse } from 'next/server'
import { runEvaluation } from '@/lib/evaluation/runner'

export async function POST(request: NextRequest) {
  try {
    const { datasetId, name, runType = 'manual' } = await request.json()

    if (!datasetId || !name) {
      return NextResponse.json(
        { error: 'datasetId and name are required' },
        { status: 400 }
      )
    }

    const runId = await runEvaluation(datasetId, name, runType)
    return NextResponse.json({ runId, status: 'started' })
  } catch (error) {
    console.error('Failed to start evaluation:', error)
    return NextResponse.json(
      { error: 'Failed to start evaluation' },
      { status: 500 }
    )
  }
}