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
  // BM25 specific fields
  bm25Score?: number
  vectorScore?: number
  combinedScore?: number
}

export interface SearchOptions {
  nResults?: number
  filter?: {
    doc_name?: string
    tags?: string[]
  }
  hybridSearch?: boolean  // Enable BM25 + vector hybrid search
  bm25Weight?: number   // Weight for BM25 (default 0.4)
}

// ============================================================================
// BM25 Implementation (In-Memory for simplicity)
// ============================================================================

interface BM25Document {
  id: string
  content: string
  metadata: SearchResult['metadata']
  tf: Map<string, number>  // term frequencies
}

class BM25Index {
  private documents: BM25Document[] = []
  private idf: Map<string, number> = new Map()
  private avgdl: number = 0
  private k1: number = 1.5
  private b: number = 0.75

  /**
   * Tokenize text into words (Chinese + English)
   */
  private tokenize(text: string): string[] {
    // Extract Chinese words (2+ chars)
    const chinese = text.match(/[\u4e00-\u9fa5]{2,}/g) || []
    // Extract English words (3+ chars)
    const english = text.match(/[a-zA-Z]{3,}/g) || []
    // Combine and lowercase
    return [...chinese, ...english.map(w => w.toLowerCase())]
  }

  /**
   * Build the BM25 index from documents
   */
  build(docs: Array<{ id: string; content: string; metadata: SearchResult['metadata'] }>) {
    this.documents = []
    const docLengths: number[] = []

    for (const doc of docs) {
      const terms = this.tokenize(doc.content)
      const tf = new Map<string, number>()

      for (const term of terms) {
        tf.set(term, (tf.get(term) || 0) + 1)
      }

      this.documents.push({
        id: doc.id,
        content: doc.content,
        metadata: doc.metadata,
        tf,
      })

      docLengths.push(terms.length)
    }

    this.avgdl = docLengths.reduce((a, b) => a + b, 0) / this.documents.length

    // Calculate IDF for all terms
    const documentCount = this.documents.length
    const termDocCount = new Map<string, number>()

    for (const doc of this.documents) {
      for (const term of doc.tf.keys()) {
        termDocCount.set(term, (termDocCount.get(term) || 0) + 1)
      }
    }

    for (const [term, count] of termDocCount) {
      // IDF formula: log((N - n + 0.5) / (n + 0.5))
      this.idf.set(term, Math.log((documentCount - count + 0.5) / (count + 0.5) + 1))
    }
  }

  /**
   * Get IDF value for a term (with smoothing)
   */
  private getIDF(term: string): number {
    return this.idf.get(term) || Math.log((this.documents.length + 0.5) / 0.5 + 1)
  }

  /**
   * Search the index and return BM25 scores
   */
  search(query: string, topK: number = 20): Array<{ id: string; content: string; metadata: SearchResult['metadata']; score: number }> {
    const queryTerms = this.tokenize(query)
    if (queryTerms.length === 0) return []

    const scores: Array<{ id: string; content: string; metadata: SearchResult['metadata']; score: number }> = []

    for (const doc of this.documents) {
      let score = 0

      for (const term of queryTerms) {
        const tf = doc.tf.get(term) || 0
        if (tf === 0) continue

        const idf = this.getIDF(term)
        const dl = [...doc.tf.values()].reduce((a, b) => a + b, 0)

        // BM25 formula
        const termScore = idf * (tf * (this.k1 + 1)) / (tf + this.k1 * (1 - this.b + this.b * (dl / this.avgdl)))
        score += termScore
      }

      if (score > 0) {
        scores.push({
          id: doc.id,
          content: doc.content,
          metadata: doc.metadata,
          score,
        })
      }
    }

    // Sort by score descending
    scores.sort((a, b) => b.score - a.score)

    return scores.slice(0, topK)
  }
}

// Global BM25 index cache
let bm25Index: BM25Index | null = null
let bm25IndexDocs: string[] = []

/**
 * Build or rebuild the BM25 index from ChromaDB
 */
async function buildBM25Index(): Promise<void> {
  const col = await getCollection()
  
  // Get all documents from ChromaDB
  const results = await col.get({
    limit: 1000,
    include: ['documents', 'metadatas'],
  })

  if (!results.ids || results.ids.length === 0) {
    bm25Index = null
    return
  }

  const docs = []
  for (let i = 0; i < results.ids.length; i++) {
    docs.push({
      id: results.ids[i],
      content: results.documents?.[i] || '',
      metadata: {
        doc_name: results.metadatas?.[i]?.doc_name as string || '',
        header: results.metadatas?.[i]?.header as string || '',
        tags: (results.metadatas?.[i]?.tags as string[]) || [],
        chunk_index: results.metadatas?.[i]?.chunk_index as number || 0,
        source: results.metadatas?.[i]?.source as string || '',
      },
    })
  }

  bm25Index = new BM25Index()
  bm25Index.build(docs)
  bm25IndexDocs = docs.map(d => d.id)
}

// ============================================================================
// Embedding Normalization
// ============================================================================

function normalizeEmbedding(embedding: number[]): number[] {
  const magnitude = Math.sqrt(embedding.reduce((sum, v) => sum + v * v, 0))
  if (magnitude > 0) {
    return embedding.map(v => v / magnitude)
  }
  return embedding
}

// ============================================================================
// Keyword Extraction for Reranking
// ============================================================================

function extractKeywords(text: string): string[] {
  const chinese = text.match(/[\u4e00-\u9fa5]{2,}/g) || []
  const english = text.match(/[a-zA-Z]{3,}/g) || []
  
  const stopwords = new Set([
    '这个', '那个', '什么', '怎么', '如何', '为什么', '因为', '所以',
    '但是', '而且', '或者', '如果', '虽然', '应该', '可以', '需要', '不是', '没有',
    'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'has', 'her', 'was', 'one', 'our'
  ])
  
  const filtered = [...chinese, ...english.map(w => w.toLowerCase())]
    .filter(w => !stopwords.has(w.toLowerCase()) && w.length >= 2)
  
  return [...new Set(filtered)]
}

/**
 * Calculate keyword overlap score between query and document
 */
function keywordOverlapScore(query: string, document: string): number {
  const queryKeywords = new Set(extractKeywords(query))
  const docKeywords = new Set(extractKeywords(document))
  
  if (queryKeywords.size === 0) return 0.5
  
  let overlap = 0
  queryKeywords.forEach(kw => {
    if (docKeywords.has(kw)) overlap++
  })
  
  return overlap / queryKeywords.size
}

// ============================================================================
// RRF Fusion
// ============================================================================

function rrfFusion<T extends { id: string; score: number }>(
  results1: T[],
  results2: T[],
  k: number = 60
): T[] {
  const scoreMap = new Map<string, { item: T; score: number }>()
  
  // Score from first results (BM25)
  results1.forEach((item, idx) => {
    scoreMap.set(item.id, { 
      item, 
      score: 1 / (k + idx + 1) 
    })
  })
  
  // Score from second results (vector)
  results2.forEach((item, idx) => {
    if (scoreMap.has(item.id)) {
      scoreMap.get(item.id)!.score += 1 / (k + idx + 1)
    } else {
      scoreMap.set(item.id, { 
        item, 
        score: 1 / (k + idx + 1) 
      })
    }
  })
  
  return [...scoreMap.values()]
    .sort((a, b) => b.score - a.score)
    .map(entry => entry.item)
}

// ============================================================================
// Search Implementation
// ============================================================================

export async function searchChunks(
  query: string,
  nResults: number = 5,
  options?: SearchOptions
): Promise<SearchResult[]> {
  const col = await getCollection()
  const bm25Weight = options?.bm25Weight ?? 0.4
  const useHybrid = options?.hybridSearch ?? true

  // Build BM25 index if needed
  if (useHybrid && (!bm25Index || bm25IndexDocs.length === 0)) {
    await buildBM25Index()
  }

  // Generate query embedding
  const { embedText } = await import('./minimax')
  let queryEmbedding = await embedText(query)
  
  // Normalize for cosine similarity
  queryEmbedding = normalizeEmbedding(queryEmbedding)

  // Build where filter if options provided
  interface WhereFilter {
    doc_name?: { $eq?: string }
  }
  // Note: filter暂未实现
  // Vector search
  const vectorResults = await col.query({
    queryEmbeddings: [queryEmbedding],
    nResults: nResults * 3, // Get more for reranking
    include: ['documents', 'metadatas', 'distances'],
  })

  const searchResults: SearchResult[] = []
  if (vectorResults.ids && vectorResults.ids[0]) {
    for (let i = 0; i < vectorResults.ids[0].length; i++) {
      const doc = vectorResults.documents?.[0]?.[i] || ''
      const distance = vectorResults.distances?.[0]?.[i] ?? 1
      
      searchResults.push({
        id: vectorResults.ids[0][i],
        content: doc,
        distance,
        metadata: {
          doc_name: vectorResults.metadatas?.[0]?.[i]?.doc_name as string || '',
          header: vectorResults.metadatas?.[0]?.[i]?.header as string || '',
          tags: (vectorResults.metadatas?.[0]?.[i]?.tags as string[]) || [],
          chunk_index: vectorResults.metadatas?.[0]?.[i]?.chunk_index as number || 0,
          source: vectorResults.metadatas?.[0]?.[i]?.source as string || '',
        },
        vectorScore: 1 - Math.min(distance, 1),
      })
    }
  }

  // BM25 search if hybrid mode
  if (useHybrid && bm25Index) {
    const bm25Results = bm25Index.search(query, nResults * 3)
    
    // Create a map of vector results by id
    const vectorMap = new Map(searchResults.map(r => [r.id, r]))
    
    // RRF fusion: combine BM25 and vector results
    const bm25Scored = bm25Results.map((r, idx) => ({
      id: r.id,
      content: r.content,
      metadata: r.metadata,
      score: r.score,
      rank: idx,
    }))
    
    const vectorScored = searchResults.map((r, idx) => ({
      id: r.id,
      content: r.content,
      metadata: r.metadata,
      score: r.vectorScore || 0,
      rank: idx,
    }))

    // Combine using RRF
    const fusedResults = rrfFusion(
      bm25Scored.map(r => ({ ...r, score: 1 / (60 + r.rank + 1) })),
      vectorScored.map(r => ({ ...r, score: 1 / (60 + r.rank + 1) })),
      60
    )

    // Merge back with full data
    const finalResults: SearchResult[] = []
    for (const fused of fusedResults.slice(0, nResults)) {
      const vecResult = vectorMap.get(fused.id)
      const bm25Result = bm25Results.find(r => r.id === fused.id)
      
      finalResults.push({
        id: fused.id,
        content: fused.content,
        distance: vecResult?.distance ?? 1,
        metadata: fused.metadata,
        bm25Score: bm25Result?.score || 0,
        vectorScore: vecResult?.vectorScore || 0,
        combinedScore: fused.score,
      })
    }

    // Apply keyword reranking on fused results
    return rerankWithKeywords(query, finalResults.slice(0, nResults))
  }

  // Vector-only mode with keyword reranking
  return rerankWithKeywords(query, searchResults.slice(0, nResults))
}

/**
 * Rerank results using keyword overlap
 */
function rerankWithKeywords(query: string, results: SearchResult[]): SearchResult[] {
  const keywordScores = results.map(result => ({
    ...result,
    keywordScore: keywordOverlapScore(query, result.content),
  }))

  // Combine: 50% vector, 30% BM25 (if exists), 20% keyword
  const reranked = keywordScores
    .map(r => {
      const vectorScore = r.vectorScore || (1 - Math.min(r.distance, 1))
      const bm25Score = r.bm25Score || 0
      const combined = 0.5 * vectorScore + 0.3 * bm25Score + 0.2 * r.keywordScore
      return {
        ...r,
        combinedScore: combined,
        distance: 1 - combined, // Convert back to distance for compatibility
      }
    })
    .sort((a, b) => (b.combinedScore || 0) - (a.combinedScore || 0))

  return reranked
}

/**
 * Force rebuild the BM25 index
 */
export async function rebuildBM25Index(): Promise<void> {
  bm25Index = null
  bm25IndexDocs = []
  await buildBM25Index()
}

// ============================================================================
// Legacy API functions for compatibility
// ============================================================================

export async function addChunks(
  chunks: Array<{ id: string; content: string; metadata?: Record<string, unknown> }>
): Promise<void> {
  const col = await getCollection()
  const { embedText } = await import('./minimax')

  // Generate embeddings in batch
  const embeddings = await Promise.all(
    chunks.map((chunk) => embedText(chunk.content))
  )

  // Normalize embeddings
  const normalizedEmbeddings = embeddings.map(normalizeEmbedding)

  await col.add({
    ids: chunks.map((c) => c.id),
    embeddings: normalizedEmbeddings,
    documents: chunks.map((c) => c.content),
    metadatas: chunks.map((c) => c.metadata as Metadata || {}),
  })

  // Invalidate BM25 cache
  bm25Index = null
  bm25IndexDocs = []
}

export async function deleteChunks(ids: string[]): Promise<void> {
  const col = await getCollection()
  await col.delete({ ids })
  
  // Invalidate BM25 cache
  bm25Index = null
  bm25IndexDocs = []
}

export async function deleteCollection(): Promise<void> {
  const c = await getChromaClient()
  try {
    await c.deleteCollection({ name: COLLECTION_NAME })
    collection = null
    bm25Index = null
    bm25IndexDocs = []
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
