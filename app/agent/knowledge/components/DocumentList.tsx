'use client'

import { useState, useEffect, Fragment } from 'react'
import useSWR from 'swr'
import { toast } from 'sonner'
import { StatusBadge } from './StatusBadge'
import {
  ChevronDown,
  ChevronRight,
  Trash2,
  RefreshCw,
  Loader2,
  Eye,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  FileText,
  Clock,
  User,
  Copy,
  Check
} from 'lucide-react'
import { DocumentStatus } from '@prisma/client'

interface Document {
  id: string
  title: string
  fileName: string
  fileType: string
  status: DocumentStatus
  progress: string | null
  createdAt: string
  uploadedBy: { id: string; name: string }
  chunks: Chunk[]
  _count?: { chunks: number }
}

interface Chunk {
  id: string
  content: string
  chunkIndex: number
}

interface DocumentListProps {
  refreshKey: number
}

const fetcher = (url: string) => fetch(url).then((res) => {
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
})

const ITEMS_PER_PAGE = 10

export function DocumentList({ refreshKey }: DocumentListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [chunksMap, setChunksMap] = useState<Record<string, Chunk[]>>({})
  const [expandedChunks, setExpandedChunks] = useState<Record<string, boolean>>({})
  const [copiedChunkId, setCopiedChunkId] = useState<string | null>(null)

  // Fetch documents with 5-second polling
  const { data, error, isLoading, mutate } = useSWR<{ documents: Document[] }>(
    '/api/agent/knowledge',
    fetcher,
    {
      refreshInterval: 5000,
      revalidateOnFocus: true,
    }
  )

  // Trigger refresh when refreshKey changes
  useEffect(() => {
    mutate()
  }, [refreshKey, mutate])

  // Fetch chunks for a specific document
  const fetchChunks = async (documentId: string) => {
    if (chunksMap[documentId]) return

    try {
      const res = await fetch(`/api/agent/knowledge/${documentId}/chunks`)
      if (res.ok) {
        const data = await res.json()
        setChunksMap(prev => ({ ...prev, [documentId]: data.chunks || [] }))
      }
    } catch (error) {
      console.error('Failed to fetch chunks:', error)
    }
  }

  const handleRowClick = async (doc: Document) => {
    if (expandedId === doc.id) {
      setExpandedId(null)
    } else {
      setExpandedId(doc.id)
      if (!chunksMap[doc.id]) {
        await fetchChunks(doc.id)
      }
    }
  }

  const handleDelete = async (documentId: string, e: React.MouseEvent) => {
    e.stopPropagation()

    if (!confirm('确定要删除此文档吗？')) return

    try {
      const res = await fetch(`/api/agent/knowledge/${documentId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        toast.success('文档已删除')
        mutate()
      } else {
        toast.error('删除失败')
      }
    } catch (error) {
      toast.error('删除失败')
    }
  }

  const handleReprocess = async (documentId: string, e: React.MouseEvent) => {
    e.stopPropagation()

    try {
      const res = await fetch(`/api/agent/knowledge/${documentId}/reprocess`, {
        method: 'POST',
      })

      if (res.ok) {
        toast.success('已开始重新处理')
        mutate()
      } else {
        toast.error('重新处理失败')
      }
    } catch (error) {
      toast.error('重新处理失败')
    }
  }

  const toggleChunkExpand = (chunkId: string) => {
    setExpandedChunks(prev => ({ ...prev, [chunkId]: !prev[chunkId] }))
  }

  const handleCopyChunk = async (chunk: Chunk) => {
    try {
      await navigator.clipboard.writeText(chunk.content)
      setCopiedChunkId(chunk.id)
      setTimeout(() => setCopiedChunkId(null), 2000)
    } catch (error) {
      toast.error('复制失败')
    }
  }

  const documents = data?.documents || []
  const totalPages = Math.ceil(documents.length / ITEMS_PER_PAGE)
  const paginatedDocuments = documents.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  // Reset to page 1 when documents change
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1)
    }
  }, [documents.length, totalPages, currentPage])

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        加载文档列表失败
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="w-8 px-4 py-3"></th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  文档名称
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  上传时间
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Chunk数量
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
                    <p className="mt-2 text-sm text-gray-500">加载中...</p>
                  </td>
                </tr>
              ) : documents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                    暂无文档
                  </td>
                </tr>
              ) : (
                paginatedDocuments.map((doc) => (
                  <Fragment key={doc.id}>
                    <tr
                      className={`cursor-pointer hover:bg-gray-50 transition-colors ${
                        expandedId === doc.id ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => handleRowClick(doc)}
                    >
                      <td className="px-4 py-4">
                        {expandedId === doc.id ? (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-gray-400" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {doc.title}
                            </div>
                            <div className="text-xs text-gray-500">
                              {doc.fileName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <StatusBadge status={doc.status} />
                          {doc.status === 'PROCESSING' && doc.progress && (
                            <span className="text-xs text-gray-500 max-w-[120px] truncate">
                              {doc.progress}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5 text-sm text-gray-500">
                          <Clock className="w-4 h-4" />
                          {new Date(doc.createdAt).toLocaleString('zh-CN')}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500">
                        {doc._count?.chunks ?? doc.chunks?.length ?? 0}
                      </td>
                      <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleRowClick(doc)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="查看详情"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => handleReprocess(doc.id, e)}
                            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                            title="重新处理"
                            disabled={doc.status === 'PROCESSING'}
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => handleDelete(doc.id, e)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="删除"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded Detail Panel */}
                    {expandedId === doc.id && (
                      <tr>
                        <td colSpan={6} className="px-4 py-4 bg-blue-50/50">
                          <div className="space-y-4">
                            {/* Document Info */}
                            <div className="bg-white rounded-lg border border-gray-200 p-4">
                              <h4 className="text-sm font-medium text-gray-900 mb-3">
                                文档信息
                              </h4>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                  <div className="text-xs text-gray-500 mb-1">文件类型</div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {doc.fileType}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-500 mb-1">上传人</div>
                                  <div className="text-sm font-medium text-gray-900 flex items-center gap-1">
                                    <User className="w-3 h-3" />
                                    {doc.uploadedBy?.name || '未知'}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-500 mb-1">上传时间</div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {new Date(doc.createdAt).toLocaleString('zh-CN')}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-500 mb-1">处理状态</div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {doc.progress || (doc.status === 'PROCESSED' ? '已完成' : doc.status === 'FAILED' ? '处理失败' : '等待中')}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Chunks List */}
                            <div className="bg-white rounded-lg border border-gray-200 p-4">
                              <h4 className="text-sm font-medium text-gray-900 mb-3">
                                Chunk 列表 ({chunksMap[doc.id]?.length ?? doc.chunks?.length ?? 0})
                              </h4>
                              {!chunksMap[doc.id] ? (
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  加载中...
                                </div>
                              ) : chunksMap[doc.id].length === 0 ? (
                                <p className="text-sm text-gray-500">暂无 Chunk 数据</p>
                              ) : (
                                <div className="space-y-2">
                                  {chunksMap[doc.id].map((chunk) => (
                                    <div
                                      key={chunk.id}
                                      className="border border-gray-200 rounded-lg overflow-hidden"
                                    >
                                      <div
                                        className="flex items-center justify-between px-3 py-2 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                                        onClick={() => toggleChunkExpand(chunk.id)}
                                      >
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs font-medium text-gray-600">
                                            Chunk #{chunk.chunkIndex + 1}
                                          </span>
                                          <span className="text-xs text-gray-400">
                                            ({chunk.content.length} 字符)
                                          </span>
                                        </div>
                                        {expandedChunks[chunk.id] ? (
                                          <ChevronDown className="w-4 h-4 text-gray-400" />
                                        ) : (
                                          <ChevronRight className="w-4 h-4 text-gray-400" />
                                        )}
                                      </div>

                                      {expandedChunks[chunk.id] ? (
                                        <div className="px-3 py-2 border-t border-gray-100">
                                          <div className="flex justify-end mb-2">
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation()
                                                handleCopyChunk(chunk)
                                              }}
                                              className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                                            >
                                              {copiedChunkId === chunk.id ? (
                                                <>
                                                  <Check className="w-3 h-3" />
                                                  已复制
                                                </>
                                              ) : (
                                                <>
                                                  <Copy className="w-3 h-3" />
                                                  复制
                                                </>
                                              )}
                                            </button>
                                          </div>
                                          <pre className="text-xs text-gray-600 whitespace-pre-wrap break-all bg-gray-50 p-2 rounded">
                                            {chunk.content}
                                          </pre>
                                        </div>
                                      ) : (
                                        <div className="px-3 py-2 border-t border-gray-100">
                                          <p className="text-xs text-gray-500 line-clamp-2">
                                            {chunk.content.slice(0, 100)}
                                            {chunk.content.length > 100 ? '...' : ''}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            显示 {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, documents.length)} 条，
            共 {documents.length} 条
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                    page === currentPage
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}