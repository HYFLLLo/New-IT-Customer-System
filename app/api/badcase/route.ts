import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const status = searchParams.get('status')
  const category = searchParams.get('category')
  const priority = searchParams.get('priority')
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '20')

  const where: any = {}
  if (status) where.status = status
  if (category) where.category = category
  if (priority) where.priority = priority

  const [items, total] = await Promise.all([
    prisma.badcase.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize
    }),
    prisma.badcase.count({ where })
  ])

  return NextResponse.json({ items, total, page, pageSize })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, question, answer, confidence, sourceType, sourceId } = body

    if (!sessionId || !question || !sourceType) {
      return NextResponse.json(
        { error: 'sessionId, question, sourceType are required' },
        { status: 400 }
      )
    }

    const { createBadcase } = await import('@/lib/badcase')
    const id = await createBadcase({
      sessionId,
      question,
      answer,
      confidence,
      sourceType,
      sourceId
    })

    return NextResponse.json({ id }, { status: 201 })
  } catch (error) {
    console.error('Failed to create badcase:', error)
    return NextResponse.json(
      { error: 'Failed to create badcase' },
      { status: 500 }
    )
  }
}