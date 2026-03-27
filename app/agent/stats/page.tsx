'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BookOpen, List, BarChart3, LogOut, TrendingUp, Clock, CheckCircle, Users, FileText, Star, Bot, Database, Activity } from 'lucide-react'

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

const statusConfig: Record<string, { label: string; color: string; bgColor: string; borderColor: string }> = {
  OPEN: { label: '待处理', color: 'text-[#ff3366]', bgColor: 'bg-[#ff3366]/10', borderColor: 'border-[#ff3366]/30' },
  AI_ANSWERED: { label: 'AI已回答', color: 'text-[#ffcc00]', bgColor: 'bg-[#ffcc00]/10', borderColor: 'border-[#ffcc00]/30' },
  IN_PROGRESS: { label: '处理中', color: 'text-[#00f0ff]', bgColor: 'bg-[#00f0ff]/10', borderColor: 'border-[#00f0ff]/30' },
  RESOLVED: { label: '已解决', color: 'text-[#00ff88]', bgColor: 'bg-[#00ff88]/10', borderColor: 'border-[#00ff88]/30' },
  CLOSED: { label: '已关闭', color: 'text-[#8888aa]', bgColor: 'bg-[#8888aa]/10', borderColor: 'border-[#8888aa]/30' },
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
      <div className="min-h-screen bg-[#0a0a0f] cyber-grid-bg flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-[#ff00aa] border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] cyber-grid-bg flex items-center justify-center">
        <Card className="bg-[#12122a]/80 border-[#2a2a4a]">
          <CardContent className="text-center py-12">
            <p className="text-[#8888aa] mb-4">无法加载统计数据</p>
            <Link href="/agent/dashboard" className="text-[#ff00aa] hover:text-[#ff66bb]">
              返回工单列表
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const maxCategoryCount = Math.max(...Object.values(stats.categoryDistribution), 1)

  return (
    <div className="min-h-screen bg-[#0a0a0f] cyber-grid-bg">
      {/* Header */}
      <header className="bg-[#12122a]/80 backdrop-blur-sm border-b border-[#2a2a4a] sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-[#ff00aa]/20 to-[#ff00aa]/5 rounded-lg flex items-center justify-center border border-[#ff00aa]/30">
                  <Bot className="w-4 h-4 text-[#ff00aa]" />
                </div>
                <h1 className="text-lg font-semibold text-white">IT运维系统</h1>
              </Link>
              <nav className="flex gap-1">
                <Link href="/agent/dashboard">
                  <Button variant="ghost" size="sm" className="text-[#8888aa] hover:text-[#00f0ff] hover:bg-[#00f0ff]/10">
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
                  <Button variant="ghost" size="sm" className="text-[#ff00aa] bg-[#ff00aa]/10 hover:bg-[#ff00aa]/20">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    数据统计
                  </Button>
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-[#8888aa]">
                {agent?.name}
              </span>
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
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Activity className="w-6 h-6 text-[#ff00aa]" />
            数据统计
          </h2>
          <p className="text-[#8888aa]">工单处理和系统使用情况概览</p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-[#12122a]/80 border-[#2a2a4a] hover:border-[#00f0ff]/50 transition-colors">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#00f0ff]/20 to-[#00f0ff]/5 rounded-xl flex items-center justify-center border border-[#00f0ff]/30">
                  <FileText className="w-6 h-6 text-[#00f0ff]" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats.overview.totalTickets}</p>
                  <p className="text-sm text-[#8888aa]">总工单数</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#12122a]/80 border-[#2a2a4a] hover:border-[#00ff88]/50 transition-colors">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#00ff88]/20 to-[#00ff88]/5 rounded-xl flex items-center justify-center border border-[#00ff88]/30">
                  <CheckCircle className="w-6 h-6 text-[#00ff88]" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats.overview.resolutionRate}%</p>
                  <p className="text-sm text-[#8888aa]">本周解决率</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#12122a]/80 border-[#2a2a4a] hover:border-[#ffcc00]/50 transition-colors">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#ffcc00]/20 to-[#ffcc00]/5 rounded-xl flex items-center justify-center border border-[#ffcc00]/30">
                  <Clock className="w-6 h-6 text-[#ffcc00]" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats.overview.avgResolutionTimeHours}h</p>
                  <p className="text-sm text-[#8888aa]">平均解决时长</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#12122a]/80 border-[#2a2a4a] hover:border-[#ff00aa]/50 transition-colors">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#ff00aa]/20 to-[#ff00aa]/5 rounded-xl flex items-center justify-center border border-[#ff00aa]/30">
                  <Star className="w-6 h-6 text-[#ff00aa]" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats.feedback.averageRating}</p>
                  <p className="text-sm text-[#8888aa]">平均满意度</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Tickets by Status */}
          <Card className="bg-[#12122a]/80 border-[#2a2a4a]">
            <CardHeader className="border-b border-[#2a2a4a]">
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#00f0ff]" />
                工单状态分布
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-3">
                {Object.entries(stats.ticketsByStatus).map(([status, count]) => {
                  const config = statusConfig[status] || statusConfig.OPEN
                  return (
                    <div key={status} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${config.bgColor} border ${config.borderColor}`} />
                        <span className="text-[#ccccdd]">{config.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{count}</span>
                        <Badge className={`${config.bgColor} ${config.color} border ${config.borderColor}`}>
                          {Math.round((count / stats.overview.totalTickets) * 100)}%
                        </Badge>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Category Distribution */}
          <Card className="bg-[#12122a]/80 border-[#2a2a4a]">
            <CardHeader className="border-b border-[#2a2a4a]">
              <CardTitle className="text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[#ff00aa]" />
                问题类型分布
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-3">
                {Object.entries(stats.categoryDistribution)
                  .sort((a, b) => b[1] - a[1])
                  .map(([category, count]) => (
                    <div key={category} className="flex items-center justify-between">
                      <span className="text-[#ccccdd]">{category}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-[#0a0a0f] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#ff00aa] to-[#ff3366] rounded-full"
                            style={{ width: `${(count / maxCategoryCount) * 100}%` }}
                          />
                        </div>
                        <span className="font-semibold text-white w-8 text-right">{count}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          {/* AI Confidence */}
          <Card className="bg-[#12122a]/80 border-[#2a2a4a]">
            <CardHeader className="border-b border-[#2a2a4a]">
              <CardTitle className="text-white flex items-center gap-2">
                <Bot className="w-5 h-5 text-[#00ff88]" />
                AI 置信度
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-4">
                <div className="text-center">
                  <div className="w-28 h-28 rounded-full border-4 border-[#00ff88] flex items-center justify-center mx-auto mb-4 cyber-glow"
                    style={{
                      boxShadow: '0 0 20px rgba(0, 255, 136, 0.3), inset 0 0 20px rgba(0, 255, 136, 0.1)'
                    }}
                  >
                    <span className="text-3xl font-bold text-[#00ff88]">{stats.confidence.average}%</span>
                  </div>
                  <p className="text-[#8888aa]">AI 回答平均置信度</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Knowledge Base */}
          <Card className="bg-[#12122a]/80 border-[#2a2a4a]">
            <CardHeader className="border-b border-[#2a2a4a]">
              <CardTitle className="text-white flex items-center gap-2">
                <Database className="w-5 h-5 text-[#ffcc00]" />
                知识库统计
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-4 rounded-xl bg-[#0a0a0f] border border-[#00f0ff]/30">
                  <p className="text-2xl font-bold text-[#00f0ff]">{stats.knowledgeBase.totalDocuments}</p>
                  <p className="text-sm text-[#8888aa]">文档数</p>
                </div>
                <div className="p-4 rounded-xl bg-[#0a0a0f] border border-[#00ff88]/30">
                  <p className="text-2xl font-bold text-[#00ff88]">{stats.knowledgeBase.processedDocuments}</p>
                  <p className="text-sm text-[#8888aa]">已处理</p>
                </div>
                <div className="p-4 rounded-xl bg-[#0a0a0f] border border-[#ff00aa]/30">
                  <p className="text-2xl font-bold text-[#ff00aa]">{stats.knowledgeBase.totalChunks}</p>
                  <p className="text-sm text-[#8888aa]">知识切片</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Feedback Distribution */}
          <Card className="bg-[#12122a]/80 border-[#2a2a4a] md:col-span-2">
            <CardHeader className="border-b border-[#2a2a4a]">
              <CardTitle className="text-white flex items-center gap-2">
                <Star className="w-5 h-5 text-[#ffcc00]" />
                满意度评分分布
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-center gap-4 py-4">
                {[5, 4, 3, 2, 1].map((rating) => (
                  <div key={rating} className="flex flex-col items-center">
                    <div 
                      className="w-14 bg-gradient-to-t from-[#ffcc00]/20 to-[#ffcc00]/5 rounded-lg flex items-end justify-center pb-2 border border-[#ffcc00]/30"
                      style={{ height: `${Math.max((stats.feedback.distribution[rating] || 0) * 30 + 30, 30)}px` }}
                    >
                      <span className="text-sm font-semibold text-[#ffcc00]">
                        {stats.feedback.distribution[rating] || 0}
                      </span>
                    </div>
                    <div className="flex items-center gap-0.5 mt-2">
                      <span className="text-[#ffcc00] text-sm">{'★'.repeat(rating)}</span>
                      <span className="text-[#2a2a4a] text-sm">{'★'.repeat(5 - rating)}</span>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-center text-sm text-[#8888aa] mt-4">
                共 {stats.feedback.totalResponses} 条反馈，平均 {stats.feedback.averageRating} 星
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
