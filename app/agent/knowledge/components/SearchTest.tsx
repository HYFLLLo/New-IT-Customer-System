'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { toast } from 'sonner'
import { Search, Loader2, FileText } from 'lucide-react'
import { ChunkPreview } from './ChunkPreview'

interface SearchResult {
  id: string
  content: string
  distance: number
  metadata: {
    doc_name: string
    chunk_index: number
  }
}

interface SearchResponse {
  results: SearchResult[]
}

const fetcher = (url: string) => fetch(url).then((res) => {
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
})

export function SearchTest() {
  const [query, setQuery] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedChunk, setSelectedChunk] = useState<{ id: string; content: string; chunkIndex: number } | null>(null)

  const { data, error, isLoading } = useSWR<SearchResponse>(
    searchQuery ? `/api/search/test?query=${encodeURIComponent(searchQuery)}&topK=10` : null,
    fetcher
  )

  const handleSearch = () => {
    if (!query.trim()) {
      toast.error('请输入搜索关键词')
      return
    }
    setSearchQuery(query.trim())
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const handleResultClick = (result: SearchResult) => {
    setSelectedChunk({
      id: result.id,
      content: result.content,
      chunkIndex: result.metadata.chunk_index,
    })
  }

  const escapeRegExp = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

  const highlightQuery = (text: string, query: string): React.ReactNode => {
    if (!query) return text
    const escapedQuery = escapeRegExp(query)
    const parts = text.split(new RegExp(`(${escapedQuery})`, 'gi'))
    return parts.map((part, index) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={index} className="bg-yellow-200 text-yellow-900 rounded px-0.5">
          {part}
        </mark>
      ) : (
        part
      )
    )
  }

  const results = data?.results || []

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入问题测试检索效果"
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={isLoading}
            className="px-6 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                搜索中
              </>
            ) : (
              '搜索'
            )}
          </button>
        </div>
      </div>

      {/* Results */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          搜索失败，请重试
        </div>
      )}

      {searchQuery && !isLoading && results.length === 0 && !error && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center text-gray-500">
          未找到相关结果
        </div>
      )}

      {results.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <span className="text-sm font-medium text-gray-700">
              找到 {results.length} 条相关结果
            </span>
          </div>
          <div className="divide-y divide-gray-100">
            {results.map((result, index) => (
              <div
                key={result.id}
                onClick={() => handleResultClick(result)}
                className="px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="flex items-start gap-3">
                  {/* Rank */}
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {result.metadata.doc_name}
                      </span>
                      <span className="text-xs text-gray-400">
                        Chunk #{result.metadata.chunk_index + 1}
                      </span>
                      <span className="ml-auto text-xs text-gray-500 font-mono">
                        {result.distance.toFixed(3)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {highlightQuery(result.content.slice(0, 150), searchQuery)}
                      {result.content.length > 150 && '...'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chunk Preview Modal */}
      <ChunkPreview
        chunk={selectedChunk}
        onClose={() => setSelectedChunk(null)}
      />
    </div>
  )
}