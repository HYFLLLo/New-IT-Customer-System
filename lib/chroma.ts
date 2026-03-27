import { ChromaClient, Collection, Metadata } from 'chromadb'

const CHROMA_HOST = process.env.CHROMA_HOST || 'localhost'
const CHROMA_PORT = process.env.CHROMA_PORT || '8000'
const COLLECTION_NAME = 'knowledge_base'

let client: ChromaClient | null = null
let collection: Collection | null = null

export async function getChromaClient(): Promise<ChromaClient> {
  if (!client) {
    client = new ChromaClient({
      path: `http://${CHROMA_HOST}:${CHROMA_PORT}`,
    })
  }
  return client
}

export async function getCollection(): Promise<Collection> {
  if (!collection) {
    const c = await getChromaClient()
    try {
      collection = await c.getCollection({ name: COLLECTION_NAME })
    } catch {
      // Collection doesn't exist, create it
      collection = await c.createCollection({
        name: COLLECTION_NAME,
        metadata: { description: 'IT Helpdesk Knowledge Base' },
      })
    }
  }
  return collection
}

export interface SearchResult {
  id: string
  content: string
  distance: number
  metadata: Record<string, unknown>
}

export async function searchChunks(
  query: string,
  nResults: number = 5
): Promise<SearchResult[]> {
  const col = await getCollection()
  
  // Generate embedding for the query using MiniMax
  const { embedText } = await import('./minimax')
  const embedding = await embedText(query)

  const results = await col.query({
    queryEmbeddings: [embedding],
    nResults,
    include: ['documents', 'metadatas', 'distances'],
  })

  const searchResults: SearchResult[] = []
  if (results.ids && results.ids[0]) {
    for (let i = 0; i < results.ids[0].length; i++) {
      searchResults.push({
        id: results.ids[0][i],
        content: results.documents?.[0]?.[i] || '',
        distance: results.distances?.[0]?.[i] ?? 1,
        metadata: results.metadatas?.[0]?.[i] || {},
      })
    }
  }

  return searchResults
}

export async function addChunks(
  chunks: Array<{ id: string; content: string; metadata?: Record<string, unknown> }>
): Promise<void> {
  const col = await getCollection()
  const { embedText } = await import('./minimax')

  // Generate embeddings in batch
  const embeddings = await Promise.all(
    chunks.map((chunk) => embedText(chunk.content))
  )

  await col.add({
    ids: chunks.map((c) => c.id),
    embeddings,
    documents: chunks.map((c) => c.content),
    metadatas: chunks.map((c) => c.metadata as Metadata || {}),
  })
}

export async function deleteChunks(ids: string[]): Promise<void> {
  const col = await getCollection()
  await col.delete({ ids })
}

export async function deleteCollection(): Promise<void> {
  const c = await getChromaClient()
  try {
    await c.deleteCollection({ name: COLLECTION_NAME })
    collection = null
  } catch {
    // Collection doesn't exist
  }
}
