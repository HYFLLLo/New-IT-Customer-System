'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Send, FileText, Bot, User, Clock, CheckCircle, Loader2, MessageSquare } from 'lucide-react'

interface Ticket {
  id: string
  title: string
  description: string
  status: string
  confidence: number | null
  createdAt: string
  employee: { id: string; name: string; email: string }
  messages: Array<{ id: string; content: string; type: string; createdAt: string }>
  qaReports: Array<{ id: string; title: string; content: string; createdAt: string }>
}

const CURRENT_AGENT_ID = 'agent-001'

const fixedMessages = {
  '安排上门处理': '您好，您的工单已安排工作人员上门处理，请保持电话畅通。感谢您的耐心等待！',
  '发送质检报告': '您好！已为您发送详细的质检报告，请按照报告中的步骤操作。如有疑问或问题依旧存在，请联系工作人员。',
}

export default function TicketDetail() {
  const params = useParams()
  const router = useRouter()
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [messageType, setMessageType] = useState<'info' | 'report' | 'custom'>('info')
  const [messageContent, setMessageContent] = useState('')
  const [generatingReport, setGeneratingReport] = useState(false)
  const [reportTitle, setReportTitle] = useState('')
  const [reportContent, setReportContent] = useState('')

  useEffect(() => {
    fetchTicket()
  }, [params.id])

  const fetchTicket = async () => {
    try {
      const res = await fetch('/api/agent/tickets')
      const data = await res.json()
      const found = data.tickets?.find((t: any) => t.id === params.id)
      setTicket(found || null)
      if (found?.qaReports?.[0]) {
        setReportTitle(found.qaReports[0].title)
        setReportContent(found.qaReports[0].content)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async () => {
    if (!ticket || !messageContent.trim()) return

    setSending(true)
    try {
      await fetch('/api/agent/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: ticket.id,
          senderId: CURRENT_AGENT_ID,
          content: messageContent,
          type: 'AGENT',
        }),
      })
      setMessageContent('')
      toast.success('消息已发送')
      fetchTicket()
    } catch (error) {
      toast.error('发送失败')
    } finally {
      setSending(false)
    }
  }

  const handleGenerateReport = async () => {
    if (!ticket) return

    setGeneratingReport(true)
    try {
      const res = await fetch('/api/agent/reports', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId: ticket.id }),
      })
      const data = await res.json()
      setReportTitle(data.title || 'IT问题质检报告')
      setReportContent(data.content || '')
      toast.success('报告已生成')
    } catch (error) {
      toast.error('生成失败')
    } finally {
      setGeneratingReport(false)
    }
  }

  const handleSendReport = async () => {
    if (!ticket || !reportTitle.trim() || !reportContent.trim()) return

    setSending(true)
    try {
      await fetch('/api/agent/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: ticket.id,
          title: reportTitle,
          content: reportContent,
          generatedBy: 'AI',
          createdById: CURRENT_AGENT_ID,
        }),
      })
      toast.success('质检报告已发送')
      fetchTicket()
    } catch (error) {
      toast.error('发送失败')
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <p className="text-gray-500 mb-4">工单不存在</p>
          <Link href="/agent/dashboard" className="text-purple-600 hover:underline">
            返回工单列表
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/agent/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                返回
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">工单详情</h1>
              <p className="text-sm text-gray-500">ID: {ticket.id.slice(0, 8)}...</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Original Issue */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  原始问题
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700 whitespace-pre-wrap">{ticket.description}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500 mt-4 pt-4 border-t">
                    <span>提交人: {ticket.employee.name}</span>
                    <span>·</span>
                    <span>{ticket.employee.email}</span>
                    <span>·</span>
                    <span>{new Date(ticket.createdAt).toLocaleString('zh-CN')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Messages */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  对话记录
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {ticket.messages.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">暂无消息</p>
                  ) : (
                    ticket.messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`p-4 rounded-lg ${
                          msg.type === 'USER'
                            ? 'bg-blue-50 ml-4'
                            : msg.type === 'AI'
                            ? 'bg-gray-100 mx-4'
                            : 'bg-purple-50 mr-4'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-sm font-medium">
                            {msg.type === 'USER' ? ticket.employee.name : msg.type === 'AI' ? 'AI 助手' : '坐席人员'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(msg.createdAt).toLocaleString('zh-CN')}
                          </span>
                        </div>
                        <p className="text-gray-700 whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Send Message Section */}
            <Card>
              <CardHeader>
                <CardTitle>发送消息</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Tabs */}
                <div className="flex gap-2">
                  {[
                    { key: 'info', label: '快捷消息' },
                    { key: 'report', label: '发送质检报告' },
                    { key: 'custom', label: '自定义消息' },
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setMessageType(key as any)}
                      className={`px-4 py-2 rounded-lg text-sm ${
                        messageType === key
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {/* Info Messages */}
                {messageType === 'info' && (
                  <div className="space-y-2">
                    {Object.entries(fixedMessages).map(([key, value]) => (
                      <button
                        key={key}
                        onClick={() => setMessageContent(value)}
                        className="w-full text-left p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <p className="font-medium text-gray-900">{key}</p>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{value}</p>
                      </button>
                    ))}
                  </div>
                )}

                {/* Report */}
                {messageType === 'report' && (
                  <div className="space-y-4">
                    <Button
                      onClick={handleGenerateReport}
                      disabled={generatingReport}
                      variant="outline"
                      className="w-full"
                    >
                      {generatingReport ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Bot className="w-4 h-4 mr-2" />
                      )}
                      AI 生成质检报告草稿
                    </Button>

                    <input
                      type="text"
                      value={reportTitle}
                      onChange={(e) => setReportTitle(e.target.value)}
                      placeholder="报告标题"
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />

                    <textarea
                      value={reportContent}
                      onChange={(e) => setReportContent(e.target.value)}
                      rows={8}
                      placeholder="报告内容..."
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                    />

                    <Button
                      onClick={handleSendReport}
                      disabled={sending || !reportTitle.trim() || !reportContent.trim()}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      发送质检报告给员工
                    </Button>
                  </div>
                )}

                {/* Custom Message */}
                {messageType === 'custom' && (
                  <div className="space-y-4">
                    <textarea
                      value={messageContent}
                      onChange={(e) => setMessageContent(e.target.value)}
                      rows={4}
                      placeholder="输入要发送的消息..."
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={sending || !messageContent.trim()}
                      className="w-full bg-purple-600 hover:bg-purple-700"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      发送消息
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Ticket Status */}
            <Card>
              <CardHeader>
                <CardTitle>工单状态</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">当前状态</span>
                  <Badge variant={
                    ticket.status === 'OPEN' ? 'error' :
                    ticket.status === 'IN_PROGRESS' ? 'warning' :
                    ticket.status === 'RESOLVED' ? 'success' : 'secondary'
                  }>
                    {ticket.status === 'OPEN' ? '待处理' :
                     ticket.status === 'AI_ANSWERED' ? 'AI已回答' :
                     ticket.status === 'IN_PROGRESS' ? '处理中' :
                     ticket.status === 'RESOLVED' ? '已解决' : '已关闭'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">置信度</span>
                  <span>{ticket.confidence ? `${(ticket.confidence * 100).toFixed(0)}%` : 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">提交时间</span>
                  <span>{new Date(ticket.createdAt).toLocaleString('zh-CN')}</span>
                </div>
              </CardContent>
            </Card>

            {/* Employee Info */}
            <Card>
              <CardHeader>
                <CardTitle>员工信息</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">姓名</span>
                  <span>{ticket.employee.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">邮箱</span>
                  <span>{ticket.employee.email}</span>
                </div>
              </CardContent>
            </Card>

            {/* QA Reports */}
            {ticket.qaReports.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    已发送报告
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {ticket.qaReports.map((report) => (
                    <div key={report.id} className="bg-green-50 rounded-lg p-3">
                      <p className="font-medium text-green-900">{report.title}</p>
                      <p className="text-sm text-green-700 mt-1 line-clamp-3">{report.content}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
