'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { List, ArrowLeft, Upload, FileText, Trash2, Loader2, CheckCircle, XCircle, Clock, BookOpen } from 'lucide-react'

interface Document {
  id: string
  title: string
  fileName: string
  fileType: string
  status: string
  createdAt: string
  uploadedBy: { id: string; name: string }
  _count: { chunks: number }
}

const statusConfig: Record<string, { label: string; className: string; icon: any }> = {
  PENDING: { label: '等待中', className: 'bg-[#8888aa]/10 border-[#8888aa]/30 text-[#8888aa]', icon: Clock },
  PROCESSING: { label: '处理中', className: 'bg-[#ffcc00]/10 border-[#ffcc00]/30 text-[#ffcc00]', icon: Loader2 },
  PROCESSED: { label: '已完成', className: 'bg-[#00ff88]/10 border-[#00ff88]/30 text-[#00ff88]', icon: CheckCircle },
  FAILED: { label: '失败', className: 'bg-[#ff3366]/10 border-[#ff3366]/30 text-[#ff3366]', icon: XCircle },
}

const fileTypeIcons: Record<string, string> = {
  PDF: '📄',
  MARKDOWN: '📝',
  DOCX: '📋',
}

export default function KnowledgePage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    const agentData = localStorage.getItem('agent')
    if (!agentData) {
      router.push('/agent/login')
      return
    }
    fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    try {
      const res = await fetch('/api/agent/knowledge')
      const data = await res.json()
      setDocuments(data.documents || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const agent = JSON.parse(localStorage.getItem('agent') || '{}')

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      toast.info(`正在上传: ${file.name}`)

      const formData = new FormData()
      formData.append('file', file)
      formData.append('uploadedById', agent.id || 'admin-001')
      formData.append('title', file.name.replace(/\.[^/.]+$/, ''))

      try {
        const res = await fetch('/api/agent/knowledge', {
          method: 'POST',
          body: formData,
        })

        if (!res.ok) {
          const error = await res.json()
          toast.error(`上传失败: ${error.error}`)
        } else {
          toast.success(`${file.name} 上传成功`)
        }
      } catch (error) {
        toast.error(`上传失败: ${file.name}`)
      }
    }

    e.target.value = ''
    fetchDocuments()
  }

  const handleDelete = async (docId: string) => {
    if (!confirm('确定要删除此文档吗？这将从知识库中移除所有相关切片。')) return

    try {
      await fetch(`/api/agent/knowledge/${docId}`, { method: 'DELETE' })
      toast.success('文档已删除')
      fetchDocuments()
    } catch (error) {
      toast.error('删除失败')
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] cyber-grid-bg">
      {/* Header */}
      <header className="bg-[#12122a]/80 backdrop-blur-sm border-b border-[#2a2a4a] sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/agent/dashboard">
                <Button variant="ghost" size="sm" className="text-[#8888aa] hover:text-[#ff00aa] hover:bg-[#ff00aa]/10">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  返回
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#ff00aa]/20 to-[#ff00aa]/5 rounded-xl flex items-center justify-center border border-[#ff00aa]/30 cyber-glow-pink">
                  <BookOpen className="w-5 h-5 text-[#ff00aa]" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-white">知识库管理</h1>
                  <p className="text-sm text-[#8888aa]">{documents.length} 个文档</p>
                </div>
              </div>
            </div>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.md,.markdown,.docx"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button onClick={() => fileInputRef.current?.click()} className="bg-gradient-to-r from-[#ff00aa] to-[#ff3366] text-white hover:opacity-90">
                {uploading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                上传文档
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Upload Info */}
        <Card className="mb-8 bg-[#12122a]/80 backdrop-blur border-[#00f0ff]/30">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#00f0ff]/20 to-[#00f0ff]/5 rounded-lg flex items-center justify-center border border-[#00f0ff]/30 flex-shrink-0">
                <Upload className="w-5 h-5 text-[#00f0ff]" />
              </div>
              <div>
                <h3 className="font-medium text-white mb-2">支持的文档格式</h3>
                <div className="flex flex-wrap gap-2 mb-2">
                  <span className="px-3 py-1 bg-[#0a0a0f] rounded-full text-sm text-[#00f0ff] border border-[#00f0ff]/30">📄 PDF (.pdf)</span>
                  <span className="px-3 py-1 bg-[#0a0a0f] rounded-full text-sm text-[#00f0ff] border border-[#00f0ff]/30">📝 Markdown (.md)</span>
                  <span className="px-3 py-1 bg-[#0a0a0f] rounded-full text-sm text-[#00f0ff] border border-[#00f0ff]/30">📋 Word (.docx)</span>
                </div>
                <p className="text-sm text-[#8888aa]">
                  上传后系统会自动解析文档内容，生成向量切片存入 ChromaDB 知识库。
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Document List */}
        <Card className="bg-[#12122a]/80 backdrop-blur border-[#2a2a4a]">
          <CardHeader>
            <CardTitle className="text-white">文档列表</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#ff00aa]" />
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center py-12 text-[#8888aa]">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>暂无文档</p>
                <p className="text-sm mt-2">点击右上角按钮上传第一份文档</p>
              </div>
            ) : (
              <div className="space-y-3">
                {documents.map((doc) => {
                  const status = statusConfig[doc.status] || statusConfig.PENDING
                  const StatusIcon = status.icon
                  return (
                    <div
                      key={doc.id}
                      className="flex items-center gap-4 p-4 rounded-xl border bg-[#0a0a0f] border-[#2a2a4a] hover:border-[#00f0ff]/50 transition-colors"
                    >
                      <div className="text-3xl">{fileTypeIcons[doc.fileType] || '📄'}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-white">{doc.title}</span>
                          <Badge className={`${status.className} flex items-center gap-1`}>
                            <StatusIcon className={`w-3 h-3 ${doc.status === 'PROCESSING' ? 'animate-spin' : ''}`} />
                            {status.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-[#8888aa]">
                          <span>{doc.fileName}</span>
                          <span>·</span>
                          <span>上传者: {doc.uploadedBy.name}</span>
                          <span>·</span>
                          <span>{new Date(doc.createdAt).toLocaleString('zh-CN')}</span>
                        </div>
                        {doc.status === 'PROCESSED' && (
                          <div className="flex items-center gap-1 text-sm text-[#00ff88] mt-1">
                            <CheckCircle className="w-4 h-4" />
                            {doc._count.chunks} 个切片已入库
                          </div>
                        )}
                      </div>
                      {doc.status === 'PROCESSED' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(doc.id)}
                          className="text-[#ff3366] hover:text-[#ff6688] hover:bg-[#ff3366]/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
