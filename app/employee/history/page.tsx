'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, FileText, Clock, CheckCircle, MessageSquare, Bot } from 'lucide-react'

const CURRENT_EMPLOYEE_ID = 'emp-001'

interface Ticket {
  id: string
  title: string
  description: string
  status: string
  confidence: number | null
  createdAt: string
  messages: Array<{ content: string; type: string }>
  qaReports: Array<{ id: string; title: string }>
  feedback: { rating: number } | null
}

const statusConfig: Record<string, { label: string; className: string }> = {
  OPEN: { label: '待处理', className: 'bg-[#ff3366]/10 border-[#ff3366]/30 text-[#ff3366]' },
  AI_ANSWERED: { label: 'AI已回答', className: 'bg-[#ffcc00]/10 border-[#ffcc00]/30 text-[#ffcc00]' },
  IN_PROGRESS: { label: '处理中', className: 'bg-[#00f0ff]/10 border-[#00f0ff]/30 text-[#00f0ff]' },
  RESOLVED: { label: '已解决', className: 'bg-[#00ff88]/10 border-[#00ff88]/30 text-[#00ff88]' },
  CLOSED: { label: '已关闭', className: 'bg-[#8888aa]/10 border-[#8888aa]/30 text-[#8888aa]' },
}

export default function HistoryPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTickets()
  }, [])

  const fetchTickets = async () => {
    try {
      const res = await fetch(`/api/tickets?employeeId=${CURRENT_EMPLOYEE_ID}`)
      const data = await res.json()
      setTickets(data.tickets || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] cyber-grid-bg">
      {/* Header */}
      <header className="bg-[#12122a]/80 backdrop-blur-sm border-b border-[#2a2a4a] sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/employee">
              <Button variant="ghost" size="sm" className="text-[#8888aa] hover:text-[#00f0ff] hover:bg-[#00f0ff]/10">
                <ArrowLeft className="w-4 h-4 mr-2" />
                返回
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#00f0ff]/20 to-[#00f0ff]/5 rounded-xl flex items-center justify-center border border-[#00f0ff]/30 cyber-glow">
                <Bot className="w-5 h-5 text-[#00f0ff]" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-white">我的工单</h1>
                <p className="text-sm text-[#8888aa]">共 {tickets.length} 个工单</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-[#00f0ff] border-t-transparent rounded-full mx-auto" />
          </div>
        ) : tickets.length === 0 ? (
          <Card className="bg-[#12122a]/80 backdrop-blur border-[#2a2a4a]">
            <CardContent className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto text-[#8888aa] mb-4 opacity-50" />
              <p className="text-[#8888aa] mb-4">暂无工单记录</p>
              <Link href="/employee">
                <Button className="bg-gradient-to-r from-[#00f0ff] to-[#00c0cc] text-[#0a0a0f] hover:opacity-90">
                  去提问
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {tickets.map((ticket) => (
              <Card key={ticket.id} className="bg-[#12122a]/80 backdrop-blur border-[#2a2a4a] hover:border-[#00f0ff]/50 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-[#00f0ff]/20 to-[#00f0ff]/5 rounded-lg flex items-center justify-center border border-[#00f0ff]/30">
                        <FileText className="w-5 h-5 text-[#00f0ff]" />
                      </div>
                      <div>
                        <CardTitle className="text-base text-white">{ticket.title}</CardTitle>
                        <div className="flex items-center gap-2 mt-1 text-sm text-[#8888aa]">
                          <Clock className="w-3 h-3" />
                          {new Date(ticket.createdAt).toLocaleString('zh-CN')}
                        </div>
                      </div>
                    </div>
                    <Badge className={statusConfig[ticket.status]?.className}>
                      {statusConfig[ticket.status]?.label || ticket.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-[#8888aa] mb-4 line-clamp-2">{ticket.description}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex gap-4 text-sm">
                      {ticket.qaReports.length > 0 && (
                        <Link
                          href={`/employee/report/${ticket.qaReports[0].id}`}
                          className="flex items-center gap-1 text-[#00f0ff] hover:text-[#00d0dd] transition-colors"
                        >
                          <FileText className="w-4 h-4" />
                          查看质检报告
                        </Link>
                      )}
                      {ticket.status === 'RESOLVED' && !ticket.feedback && (
                        <Link
                          href={`/employee/feedback/${ticket.id}`}
                          className="flex items-center gap-1 text-[#00ff88] hover:text-[#00dd66] transition-colors"
                        >
                          <CheckCircle className="w-4 h-4" />
                          满意度评价
                        </Link>
                      )}
                      {ticket.feedback && (
                        <span className="flex items-center gap-1 text-[#8888aa]">
                          <CheckCircle className="w-4 h-4" />
                          已评价 {ticket.feedback.rating}星
                        </span>
                      )}
                    </div>
                    <Link href={`/employee/ticket/${ticket.id}`}>
                      <Button variant="ghost" size="sm" className="text-[#8888aa] hover:text-[#00f0ff] hover:bg-[#00f0ff]/10">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        详情
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
