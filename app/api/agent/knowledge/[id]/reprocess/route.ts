import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { deleteChunks } from '@/lib/chroma'
import { parseDocument } from '@/lib/parser'
import { embedText } from '@/lib/minimax'
import { ChromaClient } from 'chromadb'

// POST /api/agent/knowledge/[id]/reprocess - Reprocess a document
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

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

    if (document.status === 'PROCESSING') {
      return NextResponse.json({ error: 'Document is already being processed' }, { status: 409 })
    }

    // Start reprocessing in background
    reprocessDocument(id, document.filePath, document.fileType as 'PDF' | 'MARKDOWN' | 'DOCX')
      .then(() => console.log(`[Knowledge] Document ${id} reprocessed successfully`))
      .catch((err) => console.error(`[Knowledge] Document ${id} reprocess failed:`, err))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Reprocess document error:', error)
    return NextResponse.json(
      { error: 'Failed to reprocess document' },
      { status: 500 }
    )
  }
}

async function reprocessDocument(
  documentId: string,
  filePath: string,
  fileType: 'PDF' | 'MARKDOWN' | 'DOCX'
) {
  try {
    // Delete existing chunks from ChromaDB
    const existingDoc = await prisma.document.findUnique({
      where: { id: documentId },
      include: { chunks: true },
    })

    if (existingDoc) {
      const chromaIds = existingDoc.chunks.map((c) => c.chromaId)
      if (chromaIds.length > 0) {
        await deleteChunks(chromaIds).catch(console.error)
      }

      // Delete existing chunks from database
      await prisma.chunk.deleteMany({ where: { documentId } })
    }

    // Update status to processing
    await prisma.document.update({
      where: { id: documentId },
      data: { status: 'PROCESSING', progress: '正在解析文档...' },
    })

    // Parse document
    const { chunks } = await parseDocument(filePath, fileType)
    console.log(`[Knowledge] Reprocess: parsed ${chunks.length} chunks`)

    if (chunks.length === 0) {
      await prisma.document.update({
        where: { id: documentId },
        data: { status: 'FAILED', progress: '文档解析失败，未找到有效内容' },
      })
      return
    }

    // Prepare chunk data
    const chunkData = chunks.map((content, index) => ({
      id: `${documentId}-chunk-${index}`,
      content,
      metadata: { documentId, chunkIndex: index },
    }))

    // Step 1: Generate embeddings
    await prisma.document.update({
      where: { id: documentId },
      data: { progress: `正在生成向量 (0/${chunks.length})...` },
    })

    const batchSize = 5
    const normalizedChunks: Array<{id: string, content: string, embedding: number[], metadata: any}> = []

    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize)

      const embeddings = await Promise.all(
        batch.map(async (chunk) => {
          const emb = await embedText(chunk)
          const mag = Math.sqrt(emb.reduce((s: number, v: number) => s + v * v, 0))
          return mag > 0 ? emb.map((v: number) => v / mag) : emb
        })
      )

      batch.forEach((content, idx) => {
        normalizedChunks.push({
          id: `${documentId}-chunk-${i + idx}`,
          content,
          embedding: embeddings[idx],
          metadata: { documentId, chunkIndex: i + idx },
        })
      })

      const progress = Math.min(i + batchSize, chunks.length)
      await prisma.document.update({
        where: { id: documentId },
        data: { progress: `正在生成向量 (${progress}/${chunks.length})...` },
      })
    }

    // Step 2: Store in ChromaDB
    await prisma.document.update({
      where: { id: documentId },
      data: { progress: `正在入库 (0/${chunkData.length})...` },
    })

    const client = new ChromaClient({ path: process.env.CHROMA_URL || 'http://localhost:8000' })
    const col = await client.getCollection({ name: 'knowledge_base' })

    for (let i = 0; i < normalizedChunks.length; i += batchSize) {
      const batch = normalizedChunks.slice(i, i + batchSize)

      await col.add({
        ids: batch.map(c => c.id),
        embeddings: batch.map(c => c.embedding),
        documents: batch.map(c => c.content),
        metadatas: batch.map(c => c.metadata),
      })

      const progress = Math.min(i + batchSize, normalizedChunks.length)
      await prisma.document.update({
        where: { id: documentId },
        data: { progress: `正在入库 (${progress}/${chunkData.length})...` },
      })
    }

    // Step 3: Save to database
    await prisma.document.update({
      where: { id: documentId },
      data: { progress: '正在保存元数据...' },
    })

    await prisma.chunk.createMany({
      data: chunkData.map((c) => ({
        documentId,
        content: c.content,
        chromaId: c.id,
      })),
    })

    // Update status to processed
    await prisma.document.update({
      where: { id: documentId },
      data: { status: 'PROCESSED', progress: `已完成 (${chunks.length} 个切片入库)` },
    })

  } catch (error) {
    console.error('Reprocess document error:', error)
    await prisma.document.update({
      where: { id: documentId },
      data: { status: 'FAILED', progress: `处理失败: ${(error as Error).message}` },
    })
  }
}