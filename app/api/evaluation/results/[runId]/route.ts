import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: { runId: string } }
) {
  try {
    const run = await prisma.evaluationRun.findUnique({
      where: { id: params.runId },
      include: {
        results: {
          orderBy: { overallScore: 'desc' }
        }
      }
    })

    if (!run) {
      return NextResponse.json(
        { error: 'Run not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(run)
  } catch (error) {
    console.error('Failed to get evaluation results:', error)
    return NextResponse.json(
      { error: 'Failed to get results' },
      { status: 500 }
    )
  }
}