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
  metadata: {
    doc_name?: string
    header?: string
    tags?: string[]
    chunk_index?: number
    source?: string
  }
}

export interface SearchOptions {
  nResults?: number
  filter?: {
    doc_name?: string
    tags?: string[]
  }
}

/**
 * Simple keyword extraction for hybrid search
 */
function extractKeywords(text: string): string[] {
  // Chinese and English word extraction
  const chineseWords = text.match(/[\u4e00-\u9fa5]{2,}/g) || []
  const englishWords = text.match(/[a-zA-Z]{3,}/g) || []
  
  // Common stopwords to filter out
  const stopwords = new Set([
    '这个', '那个', '什么', '怎么', '如何', '为什么', '因为', '所以',
    '但是', '而且', '或者', '如果', '虽然', '应该', '可以', '需要',
    'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can',
    'had', 'her', 'was', 'one', 'our', 'out', 'has', 'have', 'been'
  ])
  
  const filtered = [...chineseWords, ...englishWords]
    .filter(w => !stopwords.has(w.toLowerCase()))
    .filter(w => w.length >= 2)
  
  // Return unique keywords
  return [...new Set(filtered)]
}

/**
 * Calculate keyword overlap score between query and document
 */
function keywordOverlapScore(query: string, document: string): number {
  const queryKeywords = new Set(extractKeywords(query.toLowerCase()))
  const docKeywords = new Set(extractKeywords(document.toLowerCase()))
  
  if (queryKeywords.size === 0) return 0.5
  
  let overlap = 0
  queryKeywords.forEach(kw => {
    if (docKeywords.has(kw)) overlap++
  })
  
  return overlap / queryKeywords.size
}

/**
 * RRF (Reciprocal Rank Fusion) for combining multiple retrieval results
 */
function rrfFusion<T extends { distance: number }>(
  results1: T[],
  results2: T[],
  k: number = 60
): T[] {
  const scoreMap = new Map<string, { item: T; score: number }>()
  
  // Score from first results (vector search)
  results1.forEach((item, idx) => {
    const key = item.id || String(idx)
    // Convert distance to similarity (lower distance = higher similarity)
    const similarity = Math.max(0, 1 - item.distance)
    scoreMap.set(key, { item, score: 1 / (k + idx + 1) + 0.5 * similarity })
  })
  
  // Score from second results (keyword search)
  results2.forEach((item, idx) => {
    const key = item.id || String(idx + 1000)
    const similarity = Math.max(0, 1 - item.distance)
    if (scoreMap.has(key)) {
      scoreMap.get(key)!.score += 1 / (k + idx + 1) + 0.5 * similarity
    } else {
      scoreMap.set(key, { item, score: 1 / (k + idx + 1) + 0.5 * similarity })
    }
  })
  
  // Sort by combined score
  return [...scoreMap.values()]
    .sort((a, b) => b.score - a.score)
    .map(entry => entry.item)
}

/**
 * Search chunks from knowledge base
 * Uses hybrid search: vector similarity + keyword overlap
 */
export async function searchChunks(
  query: string,
  nResults: number = 5,
  options?: SearchOptions
): Promise<SearchResult[]> {
  const col = await getCollection()
  
  // Generate embedding for the query
  const { embedText } = await import('./minimax')
  const embedding = await embedText(query)

  // Build where filter if options provided
  interface WhereFilter {
    doc_name?: { $eq?: string }
    tags?: { $contains?: string }
  }
  
  const where: WhereFilter | undefined = options?.filter?.doc_name
    ? { doc_name: { $eq: options.filter!.doc_name } }
    : undefined

  // Vector search
  const results = await col.query({
    queryEmbeddings: [embedding],
    nResults: nResults * 2, // Get more for reranking
    where,
    include: ['documents', 'metadatas', 'distances'],
  })

  const searchResults: SearchResult[] = []
  if (results.ids && results.ids[0]) {
    for (let i = 0; i < results.ids[0].length; i++) {
      const doc = results.documents?.[0]?.[i] || ''
      
      searchResults.push({
        id: results.ids[0][i],
        content: doc,
        distance: results.distances?.[0]?.[i] ?? 1,
        metadata: {
          doc_name: results.metadatas?.[0]?.[i]?.doc_name as string || '',
          header: results.metadatas?.[0]?.[i]?.header as string || '',
          tags: (results.metadatas?.[0]?.[i]?.tags as string[]) || [],
          chunk_index: results.metadatas?.[0]?.[i]?.chunk_index as number || 0,
          source: results.metadatas?.[0]?.[i]?.source as string || '',
        },
      })
    }
  }

  // Keyword reranking: boost chunks that have keyword overlap with query
  const rerankedResults = searchResults.map(result => {
    const keywordScore = keywordOverlapScore(query, result.content)
    // Combine vector distance with keyword score
    // Vector similarity = 1 - normalized_distance
    const vectorSimilarity = Math.max(0, 1 - result.distance)
    // Final score: 60% vector + 40% keyword
    const combinedScore = 0.6 * vectorSimilarity + 0.4 * keywordScore
    return {
      ...result,
      distance: 1 - combinedScore, // Convert back to distance for consistency
      keywordScore,
    }
  })

  // Sort by combined score (lower distance = better)
  rerankedResults.sort((a, b) => a.distance - b.distance)

  // Return top N results
  return rerankedResults.slice(0, nResults)
}

/**
 * Simple keyword-based search fallback
 * Used for debugging or when embedding API is unavailable
 */
export async function keywordSearch(
  query: string,
  nResults: number = 5
): Promise<SearchResult[]> {
  const col = await getCollection()
  
  const keywords = extractKeywords(query)
  if (keywords.length === 0) {
    return []
  }

  // Get all chunks (this is not efficient for large collections)
  // In production, you'd want a proper keyword index
  const results = await col.query({
    queryEmbeddings: [new Array(768).fill(0)], // Dummy embedding
    nResults: 100, // Get more and filter
    include: ['documents', 'metadatas', 'distances'],
  })

  const searchResults: SearchResult[] = []
  if (results.ids && results.ids[0]) {
    for (let i = 0; i < results.ids[0].length; i++) {
      const doc = results.documents?.[0]?.[i] || ''
      const score = keywordOverlapScore(query, doc)
      
      if (score > 0.1) { // Threshold for keyword match
        searchResults.push({
          id: results.ids[0][i],
          content: doc,
          distance: 1 - score, // Convert to distance
          metadata: {
            doc_name: results.metadatas?.[0]?.[i]?.doc_name as string || '',
            header: results.metadatas?.[0]?.[i]?.header as string || '',
            tags: (results.metadatas?.[0]?.[i]?.tags as string[]) || [],
            chunk_index: results.metadatas?.[0]?.[i]?.chunk_index as number || 0,
            source: results.metadatas?.[0]?.[i]?.source as string || '',
          },
        })
      }
    }
  }

  // Sort by keyword score
  searchResults.sort((a, b) => a.distance - b.distance)
  
  return searchResults.slice(0, nResults)
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

export async function getCollectionStats(): Promise<{
  count: number
  metadata?: Record<string, unknown>
}> {
  try {
    const col = await getCollection()
    return {
      count: await col.count(),
      metadata: col.metadata || undefined,
    }
  } catch {
    return { count: 0 }
  }
}
