'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Bot, User, FileText, CheckCircle, Clock, Send } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const CURRENT_EMPLOYEE_ID = 'emp-001'

interface Ticket {
  id: string
  title: string
  description: string
  status: string
  confidence: number | null
  createdAt: string
  messages: Array<{
    id: string
    content: string
    type: string
    sender: { id: string; name: string }
    createdAt: string
    attachments?: Array<{ id: string; fileName: string; fileUrl: string }>
  }>
  qaReports: Array<{ id: string; title: string }>
  feedback: { rating: number; comment: string } | null
}

const statusConfig: Record<string, { label: string; className: string }> = {
  OPEN: { label: '待处理', className: 'bg-[#ff3366]/10 border-[#ff3366]/30 text-[#ff3366]' },
  AI_ANSWERED: { label: 'AI已回答', className: 'bg-[#ffcc00]/10 border-[#ffcc00]/30 text-[#ffcc00]' },
  IN_PROGRESS: { label: '处理中', className: 'bg-[#00f0ff]/10 border-[#00f0ff]/30 text-[#00f0ff]' },
  RESOLVED: { label: '已解决', className: 'bg-[#00ff88]/10 border-[#00ff88]/30 text-[#00ff88]' },
  CLOSED: { label: '已关闭', className: 'bg-[#8888aa]/10 border-[#8888aa]/30 text-[#8888aa]' },
}

export default function TicketDetailPage() {
  const params = useParams()
  const ticketId = params.id as string
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [loading, setLoading] = useState(true)
  const [replyContent, setReplyContent] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    fetchTicket()
  }, [ticketId])

  const fetchTicket = async () => {
    try {
      const res = await fetch(`/api/tickets/${ticketId}?employeeId=${CURRENT_EMPLOYEE_ID}`)
      const data = await res.json()
      setTicket(data.ticket)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleReply = async () => {
    if (!replyContent.trim() || sending) return
    setSending(true)
    try {
      await fetch(`/api/tickets/${ticketId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: replyContent,
          senderId: CURRENT_EMPLOYEE_ID,
          senderType: 'USER',
        }),
      })
      setReplyContent('')
      fetchTicket()
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] cyber-grid-bg flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-[#00f0ff] border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] cyber-grid-bg flex items-center justify-center">
        <Card className="bg-[#12122a]/80 border-[#2a2a4a] max-w-md">
          <CardContent className="text-center py-12">
            <FileText className="w-12 h-12 mx-auto text-[#8888aa] mb-4 opacity-50" />
            <p className="text-[#8888aa] mb-4">工单不存在</p>
            <Link href="/employee/history">
              <Button variant="outline" className="border-[#00f0ff]/30 text-[#00f0ff] hover:bg-[#00f0ff]/10">
                返回列表
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] cyber-grid-bg">
      {/* Header */}
      <header className="bg-[#12122a]/80 backdrop-blur-sm border-b border-[#2a2a4a] sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/employee/history">
                <Button variant="ghost" size="sm" className="text-[#8888aa] hover:text-[#00f0ff] hover:bg-[#00f0ff]/10">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  返回列表
                </Button>
              </Link>
              <Link href="/employee">
                <Button variant="ghost" size="sm" className="text-[#8888aa] hover:text-[#00f0ff] hover:bg-[#00f0ff]/10">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  返回主页
                </Button>
              </Link>
              <div>
                <h1 className="text-lg font-semibold text-white">{ticket.title}</h1>
                <p className="text-sm text-[#8888aa]">
                  {new Date(ticket.createdAt).toLocaleString('zh-CN')}
                </p>
              </div>
            </div>
            <Badge className={statusConfig[ticket.status]?.className}>
              {statusConfig[ticket.status]?.label || ticket.status}
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Original Problem */}
        <Card className="bg-[#12122a]/80 border-[#2a2a4a] mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-base flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#00f0ff]" />
              问题描述
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[#ccccdd]">{ticket.description}</p>
          </CardContent>
        </Card>

        {/* Conversation */}
        <div className="space-y-4 mb-6">
          {ticket.messages.map((msg) => {
            const isUser = msg.type === 'USER'
            return (
              <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'} gap-3`}>
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isUser 
                      ? 'bg-gradient-to-br from-[#00f0ff]/30 to-[#00f0ff]/10 border border-[#00f0ff]/30' 
                      : 'bg-gradient-to-br from-[#ff00aa]/30 to-[#ff00aa]/10 border border-[#ff00aa]/30'
                  }`}>
                    {isUser ? (
                      <User className="w-4 h-4 text-[#00f0ff]" />
                    ) : (
                      <Bot className="w-4 h-4 text-[#ff00aa]" />
                    )}
                  </div>
                  
                  {/* Message Bubble */}
                  <div className={`rounded-2xl px-4 py-3 ${
                    isUser
                      ? 'bg-gradient-to-br from-[#00f0ff]/20 to-[#00f0ff]/5 border border-[#00f0ff]/30'
                      : 'bg-[#1a1a2e] border border-[#2a2a4a]'
                  }`}>
                    <div className="text-xs text-[#8888aa] mb-1">
                      {msg.sender?.name || (isUser ? '我' : 'AI助手')} · {new Date(msg.createdAt).toLocaleString('zh-CN')}
                    </div>
                    {msg.type === 'AI' ? (
                      <div className="markdown-content">
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm]}
                          components={{
                            h1: ({children}) => <h1 className="text-[#00f0ff] font-bold text-lg mb-2 mt-3">{children}</h1>,
                            h2: ({children}) => <h2 className="text-[#00f0ff] font-bold text-base mb-2 mt-3">{children}</h2>,
                            h3: ({children}) => <h3 className="text-[#00f0ff] font-semibold text-sm mb-1 mt-2">{children}</h3>,
                            p: ({children}) => <p className="text-[#ccccdd] mb-2 leading-relaxed">{children}</p>,
                            ul: ({children}) => <ul className="list-disc list-inside text-[#ccccdd] mb-2 space-y-1">{children}</ul>,
                            ol: ({children}) => <ol className="list-decimal list-inside text-[#ccccdd] mb-2 space-y-1">{children}</ol>,
                            li: ({children}) => <li className="text-[#ccccdd]">{children}</li>,
                            code: ({children, className}) => {
                              const isInline = !className
                              return isInline ? (
                                <code className="bg-[#0a0a0f] text-[#00ff88] px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>
                              ) : (
                                <code className="block bg-[#0a0a0f] text-[#00ff88] p-3 rounded-lg text-sm font-mono overflow-x-auto">{children}</code>
                              )
                            },
                            pre: ({children}) => <pre className="bg-[#0a0a0f] border border-[#2a2a4a] rounded-lg p-3 mb-2 overflow-x-auto">{children}</pre>,
                            table: ({children}) => <table className="w-full border-collapse text-[#ccccdd] mb-2">{children}</table>,
                            th: ({children}) => <th className="border border-[#2a2a4a] bg-[#1a1a2e] px-3 py-2 text-left text-[#00f0ff]">{children}</th>,
                            td: ({children}) => <td className="border border-[#2a2a4a] px-3 py-2">{children}</td>,
                            a: ({href, children}) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-[#00f0ff] hover:underline">{children}</a>,
                            strong: ({children}) => <strong className="text-white font-semibold">{children}</strong>,
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-[#ccccdd] whitespace-pre-wrap">{msg.content}</p>
                    )}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {msg.attachments.map((att) => (
                          <a
                            key={att.id}
                            href={att.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-[#00f0ff] hover:text-[#00d0dd] flex items-center gap-1"
                          >
                            📎 {att.fileName}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Reply Input */}
        {ticket.status !== 'CLOSED' && (
          <Card className="bg-[#12122a]/80 border-[#2a2a4a]">
            <CardContent className="pt-4">
              <div className="flex gap-3">
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="输入回复内容..."
                  rows={3}
                  className="flex-1 bg-[#0a0a0f] border border-[#2a2a4a] rounded-lg px-4 py-3 text-[#ccccdd] placeholder-[#8888aa] focus:outline-none focus:border-[#00f0ff]/50 resize-none"
                />
              </div>
              <div className="flex justify-end mt-3">
                <Button
                  onClick={handleReply}
                  disabled={!replyContent.trim() || sending}
                  className="bg-gradient-to-r from-[#00f0ff] to-[#00c0cc] text-[#0a0a0f] hover:opacity-90"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {sending ? '发送中...' : '发送'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* QC Report & Feedback */}
        {ticket.qaReports.length > 0 && (
          <Card className="bg-[#12122a]/80 border-[#2a2a4a] mt-6">
            <CardContent className="pt-4">
              <Link
                href={`/employee/report/${ticket.qaReports[0].id}`}
                className="flex items-center gap-2 text-[#00f0ff] hover:text-[#00d0dd]"
              >
                <FileText className="w-4 h-4" />
                查看质检报告
              </Link>
            </CardContent>
          </Card>
        )}

        {ticket.status === 'RESOLVED' && !ticket.feedback && (
          <Card className="bg-[#12122a]/80 border-[#2a2a4a] mt-6">
            <CardContent className="pt-4">
              <Link
                href={`/employee/feedback/${ticket.id}`}
                className="flex items-center gap-2 text-[#00ff88] hover:text-[#00dd66]"
              >
                <CheckCircle className="w-4 h-4" />
                满意度评价
              </Link>
            </CardContent>
          </Card>
        )}

        {ticket.feedback && (
          <Card className="bg-[#12122a]/80 border-[#2a2a4a] mt-6">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-[#8888aa]">
                <CheckCircle className="w-4 h-4 text-[#00ff88]" />
                已评价：{ticket.feedback.rating}星 {ticket.feedback.comment && ` - ${ticket.feedback.comment}`}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
