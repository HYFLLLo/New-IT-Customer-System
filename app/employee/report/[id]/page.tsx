'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, FileText, CheckCircle, Phone, Loader2, Bot, AlertCircle, Wrench, Lightbulb, Info } from 'lucide-react'

interface Report {
  id: string
  title: string
  content: string
  generatedBy: string
  createdAt: string
  ticket: {
    id: string
    title: string
    description: string
    employee: { id: string; name: string }
  }
  createdBy?: { id: string; name: string }
}

// 解析报告内容为结构化数据
function parseReportContent(content: string): { sections: Array<{ title: string; icon: any; items: string[]; text?: string }> } {
  const sections: Array<{ title: string; icon: any; items: string[]; text?: string }> = []
  
  // 按 【】 分割内容
  const parts = content.split(/【([^】]+)】/).filter(Boolean)
  
  const iconMap: Record<string, any> = {
    '问题描述': AlertCircle,
    '解决步骤': Wrench,
    '处理方案': Wrench,
    '注意事项': Lightbulb,
    '建议': Lightbulb,
    '诊断': Info,
    '结论': CheckCircle,
  }
  
  for (let i = 0; i < parts.length; i += 2) {
    const title = parts[i].trim()
    const body = parts[i + 1] || ''
    
    // 判断是列表还是段落
    const lines = body.split('\n').map((l: string) => l.trim()).filter(Boolean)
    const isList = lines.every((l: string) => /^\d+[.、]/.test(l) || l.startsWith('-') || l.startsWith('•'))
    
    sections.push({
      title,
      icon: iconMap[title] || FileText,
      items: isList ? lines : [],
      text: !isList ? body.trim() : undefined,
    })
  }
  
  return { sections }
}

export default function ReportPage() {
  const params = useParams()
  const reportId = params.id as string
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchReport()
  }, [reportId])

  const fetchReport = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/agent/reports/${reportId}`)
      
      if (!res.ok) {
        if (res.status === 404) {
          setError('报告不存在')
        } else {
          throw new Error('Failed to fetch')
        }
        return
      }

      const data = await res.json()
      setReport(data.report)
    } catch (err) {
      console.error('Error:', err)
      setError('加载失败')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] cyber-grid-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#00f0ff]" />
      </div>
    )
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] cyber-grid-bg flex items-center justify-center">
        <Card className="bg-[#12122a]/80 border-[#2a2a4a] max-w-md">
          <CardContent className="text-center py-12">
            <FileText className="w-12 h-12 mx-auto text-[#8888aa] mb-4 opacity-50" />
            <p className="text-[#8888aa] mb-4">{error || '报告不存在'}</p>
            <Link href="/employee/history">
              <Button variant="outline" className="border-[#00f0ff]/30 text-[#00f0ff] hover:bg-[#00f0ff]/10">
                返回历史记录
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { sections } = parseReportContent(report.content)

  return (
    <div className="min-h-screen bg-[#0a0a0f] cyber-grid-bg">
      {/* Header */}
      <header className="bg-[#12122a]/80 backdrop-blur-sm border-b border-[#2a2a4a] sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <Link 
            href="/employee/history" 
            className="text-[#8888aa] hover:text-[#00f0ff] text-sm inline-flex items-center gap-1 mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            返回
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#ff00aa]/20 to-[#ff00aa]/5 rounded-xl flex items-center justify-center border border-[#ff00aa]/30 cyber-glow-pink">
              <Bot className="w-5 h-5 text-[#ff00aa]" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-white">{report.title}</h1>
              <p className="text-sm text-[#8888aa]">
                工单: {report.ticket.title} · {new Date(report.createdAt).toLocaleString('zh-CN')}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Report Meta */}
        <Card className="bg-[#12122a]/80 border-[#2a2a4a] mb-6">
          <CardContent className="pt-4">
            <div className="flex flex-wrap gap-4 text-sm text-[#8888aa]">
              <div className="flex items-center gap-2">
                <span className="text-[#8888aa]">生成方式:</span>
                <Badge className={report.generatedBy === 'AI' 
                  ? 'bg-[#ff00aa]/10 border-[#ff00aa]/30 text-[#ff00aa]' 
                  : 'bg-[#00f0ff]/10 border-[#00f0ff]/30 text-[#00f0ff]'
                }>
                  {report.generatedBy === 'AI' ? 'AI 生成' : '人工生成'}
                </Badge>
              </div>
              {report.createdBy && (
                <div className="flex items-center gap-2">
                  <span className="text-[#8888aa]">生成人:</span>
                  <span className="text-[#ccccdd]">{report.createdBy.name}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Original Problem */}
        <Card className="bg-[#12122a]/80 border-[#2a2a4a] mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-base flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-[#ff3366]" />
              原始问题
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[#ccccdd]">{report.ticket.description}</p>
          </CardContent>
        </Card>

        {/* Report Content - Structured Rendering */}
        {sections.length > 0 ? (
          <div className="space-y-4 mb-6">
            {sections.map((section, idx) => {
              const Icon = section.icon
              return (
                <Card key={idx} className="bg-[#12122a]/80 border-[#2a2a4a]">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-white text-base flex items-center gap-2">
                      <Icon className="w-4 h-4 text-[#00f0ff]" />
                      {section.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {section.items.length > 0 ? (
                      <ul className="space-y-2">
                        {section.items.map((item, itemIdx) => (
                          <li key={itemIdx} className="flex items-start gap-3">
                            <span className="w-6 h-6 rounded-full bg-[#00f0ff]/10 border border-[#00f0ff]/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-xs text-[#00f0ff] font-medium">{itemIdx + 1}</span>
                            </span>
                            <span className="text-[#ccccdd] flex-1">{item.replace(/^\d+[.、]\s*/, '')}</span>
                          </li>
                        ))}
                      </ul>
                    ) : section.text ? (
                      <p className="text-[#ccccdd] whitespace-pre-wrap leading-relaxed">{section.text}</p>
                    ) : null}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          /* Fallback: plain text if no sections found */
          <Card className="bg-[#12122a]/80 border-[#2a2a4a] mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-base flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#ff00aa]" />
                质检报告
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="whitespace-pre-wrap text-[#ccccdd] font-sans bg-[#0a0a0f] border border-[#2a2a4a] rounded-lg p-4">
                {report.content}
              </pre>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <Card className="bg-[#12122a]/80 border-[#2a2a4a]">
          <CardContent className="pt-4">
            <p className="text-[#8888aa] mb-4 text-sm">问题是否解决了？</p>
            <div className="flex flex-wrap gap-4">
              <Link href={`/employee/feedback/${report.ticket.id}`}>
                <Button className="bg-gradient-to-r from-[#00ff88] to-[#00cc66] text-[#0a0a0f] hover:opacity-90">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  问题已解决
                </Button>
              </Link>
              <Button
                onClick={() => alert('工作人员将尽快联系您，请保持电话畅通')}
                className="bg-gradient-to-r from-[#ff3366] to-[#ff00aa] text-white hover:opacity-90"
              >
                <Phone className="w-4 h-4 mr-2" />
                联系工作人员
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
