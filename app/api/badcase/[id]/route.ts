import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const badcase = await prisma.badcase.findUnique({
    where: { id: params.id },
    include: {
      analyses: { orderBy: { createdAt: 'desc' } },
      tasks: { orderBy: { createdAt: 'desc' } }
    }
  })

  if (!badcase) {
    return NextResponse.json({ error: 'Badcase not found' }, { status: 404 })
  }

  return NextResponse.json(badcase)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { status, category, rootCause, priority, optimization } = body

    const updateData: any = {}
    if (status) updateData.status = status
    if (category) updateData.category = category
    if (rootCause) updateData.rootCause = rootCause
    if (priority) updateData.priority = priority
    if (optimization) {
      updateData.optimization = optimization
      updateData.optimizedAt = new Date()
    }

    const badcase = await prisma.badcase.update({
      where: { id: params.id },
      data: updateData
    })

    return NextResponse.json(badcase)
  } catch (error) {
    console.error('Failed to update badcase:', error)
    return NextResponse.json(
      { error: 'Failed to update badcase' },
      { status: 500 }
    )
  }
}