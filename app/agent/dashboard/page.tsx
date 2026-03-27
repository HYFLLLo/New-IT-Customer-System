'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BookOpen, List, BarChart3, LogOut, FileText, Clock, MessageSquare, Cpu } from 'lucide-react'

interface Ticket {
  id: string
  title: string
  status: string
  createdAt: string
  employee: { name: string }
  _count: { messages: number; qaReports: number }
}

const statusConfig: Record<string, { label: string; className: string }> = {
  OPEN: { label: '新工单', className: 'bg-[#ff3366]/10 border-[#ff3366]/30 text-[#ff3366]' },
  AI_ANSWERED: { label: 'AI已回答', className: 'bg-[#ffcc00]/10 border-[#ffcc00]/30 text-[#ffcc00]' },
  IN_PROGRESS: { label: '处理中', className: 'bg-[#00f0ff]/10 border-[#00f0ff]/30 text-[#00f0ff]' },
  RESOLVED: { label: '已解决', className: 'bg-[#00ff88]/10 border-[#00ff88]/30 text-[#00ff88]' },
  CLOSED: { label: '已关闭', className: 'bg-[#8888aa]/10 border-[#8888aa]/30 text-[#8888aa]' },
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

  const filteredTickets = statusFilter ? tickets.filter(t => t.status === statusFilter) : tickets

  const statusCounts = {
    OPEN: tickets.filter(t => t.status === 'OPEN').length,
    AI_ANSWERED: tickets.filter(t => t.status === 'AI_ANSWERED').length,
    IN_PROGRESS: tickets.filter(t => t.status === 'IN_PROGRESS').length,
    RESOLVED: tickets.filter(t => t.status === 'RESOLVED').length,
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] cyber-grid-bg">
      {/* Header */}
      <header className="bg-[#12122a]/80 backdrop-blur-sm border-b border-[#2a2a4a] sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link href="/" className="flex items-center gap-2">
                <span className="text-xl font-bold bg-gradient-to-r from-[#ff00aa] to-[#ff3366] bg-clip-text text-transparent">IT运维系统</span>
                <Badge variant="secondary" className="bg-[#ff00aa]/10 border-[#ff00aa]/30 text-[#ff00aa] text-xs">坐席端</Badge>
              </Link>
              <nav className="flex gap-2">
                <Link href="/agent/dashboard">
                  <Button variant="default" size="sm" className="bg-gradient-to-r from-[#ff00aa] to-[#ff3366] text-white hover:opacity-90">
                    <List className="w-4 h-4 mr-2" />
                    工单管理
                  </Button>
                </Link>
                <Link href="/agent/knowledge">
                  <Button variant="ghost" size="sm" className="text-[#8888aa] hover:text-[#00f0ff] hover:bg-[#00f0ff]/10">
                    <BookOpen className="w-4 h-4 mr-2" />
                    知识库
                  </Button>
                </Link>
                <Link href="/agent/stats">
                  <Button variant="ghost" size="sm" className="text-[#8888aa] hover:text-[#00f0ff] hover:bg-[#00f0ff]/10">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    数据统计
                  </Button>
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-[#8888aa]">{agent?.name}</span>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-[#8888aa] hover:text-[#ff3366] hover:bg-[#ff3366]/10">
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
            { key: 'OPEN', icon: FileText, color: 'from-[#ff3366]/20 to-[#ff3366]/5', border: 'border-[#ff3366]/30' },
            { key: 'AI_ANSWERED', icon: Cpu, color: 'from-[#ffcc00]/20 to-[#ffcc00]/5', border: 'border-[#ffcc00]/30' },
            { key: 'IN_PROGRESS', icon: Clock, color: 'from-[#00f0ff]/20 to-[#00f0ff]/5', border: 'border-[#00f0ff]/30' },
            { key: 'RESOLVED', icon: MessageSquare, color: 'from-[#00ff88]/20 to-[#00ff88]/5', border: 'border-[#00ff88]/30' },
          ].map(({ key, icon: Icon, color, border }) => (
            <button
              key={key}
              onClick={() => handleFilterChange(key)}
              className={`p-4 rounded-xl text-left transition-all bg-gradient-to-br ${color} border ${border} ${statusFilter === key ? 'ring-2 ring-[#ff00aa] cyber-glow-pink' : 'hover:scale-105'}`}
            >
              <div className="flex items-center justify-between mb-2">
                <Icon className={`w-5 h-5 ${statusFilter === key ? 'text-white' : 'text-[#8888aa]'}`} />
                <span className="text-2xl font-bold text-white">{statusCounts[key as keyof typeof statusCounts]}</span>
              </div>
              <p className="text-sm text-[#8888aa]">{statusConfig[key]?.label}</p>
            </button>
          ))}
        </div>

        {/* Ticket List */}
        <Card className="bg-[#12122a]/80 backdrop-blur border-[#2a2a4a]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white">工单列表</CardTitle>
              {statusFilter && (
                <Button variant="ghost" size="sm" onClick={() => handleFilterChange('')} className="text-[#ff00aa] hover:text-[#ff00aa] hover:bg-[#ff00aa]/10">
                  清除筛选
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin w-8 h-8 border-2 border-[#ff00aa] border-t-transparent rounded-full mx-auto" />
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="text-center py-12 text-[#8888aa]">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>暂无工单</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTickets.map((ticket) => (
                  <Link
                    key={ticket.id}
                    href={`/agent/ticket/${ticket.id}`}
                    className="flex items-center gap-4 p-4 rounded-lg bg-[#0a0a0f] border border-[#2a2a4a] hover:border-[#00f0ff]/50 transition-colors group"
                  >
                    <div className={`w-1.5 h-12 rounded-full ${
                      ticket.status === 'OPEN' ? 'bg-[#ff3366]' :
                      ticket.status === 'AI_ANSWERED' ? 'bg-[#ffcc00]' :
                      ticket.status === 'IN_PROGRESS' ? 'bg-[#00f0ff]' :
                      'bg-[#00ff88]'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-white truncate group-hover:text-[#00f0ff] transition-colors">{ticket.title}</span>
                        <Badge className={statusConfig[ticket.status]?.className}>
                          {statusConfig[ticket.status]?.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-[#8888aa]">
                        <span>{ticket.employee.name}</span>
                        <span>·</span>
                        <span>{new Date(ticket.createdAt).toLocaleString('zh-CN')}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-[#8888aa]">
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
