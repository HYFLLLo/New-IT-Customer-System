import { NextRequest, NextResponse } from 'next/server'
import { runEvaluation } from '@/lib/evaluation/runner'

function isValidUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)
}

export async function POST(request: NextRequest) {
  try {
    const { datasetId, name, runType = 'manual' } = await request.json()

    if (!datasetId || !name) {
      return NextResponse.json(
        { error: 'datasetId and name are required' },
        { status: 400 }
      )
    }

    if (!isValidUUID(datasetId)) {
      return NextResponse.json(
        { error: 'Invalid datasetId format' },
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