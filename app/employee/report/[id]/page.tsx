'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, FileText, CheckCircle, Phone, Loader2, Bot, AlertCircle, Wrench, Lightbulb, ListOrdered, FileCheck } from 'lucide-react'

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

// 解析 Markdown 格式的报告内容
function parseReportContent(content: string): { sections: Array<{ title: string; icon: any; level: number; body: string }> } {
  const sections: Array<{ title: string; icon: any; level: number; body: string }> = []
  
  // 按 ## 标题分割
  const parts = content.split(/\n##\s*/)
  
  // 第一个部分可能是 # 标题
  if (parts[0] && !parts[0].startsWith('##')) {
    const firstLine = parts[0].split('\n')[0].replace(/^#+\s*/, '').trim()
    if (firstLine) {
      sections.push({
        title: firstLine,
        icon: FileCheck,
        level: 1,
        body: parts[0].replace(/^#+\s*.*\n*/, '').trim(),
      })
    }
  }
  
  // 处理剩余的 ## 标题
  for (let i = 1; i < parts.length; i++) {
    const part = parts[i]
    const lines = part.split('\n')
    const title = lines[0].replace(/^#+\s*/, '').trim()
    const body = lines.slice(1).join('\n').trim()
    
    // 根据标题关键词选择图标
    let icon = FileText
    if (/问题|诊断|概述/.test(title)) icon = AlertCircle
    else if (/解决|处理|步骤|流程|操作/.test(title)) icon = Wrench
    else if (/注意|建议|提示/.test(title)) icon = Lightbulb
    else if (/清单|列表|项目/.test(title)) icon = ListOrdered
    
    sections.push({ title, icon, level: 2, body })
  }
  
  return { sections }
}

// 渲染列表内容
function renderList(body: string): React.ReactNode {
  const lines = body.split('\n').filter(l => l.trim())
  const items: React.ReactNode[] = []
  let currentText = ''
  let inTable = false
  let tableRows: string[][] = []
  let inList = false
  let listItems: string[] = []
  
  for (const line of lines) {
    // 表格行
    if (line.startsWith('|')) {
      if (!inTable) {
        inTable = true
        tableRows = []
      }
      const cells = line.split('|').filter(c => c.trim() && !c.match(/^-+$/))
      if (cells.length > 0) tableRows.push(cells)
      continue
    } else if (inTable) {
      // 渲染表格
      if (tableRows.length > 0) {
        items.push(
          <div key={items.length} className="overflow-x-auto mb-3">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-[#1a1a2e]">
                  {tableRows[0].map((cell, idx) => (
                    <th key={idx} className="border border-[#2a2a4a] px-3 py-2 text-left text-[#00f0ff]">{cell.trim()}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableRows.slice(2).map((row, rowIdx) => (
                  <tr key={rowIdx} className="border border-[#2a2a4a]">
                    {row.map((cell, cellIdx) => (
                      <td key={cellIdx} className="border border-[#2a2a4a] px-3 py-2 text-[#ccccdd]">{cell.trim()}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      }
      inTable = false
      tableRows = []
    }
    
    // 有序列表项 (1. 2. 或 1、2、)
    const orderedMatch = line.match(/^(\d+)[.、]\s*(.+)/)
    if (orderedMatch) {
      inList = true
      listItems.push(`<span class="text-[#00f0ff] mr-2">${orderedMatch[1]}.</span>${orderedMatch[2]}`)
      continue
    } else if (inList && (line.match(/^\d+[.、]/) || line.startsWith('-'))) {
      const match = line.match(/^(\d+)[.、]\s*(.+)/) || line.match(/^-\s*(.+)/)
      if (match) {
        const numMatch = line.match(/^\d+/)
        const prefix = numMatch ? numMatch[0] : '•'
        listItems.push(`<span class="text-[#00f0ff] mr-2">${prefix}.</span>${match[2] || match[1]}`)
        continue
      }
    }
    
    // 无序列表项 (- 或 •)
    const bulletMatch = line.match(/^[-•]\s+(.+)/)
    if (bulletMatch) {
      listItems.push(`<span class="text-[#ff00aa] mr-2">•</span>${bulletMatch[1]}`)
      continue
    }
    
    // 渲染累积的列表
    if (inList && listItems.length > 0) {
      items.push(
        <ul key={items.length} className="space-y-2 mb-3">
          {listItems.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2" dangerouslySetInnerHTML={{ __html: item }} />
          ))}
        </ul>
      )
      listItems = []
      inList = false
    }
    
    // 标题标记行 (### 或 **bold**)
    if (line.startsWith('### ')) {
      items.push(
        <h4 key={items.length} className="text-[#00f0ff] font-medium text-sm mt-4 mb-2">
          {line.replace(/^###\s*/, '')}
        </h4>
      )
      continue
    }
    
    // 分割线
    if (line.match(/^---+$/)) continue
    
    // 普通段落 - 处理 **bold** 文本
    const processedLine = line
      .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
      .replace(/\n/g, '<br/>')
    
    if (processedLine.trim()) {
      items.push(
        <p key={items.length} className="text-[#ccccdd] mb-2 leading-relaxed" dangerouslySetInnerHTML={{ __html: processedLine }} />
      )
    }
  }
  
  // 渲染剩余的列表
  if (inList && listItems.length > 0) {
    items.push(
      <ul key={items.length} className="space-y-2 mb-3">
        {listItems.map((item, idx) => (
          <li key={idx} className="flex items-start gap-2" dangerouslySetInnerHTML={{ __html: item }} />
        ))}
      </ul>
    )
  }
  
  // 渲染剩余的表格
  if (inTable && tableRows.length > 0) {
    items.push(
      <div key={items.length} className="overflow-x-auto mb-3">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-[#1a1a2e]">
              {tableRows[0].map((cell, idx) => (
                <th key={idx} className="border border-[#2a2a4a] px-3 py-2 text-left text-[#00f0ff]">{cell.trim()}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableRows.slice(2).map((row, rowIdx) => (
              <tr key={rowIdx} className="border border-[#2a2a4a]">
                {row.map((cell, cellIdx) => (
                  <td key={cellIdx} className="border border-[#2a2a4a] px-3 py-2 text-[#ccccdd]">{cell.trim()}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }
  
  return items.length > 0 ? items : <p className="text-[#ccccdd]">{body}</p>
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
                <span>生成方式:</span>
                <Badge className={report.generatedBy === 'AI' 
                  ? 'bg-[#ff00aa]/10 border-[#ff00aa]/30 text-[#ff00aa]' 
                  : 'bg-[#00f0ff]/10 border-[#00f0ff]/30 text-[#00f0ff]'
                }>
                  {report.generatedBy === 'AI' ? 'AI 生成' : '人工生成'}
                </Badge>
              </div>
              {report.createdBy && (
                <div className="flex items-center gap-2">
                  <span>生成人:</span>
                  <span className="text-[#ccccdd]">{report.createdBy.name}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Original Problem */}
        <Card className="bg-[#12122a]/80 border-[#ff3366]/30 mb-6">
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

        {/* Report Sections */}
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
                  <CardContent className="space-y-2">
                    {renderList(section.body)}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <Card className="bg-[#12122a]/80 border-[#2a2a4a] mb-6">
            <CardContent>
              <pre className="whitespace-pre-wrap text-[#ccccdd] text-sm font-mono bg-[#0a0a0f] border border-[#2a2a4a] rounded-lg p-4">
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
