import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { addChunks, deleteChunks } from '@/lib/chroma'
import { parseDocument, getFileType } from '@/lib/parser'
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

async function processDocument(
  documentId: string,
  filePath: string,
  fileType: 'PDF' | 'MARKDOWN' | 'DOCX'
) {
  try {
    // Update status to processing
    await prisma.document.update({
      where: { id: documentId },
      data: { status: 'PROCESSING' },
    })

    // Parse document
    const { chunks } = await parseDocument(filePath, fileType)

    if (chunks.length === 0) {
      await prisma.document.update({
        where: { id: documentId },
        data: { status: 'FAILED' },
      })
      return
    }

    // Add chunks to ChromaDB
    const chunkData = chunks.map((content, index) => ({
      id: `${documentId}-chunk-${index}`,
      content,
      metadata: { documentId, chunkIndex: index },
    }))

    await addChunks(chunkData)

    // Save chunks to database
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
      data: { status: 'PROCESSED' },
    })
  } catch (error) {
    console.error('Process document error:', error)
    await prisma.document.update({
      where: { id: documentId },
      data: { status: 'FAILED' },
    })
  }
}
