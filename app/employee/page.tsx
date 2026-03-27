'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Send, CheckCircle, AlertTriangle, XCircle, Loader2, FileText, Clock, History } from 'lucide-react'

const CURRENT_EMPLOYEE_ID = 'emp-001'
const CURRENT_EMPLOYEE_NAME = '张三'

interface ChatResult {
  ticketId: string
  answer: string | null
  confidence: number
  shouldCreateTicket: boolean
  showAnswer: boolean
  status: string
}

const categoryOptions = [
  { value: '系统故障', label: '系统故障' },
  { value: '网络问题', label: '网络问题' },
  { value: '硬件问题', label: '硬件问题' },
  { value: '软件问题', label: '软件问题' },
  { value: '账号权限', label: '账号权限' },
  { value: '其他', label: '其他' },
]

export default function EmployeePage() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ChatResult | null>(null)
  const [feedbackGiven, setFeedbackGiven] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !description.trim() || !category) {
      toast.error('请填写所有必填字段')
      return
    }

    setLoading(true)
    setResult(null)
    setFeedbackGiven(false)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: `${title}\n\n${description}`,
          employeeId: CURRENT_EMPLOYEE_ID,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResult(data)
    } catch (error) {
      toast.error('提交失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handleFeedback = async (resolved: boolean) => {
    if (!result?.ticketId) return

    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: result.ticketId,
          userId: CURRENT_EMPLOYEE_ID,
          rating: resolved ? 5 : 2,
          comment: resolved ? '问题已解决' : '问题未解决',
        }),
      })
      setFeedbackGiven(true)
      toast.success(resolved ? '感谢您的好评！' : '已提交反馈，我们会尽快处理')
    } catch (error) {
      toast.error('反馈提交失败')
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600'
    if (confidence >= 0.6) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">IT问题智能解答</h1>
              <p className="text-sm text-gray-500">欢迎，{CURRENT_EMPLOYEE_NAME}</p>
            </div>
            <Link href="/employee/history">
              <Button variant="outline" size="sm">
                <History className="w-4 h-4 mr-2" />
                我的工单
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <p className="text-gray-600">描述您遇到的问题，AI将基于知识库为您提供即时解答</p>
        </div>

        <div className="grid gap-6">
          {/* Question Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                提交问题
              </CardTitle>
              <CardDescription>请详细描述您遇到的问题，以便AI更准确地为您提供帮助</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">问题类别 *</Label>
                    <select
                      id="category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      required
                    >
                      <option value="">选择问题类别</option>
                      {categoryOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">问题标题 *</Label>
                  <Input
                    id="title"
                    placeholder="简要描述您的问题"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">问题详情 *</Label>
                  <Textarea
                    id="description"
                    placeholder="请详细描述您遇到的问题，包括：&#10;- 什么时候开始出现的&#10;- 具体的错误信息或现象&#10;- 已经尝试过的解决方法"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={6}
                    required
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      AI分析中...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      提交并获取AI解答
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* AI Result */}
          {result && (
            <Card className="border-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle>AI智能解答</CardTitle>
                    {result.confidence >= 0.8 && (
                      <Badge variant="success">高置信度</Badge>
                    )}
                    {result.confidence >= 0.6 && result.confidence < 0.8 && (
                      <Badge variant="warning">中等置信度</Badge>
                    )}
                    {result.confidence < 0.6 && (
                      <Badge variant="error">低置信度</Badge>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500 mb-1">置信度</div>
                    <div className={`text-2xl font-bold ${getConfidenceColor(result.confidence)}`}>
                      {(result.confidence * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>
                <Progress value={result.confidence * 100} className="mt-2" />
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Confidence Alert */}
                {result.confidence >= 0.8 && (
                  <Alert variant="success">
                    <CheckCircle className="w-4 h-4" />
                    <AlertDescription>
                      AI对此问题有较高把握，建议按照以下方案尝试解决
                    </AlertDescription>
                  </Alert>
                )}

                {result.confidence >= 0.6 && result.confidence < 0.8 && (
                  <Alert variant="warning">
                    <AlertTriangle className="w-4 h-4" />
                    <AlertDescription>
                      AI提供了可能的解决方案，建议尝试后仍未解决时创建工单
                    </AlertDescription>
                  </Alert>
                )}

                {result.confidence < 0.6 && (
                  <Alert variant="error">
                    <XCircle className="w-4 h-4" />
                    <AlertDescription>
                      AI无法提供可靠的解决方案，建议直接创建工单由技术人员处理
                    </AlertDescription>
                  </Alert>
                )}

                {/* Answer Content */}
                {result.showAnswer && result.answer && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="whitespace-pre-wrap text-gray-700">{result.answer}</p>
                  </div>
                )}

                {/* Action Buttons */}
                {!feedbackGiven ? (
                  <div className="flex gap-3 pt-4">
                    {result.confidence >= 0.8 ? (
                      <>
                        <Button
                          variant="outline"
                          onClick={() => handleFeedback(false)}
                          className="flex-1"
                        >
                          问题未解决，创建工单
                        </Button>
                        <Button
                          onClick={() => handleFeedback(true)}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          问题已解决
                        </Button>
                      </>
                    ) : (
                      <Button className="w-full bg-blue-600 hover:bg-blue-700">
                        创建工单
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4 text-green-600">
                    <CheckCircle className="w-8 h-8 mx-auto mb-2" />
                    <p>感谢您的反馈！</p>
                  </div>
                )}

                {/* Ticket ID */}
                <div className="text-center text-sm text-gray-500 pt-4 border-t">
                  <Clock className="w-4 h-4 inline mr-1" />
                  工单编号: <span className="font-mono">{result.ticketId.slice(0, 8)}...</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
