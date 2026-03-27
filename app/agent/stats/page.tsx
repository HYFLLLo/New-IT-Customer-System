'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BookOpen, List, BarChart3, LogOut, ArrowLeft, TrendingUp, Clock, CheckCircle, Users, FileText, Star } from 'lucide-react'

interface Stats {
  overview: {
    totalTickets: number
    ticketsThisWeek: number
    resolvedThisWeek: number
    resolutionRate: number
    avgResolutionTimeHours: number
  }
  ticketsByStatus: Record<string, number>
  confidence: { average: number }
  feedback: {
    averageRating: number
    totalResponses: number
    distribution: Record<number, number>
  }
  knowledgeBase: {
    totalDocuments: number
    processedDocuments: number
    totalChunks: number
  }
  categoryDistribution: Record<string, number>
}

export default function StatsPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [agent, setAgent] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const agentData = localStorage.getItem('agent')
    if (!agentData) {
      router.push('/agent/login')
      return
    }
    setAgent(JSON.parse(agentData))
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/agent/stats')
      const data = await res.json()
      setStats(data)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    localStorage.removeItem('agent')
    router.push('/agent/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <p className="text-gray-500 mb-4">无法加载统计数据</p>
          <Link href="/agent/dashboard" className="text-purple-600 hover:underline">
            返回工单列表
          </Link>
        </Card>
      </div>
    )
  }

  const statusLabels: Record<string, string> = {
    OPEN: '待处理',
    AI_ANSWERED: 'AI已回答',
    IN_PROGRESS: '处理中',
    RESOLVED: '已解决',
    CLOSED: '已关闭',
  }

  const statusColors: Record<string, string> = {
    OPEN: 'bg-red-50 text-red-600',
    AI_ANSWERED: 'bg-blue-50 text-blue-600',
    IN_PROGRESS: 'bg-yellow-50 text-yellow-600',
    RESOLVED: 'bg-green-50 text-green-600',
    CLOSED: 'bg-gray-50 text-gray-600',
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link href="/" className="flex items-center gap-2">
                <h1 className="text-xl font-semibold text-purple-600">IT运维系统</h1>
              </Link>
              <nav className="flex gap-2">
                <Link href="/agent/dashboard">
                  <Button variant="ghost" size="sm">
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
                  <Button variant="default" size="sm" className="bg-purple-600 hover:bg-purple-700">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    数据统计
                  </Button>
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">
                {agent?.name}
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
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">数据统计</h2>
          <p className="text-gray-500">工单处理和系统使用情况概览</p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.overview.totalTickets}</p>
                  <p className="text-sm text-gray-500">总工单数</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.overview.resolutionRate}%</p>
                  <p className="text-sm text-gray-500">本周解决率</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.overview.avgResolutionTimeHours}h</p>
                  <p className="text-sm text-gray-500">平均解决时长</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                  <Star className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.feedback.averageRating}</p>
                  <p className="text-sm text-gray-500">平均满意度</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Tickets by Status */}
          <Card>
            <CardHeader>
              <CardTitle>工单状态分布</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(stats.ticketsByStatus).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${statusColors[status]?.split(' ')[0]}`} />
                      <span className="text-gray-700">{statusLabels[status] || status}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{count}</span>
                      <Badge variant="secondary" className={statusColors[status]}>
                        {Math.round((count / stats.overview.totalTickets) * 100)}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Category Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>问题类型分布</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(stats.categoryDistribution)
                  .sort((a, b) => b[1] - a[1])
                  .map(([category, count]) => (
                    <div key={category} className="flex items-center justify-between">
                      <span className="text-gray-700">{category}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-purple-500 rounded-full"
                            style={{ width: `${(count / stats.overview.totalTickets) * 100}%` }}
                          />
                        </div>
                        <span className="font-semibold w-8 text-right">{count}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          {/* AI Confidence */}
          <Card>
            <CardHeader>
              <CardTitle>AI 置信度</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-4">
                <div className="text-center">
                  <div className="w-24 h-24 rounded-full border-8 border-green-500 flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl font-bold text-green-600">{stats.confidence.average}%</span>
                  </div>
                  <p className="text-gray-500">AI 回答平均置信度</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Knowledge Base */}
          <Card>
            <CardHeader>
              <CardTitle>知识库统计</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-purple-600">{stats.knowledgeBase.totalDocuments}</p>
                  <p className="text-sm text-gray-500">文档数</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{stats.knowledgeBase.processedDocuments}</p>
                  <p className="text-sm text-gray-500">已处理</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-600">{stats.knowledgeBase.totalChunks}</p>
                  <p className="text-sm text-gray-500">知识切片</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Feedback Distribution */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>满意度评分分布</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-center gap-4 py-4">
                {[5, 4, 3, 2, 1].map((rating) => (
                  <div key={rating} className="flex flex-col items-center">
                    <div className="w-12 bg-yellow-100 rounded-lg flex items-end justify-center pb-2" style={{ height: `${(stats.feedback.distribution[rating] || 0) * 20 + 20}px` }}>
                      <span className="text-sm font-semibold text-yellow-700">
                        {stats.feedback.distribution[rating] || 0}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mt-2">
                      <span className="text-yellow-500">{'★'.repeat(rating)}</span>
                      <span className="text-gray-300">{'☆'.repeat(5 - rating)}</span>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-center text-sm text-gray-500 mt-4">
                共 {stats.feedback.totalResponses} 条反馈，平均 {stats.feedback.averageRating} 星
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
