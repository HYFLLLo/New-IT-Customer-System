'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, FileText, Clock, CheckCircle, MessageSquare } from 'lucide-react'

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

const statusConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'error' | 'secondary' }> = {
  OPEN: { label: '待处理', variant: 'error' },
  AI_ANSWERED: { label: 'AI已回答', variant: 'warning' },
  IN_PROGRESS: { label: '处理中', variant: 'warning' },
  RESOLVED: { label: '已解决', variant: 'success' },
  CLOSED: { label: '已关闭', variant: 'secondary' },
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/employee">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                返回
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">我的工单</h1>
              <p className="text-sm text-gray-500">共 {tickets.length} 个工单</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto" />
          </div>
        ) : tickets.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 mb-4">暂无工单记录</p>
              <Link href="/employee">
                <Button>去提问</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {tickets.map((ticket) => (
              <Card key={ticket.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{ticket.title}</CardTitle>
                        <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                          <Clock className="w-3 h-3" />
                          {new Date(ticket.createdAt).toLocaleString('zh-CN')}
                        </div>
                      </div>
                    </div>
                    <Badge variant={statusConfig[ticket.status]?.variant || 'secondary'}>
                      {statusConfig[ticket.status]?.label || ticket.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{ticket.description}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex gap-4 text-sm">
                      {ticket.qaReports.length > 0 && (
                        <Link
                          href={`/employee/report/${ticket.qaReports[0].id}`}
                          className="flex items-center gap-1 text-blue-600 hover:underline"
                        >
                          <FileText className="w-4 h-4" />
                          查看质检报告
                        </Link>
                      )}
                      {ticket.status === 'RESOLVED' && !ticket.feedback && (
                        <Link
                          href={`/employee/feedback/${ticket.id}`}
                          className="flex items-center gap-1 text-green-600 hover:underline"
                        >
                          <CheckCircle className="w-4 h-4" />
                          满意度评价
                        </Link>
                      )}
                      {ticket.feedback && (
                        <span className="flex items-center gap-1 text-gray-500">
                          <CheckCircle className="w-4 h-4" />
                          已评价 {ticket.feedback.rating}星
                        </span>
                      )}
                    </div>
                    <Link href={`/employee/ticket/${ticket.id}`}>
                      <Button variant="ghost" size="sm">
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
