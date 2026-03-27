import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { deleteChunks } from '@/lib/chroma'
import * as fs from 'fs'

// DELETE /api/agent/knowledge/[id] - Delete a document
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Get document with chunks
    const document = await prisma.document.findUnique({
      where: { id },
      include: { chunks: true },
    })

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    // Delete from ChromaDB
    const chromaIds = document.chunks.map((c) => c.chromaId)
    if (chromaIds.length > 0) {
      await deleteChunks(chromaIds).catch(console.error)
    }

    // Delete from database
    await prisma.chunk.deleteMany({ where: { documentId: id } })
    await prisma.document.delete({ where: { id } })

    // Delete file from disk
    if (fs.existsSync(document.filePath)) {
      fs.unlinkSync(document.filePath)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete document error:', error)
    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    )
  }
}
