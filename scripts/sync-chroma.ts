// Script to sync PostgreSQL chunks to ChromaDB
import { PrismaClient } from '@prisma/client'
import { ChromaClient, Collection } from 'chromadb'

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
})

const CHROMA_HOST = process.env.CHROMA_HOST || 'localhost'
const CHROMA_PORT = process.env.CHROMA_PORT || '8000'
const COLLECTION_NAME = 'knowledge_base'

async function embedText(text: string): Promise<number[]> {
  // Using MiniMax embedding API
  const response = await fetch('https://api.minimax.chat/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.MINIMAX_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'embo-01',
      texts: [text],
    }),
  })

  if (!response.ok) {
    throw new Error(`Embedding API error: ${response.status}`)
  }

  const data = await response.json()
  return data.embeddings?.[0]?.embedding || []
}

async function main() {
  console.log('Syncing chunks to ChromaDB...')

  // Connect to ChromaDB
  const client = new ChromaClient({
    path: `http://${CHROMA_HOST}:${CHROMA_PORT}`,
  })

  // Create or get collection
  let collection: Collection
  try {
    collection = await client.getCollection({ name: COLLECTION_NAME })
    console.log('Using existing collection')
  } catch {
    collection = await client.createCollection({
      name: COLLECTION_NAME,
      metadata: { description: 'IT Helpdesk Knowledge Base' },
    })
    console.log('Created new collection')
  }

  // Get all processed documents with chunks
  const documents = await prisma.document.findMany({
    where: { status: 'PROCESSED' },
    include: { chunks: true },
  })

  console.log(`Found ${documents.length} documents with chunks`)

  // Add chunks to ChromaDB
  let totalChunks = 0
  for (const doc of documents) {
    for (const chunk of doc.chunks) {
      try {
        const embedding = await embedText(chunk.content)
        
        await collection.add({
          ids: [chunk.chromaId],
          embeddings: [embedding],
          documents: [chunk.content],
          metadatas: [{ 
            documentId: doc.id, 
            documentTitle: doc.title,
            chunkIndex: doc.chunks.indexOf(chunk)
          }],
        })
        
        totalChunks++
        console.log(`Added chunk: ${chunk.chromaId}`)
      } catch (error) {
        console.error(`Error adding chunk ${chunk.chromaId}:`, error)
      }
    }
  }

  console.log(`\nSync completed! Added ${totalChunks} chunks to ChromaDB.`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
