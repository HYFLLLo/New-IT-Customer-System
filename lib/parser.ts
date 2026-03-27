import { marked } from 'marked'
import mammoth from 'mammoth'
import * as fs from 'fs'
import * as path from 'path'

export interface ParsedContent {
  text: string
  chunks: string[]
}

const CHUNK_SIZE = 500 // Characters per chunk

function createChunks(text: string): string[] {
  const chunks: string[] = []
  
  // Clean up text
  const cleaned = text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  if (cleaned.length === 0) return chunks

  // Split by paragraphs first to preserve context
  const paragraphs = cleaned.split(/\n\n+/)

  let currentChunk = ''

  for (const para of paragraphs) {
    if (currentChunk.length + para.length + 2 <= CHUNK_SIZE) {
      currentChunk += (currentChunk ? '\n\n' : '') + para
    } else {
      if (currentChunk) {
        chunks.push(currentChunk.trim())
      }
      // If single paragraph is too long, split by sentences
      if (para.length > CHUNK_SIZE) {
        const sentences = para.match(/[^.!?]+[.!?]+/g) || [para]
        currentChunk = ''
        for (const sentence of sentences) {
          if (currentChunk.length + sentence.length <= CHUNK_SIZE) {
            currentChunk += sentence
          } else {
            if (currentChunk) chunks.push(currentChunk.trim())
            currentChunk = sentence
          }
        }
      } else {
        currentChunk = para
      }
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim())
  }

  return chunks
}

export async function parseMarkdown(filePath: string): Promise<ParsedContent> {
  const content = fs.readFileSync(filePath, 'utf-8')
  
  // Convert markdown to plain text (strip formatting)
  const html = await marked(content)
  const text = html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim()

  const chunks = createChunks(text)

  return { text, chunks }
}

export async function parseDocx(filePath: string): Promise<ParsedContent> {
  const result = await mammoth.extractRawText({ path: filePath })
  
  const text = result.value
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  const chunks = createChunks(text)

  return { text, chunks }
}

// PDF parsing - dynamically loaded at runtime to avoid ESM/CJS issues
async function parsePDF(filePath: string): Promise<ParsedContent> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require('pdf-parse')
    const dataBuffer = fs.readFileSync(filePath)
    const data = await pdfParse(dataBuffer)
    
    const text = data.text || ''
    const chunks = createChunks(text)

    return { text, chunks }
  } catch (error) {
    console.error('PDF parsing error:', error)
    return { text: '', chunks: [] }
  }
}

export async function parseDocument(
  filePath: string,
  fileType: 'PDF' | 'MARKDOWN' | 'DOCX'
): Promise<ParsedContent> {
  switch (fileType) {
    case 'PDF':
      return parsePDF(filePath)
    case 'MARKDOWN':
      return parseMarkdown(filePath)
    case 'DOCX':
      return parseDocx(filePath)
    default:
      throw new Error(`Unsupported file type: ${fileType}`)
  }
}

export function getFileType(fileName: string): 'PDF' | 'MARKDOWN' | 'DOCX' | null {
  const ext = path.extname(fileName).toLowerCase()
  switch (ext) {
    case '.pdf':
      return 'PDF'
    case '.md':
    case '.markdown':
    case '.txt':
      return 'MARKDOWN'
    case '.docx':
    case '.doc':
      return 'DOCX'
    default:
      return null
  }
}
