import { NextRequest, NextResponse } from 'next/server'
import { searchChunks } from '@/lib/chroma'

export const runtime = 'nodejs'

/**
 * GET /api/search/test
 * Test retrieval effectiveness without generating answers
 *
 * Query params:
 * - query: string (required) - The search query
 * - topK: number (optional, default 10) - Number of results to return
 *
 * Response:
 * {
 *   results: Array<{
 *     id: string
 *     content: string
 *     distance: number
 *     metadata: {
 *       doc_name: string
 *       chunk_index: number
 *     }
 *   }>
 * }
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query')
    const topKParam = searchParams.get('topK')

    if (!query) {
      return NextResponse.json(
        { error: 'Missing required query parameter: query' },
        { status: 400 }
      )
    }

    const topK = topKParam ? parseInt(topKParam, 10) : 10

    if (isNaN(topK) || topK <= 0) {
      return NextResponse.json(
        { error: 'Invalid topK parameter: must be a positive integer' },
        { status: 400 }
      )
    }

    // Query ChromaDB for relevant chunks (pure retrieval, no answer generation)
    const searchResults = await searchChunks(query, topK, {
      hybridSearch: true,
      bm25Weight: 0.4,
    })

    // Format response according to spec
    const results = searchResults.map((result) => ({
      id: result.id,
      content: result.content,
      distance: result.distance,
      metadata: {
        doc_name: result.metadata?.doc_name || '',
        chunk_index: result.metadata?.chunk_index ?? 0,
      },
    }))

    return NextResponse.json({ results })
  } catch (error) {
    console.error('Search test API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}