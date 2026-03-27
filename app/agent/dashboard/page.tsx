'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BookOpen, List, BarChart3, LogOut, Home, FileText, Clock, MessageSquare } from 'lucide-react'

interface Ticket {
  id: string
  title: string
  description: string
  status: string
  confidence: number | null
  createdAt: string
  employee: { id: string; name: string; email: string }
  _count: { messages: number; qaReports: number }
}

const statusConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'error' | 'secondary' }> = {
  OPEN: { label: '新工单', variant: 'error' },
  AI_ANSWERED: { label: 'AI已回答', variant: 'warning' },
  IN_PROGRESS: { label: '处理中', variant: 'warning' },
  RESOLVED: { label: '已解决', variant: 'success' },
  CLOSED: { label: '已关闭', variant: 'secondary' },
}

export default function AgentDashboard() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [agent, setAgent] = useState<any>(null)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const router = useRouter()

  useEffect(() => {
    const agentData = localStorage.getItem('agent')
    if (!agentData) {
      router.push('/agent/login')
      return
    }
    setAgent(JSON.parse(agentData))
    fetchTickets()
  }, [])

  const fetchTickets = async (status?: string) => {
    try {
      const url = status ? `/api/agent/tickets?status=${status}` : '/api/agent/tickets'
      const res = await fetch(url)
      const data = await res.json()
      setTickets(data.tickets || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (status: string) => {
    setStatusFilter(statusFilter === status ? '' : status)
    fetchTickets(statusFilter === status ? undefined : status || undefined)
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    localStorage.removeItem('agent')
    router.push('/agent/login')
  }

  const filteredTickets = statusFilter
    ? tickets.filter(t => t.status === statusFilter)
    : tickets

  const statusCounts = {
    OPEN: tickets.filter(t => t.status === 'OPEN').length,
    AI_ANSWERED: tickets.filter(t => t.status === 'AI_ANSWERED').length,
    IN_PROGRESS: tickets.filter(t => t.status === 'IN_PROGRESS').length,
    RESOLVED: tickets.filter(t => t.status === 'RESOLVED').length,
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link href="/" className="flex items-center gap-2">
                <h1 className="text-xl font-semibold text-purple-600">IT运维系统 - 坐席端</h1>
              </Link>
              <nav className="flex gap-2">
                <Link href="/agent/dashboard">
                  <Button variant="default" size="sm" className="bg-purple-600 hover:bg-purple-700">
                    <List className="w-4 h-4 mr-2" />
                    工单管理
                  </Button>
                </Link>
                <Link href="/agent/knowledge">
                  <Button variant="ghost" size="sm">
                    <BookOpen className="w-4 h-4 mr-2" />
                    知识库
                  </Button>
                </Link>
                <Link href="/agent/stats">
                  <Button variant="ghost" size="sm">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    数据统计
                  </Button>
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">
                {agent?.name} · {agent?.role === 'ADMIN' ? '管理员' : '坐席'}
              </span>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                退出
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { key: 'OPEN', icon: FileText, color: 'text-red-600 bg-red-50' },
            { key: 'AI_ANSWERED', icon: MessageSquare, color: 'text-blue-600 bg-blue-50' },
            { key: 'IN_PROGRESS', icon: Clock, color: 'text-yellow-600 bg-yellow-50' },
            { key: 'RESOLVED', icon: BarChart3, color: 'text-green-600 bg-green-50' },
          ].map(({ key, icon: Icon, color }) => (
            <button
              key={key}
              onClick={() => handleFilterChange(key)}
              className={`p-4 rounded-xl text-left transition-all ${statusFilter === key ? 'ring-2 ring-purple-500 bg-white shadow-md' : 'bg-white shadow-sm hover:shadow-md'}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
                  <Icon className="w-5 h-5" />
                </span>
                <span className="text-2xl font-bold">{statusCounts[key as keyof typeof statusCounts]}</span>
              </div>
              <p className="text-sm text-gray-500">{statusConfig[key]?.label}</p>
            </button>
          ))}
        </div>

        {/* Ticket List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>工单列表</CardTitle>
              {statusFilter && (
                <Button variant="ghost" size="sm" onClick={() => handleFilterChange('')}>
                  清除筛选
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto" />
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>暂无工单</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTickets.map((ticket) => (
                  <Link
                    key={ticket.id}
                    href={`/agent/ticket/${ticket.id}`}
                    className="flex items-center gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors border"
                  >
                    <div className={`w-1.5 h-12 rounded-full ${
                      ticket.status === 'OPEN' ? 'bg-red-500' :
                      ticket.status === 'AI_ANSWERED' ? 'bg-blue-500' :
                      ticket.status === 'IN_PROGRESS' ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900 truncate">{ticket.title}</span>
                        <Badge variant={statusConfig[ticket.status]?.variant || 'secondary'}>
                          {statusConfig[ticket.status]?.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>{ticket.employee.name}</span>
                        <span>·</span>
                        <span>{new Date(ticket.createdAt).toLocaleString('zh-CN')}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-4 h-4" />
                        {ticket._count.messages}
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="w-4 h-4" />
                        {ticket._count.qaReports}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
