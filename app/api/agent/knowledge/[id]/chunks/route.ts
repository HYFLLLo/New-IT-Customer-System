import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/agent/knowledge/[id]/chunks - Get document chunks
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const chunks = await prisma.chunk.findMany({
      where: { documentId: id },
      orderBy: { id: 'asc' },
    })

    // Transform to include chunkIndex
    const chunksWithIndex = chunks.map((chunk, index) => ({
      id: chunk.id,
      content: chunk.content,
      chunkIndex: index,
    }))

    return NextResponse.json({ chunks: chunksWithIndex })
  } catch (error) {
    console.error('Get chunks error:', error)
    return NextResponse.json(
      { error: 'Failed to get chunks' },
      { status: 500 }
    )
  }
}