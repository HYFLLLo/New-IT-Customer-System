import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/agent/reports/[id] - Get single QA report
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const report = await prisma.qAReport.findUnique({
      where: { id },
      include: {
        ticket: {
          select: { 
            id: true, 
            title: true, 
            description: true,
            employee: { select: { id: true, name: true } } 
          },
        },
        createdBy: { select: { id: true, name: true } },
      },
    })

    if (!report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ report })
  } catch (error) {
    console.error('Get report error:', error)
    return NextResponse.json(
      { error: 'Failed to get report' },
      { status: 500 }
    )
  }
}
