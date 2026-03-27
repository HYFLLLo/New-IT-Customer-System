import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { addChunks, deleteChunks } from '@/lib/chroma'
import { parseDocument, getFileType } from '@/lib/parser'
import { DocumentStatus } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const UPLOAD_DIR = path.join(process.cwd(), 'uploads')

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true })
}

// GET /api/agent/knowledge - List all documents
export async function GET() {
  const documents = await prisma.document.findMany({
    include: {
      uploadedBy: { select: { id: true, name: true } },
      _count: { select: { chunks: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ documents })
}

// GET /api/agent/knowledge/[id]/progress - Get document processing progress
export async function GET_PROGRESS(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const document = await prisma.document.findUnique({
      where: { id },
      select: { status: true, progress: true },
    })

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      status: document.status,
      progress: document.progress || '',
    })
  } catch (error) {
    console.error('Get progress error:', error)
    return NextResponse.json(
      { error: 'Failed to get progress' },
      { status: 500 }
    )
  }
}

// POST /api/agent/knowledge - Upload new document
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const uploadedById = formData.get('uploadedById') as string | null
    const title = formData.get('title') as string | null

    if (!file || !uploadedById) {
      return NextResponse.json(
        { error: 'Missing file or uploadedById' },
        { status: 400 }
      )
    }

    const fileType = getFileType(file.name)
    if (!fileType) {
      return NextResponse.json(
        { error: 'Unsupported file type. Supported: PDF, Markdown, Word (.docx)' },
        { status: 400 }
      )
    }

    // Save file to disk
    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    const filePath = path.join(UPLOAD_DIR, fileName)
    const buffer = Buffer.from(await file.arrayBuffer())
    fs.writeFileSync(filePath, buffer)

    // Create document record
    const document = await prisma.document.create({
      data: {
        title: title || file.name,
        fileName: file.name,
        fileType,
        filePath,
        status: 'PENDING',
        uploadedById,
      },
    })

    // Start processing in background
    processDocument(document.id, filePath, fileType).catch(console.error)

    return NextResponse.json({ document }, { status: 201 })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload document' },
      { status: 500 }
    )
  }
}

async function updateProgress(documentId: string, status: DocumentStatus, progress: string) {
  await prisma.document.update({
    where: { id: documentId },
    data: { status, progress },
  })
}

async function processDocument(
  documentId: string,
  filePath: string,
  fileType: 'PDF' | 'MARKDOWN' | 'DOCX'
) {
  try {
    // Update status to processing
    await updateProgress(documentId, 'PROCESSING', '正在解析文档...')

    // Parse document
    const { chunks } = await parseDocument(filePath, fileType)

    if (chunks.length === 0) {
      await updateProgress(documentId, 'FAILED', '文档解析失败，未找到有效内容')
      return
    }

    // Prepare chunk data
    const chunkData = chunks.map((content, index) => ({
      id: `${documentId}-chunk-${index}`,
      content,
      metadata: { documentId, chunkIndex: index },
    }))

    // Step 1: Generate embeddings
    await updateProgress(documentId, 'PROCESSING', `正在生成向量 (0/${chunks.length})...`)
    
    const { embedText } = await import('@/lib/minimax')
    const batchSize = 5
    
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize)
      const embeddings = await Promise.all(
        batch.map(chunk => embedText(chunk))
      )
      
      // Normalize
      const normalizedEmbeddings = embeddings.map((emb: number[]) => {
        const mag = Math.sqrt(emb.reduce((s: number, v: number) => s + v * v, 0))
        return mag > 0 ? emb.map((v: number) => v / mag) : emb
      })
      
      // Update progress
      const progress = Math.min(i + batchSize, chunks.length)
      await updateProgress(documentId, 'PROCESSING', `正在生成向量 (${progress}/${chunks.length})...`)
    }

    // Step 2: Store in ChromaDB
    await updateProgress(documentId, 'PROCESSING', `正在入库 (0/${chunks.length})...`)
    
    const { ChromaClient } = await import('chromadb')
    const client = new ChromaClient({ path: 'http://localhost:8000' })
    const col = await client.getCollection({ name: 'knowledge_base' })
    
    for (let i = 0; i < chunkData.length; i += batchSize) {
      const batch = chunkData.slice(i, i + batchSize)
      const batchEmbeddings = await Promise.all(
        batch.map(c => embedText(c.content))
      )
      const normalizedEmbeddings = batchEmbeddings.map((emb: number[]) => {
        const mag = Math.sqrt(emb.reduce((s: number, v: number) => s + v * v, 0))
        return mag > 0 ? emb.map((v: number) => v / mag) : emb
      })
      
      await col.add({
        ids: batch.map(c => c.id),
        embeddings: normalizedEmbeddings,
        documents: batch.map(c => c.content),
        metadatas: batch.map(c => c.metadata),
      })
      
      const progress = Math.min(i + batchSize, chunkData.length)
      await updateProgress(documentId, 'PROCESSING', `正在入库 (${progress}/${chunks.length})...`)
    }

    // Step 3: Save to database
    await updateProgress(documentId, 'PROCESSING', '正在保存元数据...')
    
    await prisma.chunk.createMany({
      data: chunkData.map((c) => ({
        documentId,
        content: c.content,
        chromaId: c.id,
      })),
    })

    // Update status to processed
    await updateProgress(documentId, 'PROCESSED', `已完成 (${chunks.length} 个切片入库)`)
    
  } catch (error) {
    console.error('Process document error:', error)
    await updateProgress(documentId, 'FAILED', `处理失败: ${(error as Error).message}`)
  }
}
