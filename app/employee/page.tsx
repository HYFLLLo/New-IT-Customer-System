'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Send, Bot, User, Loader2, CheckCircle, History, Paperclip, ThumbsUp, ThumbsDown, Plus, Ticket, X } from 'lucide-react'

const CURRENT_EMPLOYEE_ID = 'emp-001'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  confidence?: number
  createdAt: string
}

const problemTypes = [
  { value: '系统故障', label: '🖥️ 系统故障（蓝屏、死机、崩溃）' },
  { value: '网络问题', label: '🌐 网络问题（连不上、网速慢）' },
  { value: '硬件问题', label: '🔌 硬件问题（打印机、键盘鼠标）' },
  { value: '软件问题', label: '📀 软件问题（安装、卸载、报错）' },
  { value: '账号权限', label: '🔐 账号权限（密码、权限申请）' },
  { value: '其他', label: '📋 其他问题' },
]

export default function EmployeePage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [ticketId, setTicketId] = useState<string | null>(null)
  const [confidence, setConfidence] = useState<number>(0)
  const [feedbackGiven, setFeedbackGiven] = useState(false)
  const [attachments, setAttachments] = useState<File[]>([])
  
  // Modal state
  const [showCreateTicketModal, setShowCreateTicketModal] = useState(false)
  const [createTicketLoading, setCreateTicketLoading] = useState(false)
  const [ticketTitle, setTicketTitle] = useState('')
  const [ticketType, setTicketType] = useState('')
  const [ticketDescription, setTicketDescription] = useState('')
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      createdAt: new Date().toISOString(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)
    setFeedbackGiven(false)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: userMessage.content,
          employeeId: CURRENT_EMPLOYEE_ID,
          ticketId,
          conversationHistory: messages.map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || '提交失败')

      if (ticketId === null && data.ticketId) {
        setTicketId(data.ticketId)
      }
      setConfidence(data.confidence)

      if (data.answer) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.answer,
          confidence: data.confidence,
          createdAt: new Date().toISOString(),
        }
        setMessages(prev => [...prev, assistantMessage])
      }
    } catch (error) {
      toast.error('提交失败，请重试')
      setMessages(prev => prev.filter(m => m.id !== userMessage.id))
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTicket = async () => {
    if (!ticketTitle.trim() || !ticketType || !ticketDescription.trim()) {
      toast.error('请填写所有必填字段')
      return
    }

    setCreateTicketLoading(true)

    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `[${ticketType}] ${ticketTitle}`,
          description: ticketDescription,
          employeeId: CURRENT_EMPLOYEE_ID,
        }),
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error)

      toast.success('工单创建成功！')
      setShowCreateTicketModal(false)
      setTicketTitle('')
      setTicketType('')
      setTicketDescription('')
      
      // Refresh ticket ID if needed
      if (data.ticket?.id) {
        setTicketId(data.ticket.id)
      }
    } catch (error) {
      toast.error('创建工单失败')
    } finally {
      setCreateTicketLoading(false)
    }
  }

  const handleFeedback = async (resolved: boolean) => {
    if (!ticketId) return

    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId,
          userId: CURRENT_EMPLOYEE_ID,
          rating: resolved ? 5 : 3,
          comment: resolved ? '问题已解决' : '问题未解决',
        }),
      })
      setFeedbackGiven(true)
      toast.success(resolved ? '感谢您的好评！' : '感谢反馈，我们会继续优化')
    } catch (error) {
      toast.error('反馈提交失败')
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      setAttachments(prev => [...prev, ...files])
      toast.success(`已添加 ${files.length} 个附件`)
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }

  const getConfidenceColor = (conf: number) => {
    if (conf >= 0.8) return 'text-green-600'
    if (conf >= 0.6) return 'text-yellow-600'
    return 'text-red-600'
  }

  const lastAssistantMessage = messages.filter(m => m.role === 'assistant').pop()
  const showFeedback = lastAssistantMessage && !feedbackGiven && lastAssistantMessage.confidence && lastAssistantMessage.confidence >= 0.6

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-semibold text-gray-900">IT智能助手</h1>
                <p className="text-xs text-gray-500">基于知识库的AI问答</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {ticketId && (
                <Badge variant="secondary" className="text-xs">
                  工单: {ticketId.slice(0, 8)}...
                </Badge>
              )}
              {/* Create Ticket Button */}
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowCreateTicketModal(true)}
                className="border-blue-200 text-blue-600 hover:bg-blue-50"
              >
                <Plus className="w-4 h-4 mr-1" />
                创建工单
              </Button>
              <Link href="/employee/history">
                <Button variant="ghost" size="sm">
                  <History className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Chat Messages */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-4 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center mb-4">
              <Bot className="w-10 h-10 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">你好，我是IT智能助手</h2>
            <p className="text-gray-500 max-w-md mb-6">
              描述你遇到的IT问题，如电脑蓝屏、网络故障、软件安装等，我会尽力帮你解决
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {['电脑蓝屏了怎么办', '网络连不上', '如何申请软件权限'].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setInput(suggestion)}
                  className="px-4 py-2 bg-white border rounded-full text-sm text-gray-700 hover:bg-gray-50 hover:border-blue-300 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
                  message.role === 'user' ? 'bg-blue-600' : 'bg-gray-200'
                }`}>
                  {message.role === 'user' ? (
                    <User className="w-4 h-4 text-white" />
                  ) : (
                    <Bot className="w-4 h-4 text-gray-600" />
                  )}
                </div>
                <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-sm'
                    : 'bg-white border text-gray-800 rounded-tl-sm'
                }`}>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
                  {message.role === 'assistant' && message.confidence !== undefined && (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">置信度</span>
                        <span className={`text-sm font-semibold ${getConfidenceColor(message.confidence)}`}>
                          {(message.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                      <Progress value={message.confidence * 100} className="h-1 mt-1" />
                    </div>
                  )}
                  <p className={`text-xs mt-1 ${
                    message.role === 'user' ? 'text-blue-200' : 'text-gray-600'
                  }`}>
                    {formatTime(message.createdAt)}
                  </p>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-gray-600" />
                </div>
                <div className="bg-white border rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex items-center gap-2 text-gray-500">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">AI思考中...</span>
                  </div>
                </div>
              </div>
            )}

            {showFeedback && (
              <div className="flex items-center justify-center gap-3 py-4">
                <span className="text-sm text-gray-500">问题解决了吗？</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFeedback(true)}
                  className="text-green-600 border-green-200 hover:bg-green-50"
                >
                  <ThumbsUp className="w-4 h-4 mr-1" />
                  已解决
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFeedback(false)}
                  className="text-orange-600 border-orange-200 hover:bg-orange-50"
                >
                  <ThumbsDown className="w-4 h-4 mr-1" />
                  未解决
                </Button>
              </div>
            )}

            {feedbackGiven && (
              <div className="text-center py-2">
                <Badge variant="success" className="bg-green-100 text-green-700">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  感谢您的反馈
                </Badge>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      {/* Input Area */}
      <footer className="bg-white border-t sticky bottom-0">
        <div className="max-w-3xl mx-auto px-4 py-3">
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {attachments.map((file, index) => (
                <div key={index} className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs">
                  <Paperclip className="w-3 h-3" />
                  <span className="max-w-[80px] truncate">{file.name}</span>
                  <button onClick={() => removeAttachment(index)} className="text-gray-400 hover:text-red-500">×</button>
                </div>
              ))}
            </div>
          )}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input ref={fileInputRef} type="file" accept="image/*,.pdf" multiple onChange={handleFileSelect} className="hidden" />
            <Button type="button" variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} className="flex-shrink-0 text-gray-600 hover:text-gray-900 hover:bg-gray-100">
              <Paperclip className="w-5 h-5" />
            </Button>
            <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="输入你的问题..." className="flex-1" disabled={loading} />
            <Button type="submit" size="icon" disabled={loading || !input.trim()} className="flex-shrink-0 bg-blue-600 hover:bg-blue-700">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </Button>
          </form>
        </div>
      </footer>

      {/* Create Ticket Modal */}
      <Dialog open={showCreateTicketModal} onOpenChange={setShowCreateTicketModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <Ticket className="w-5 h-5 text-blue-600" />
              </div>
              创建工单
            </DialogTitle>
            <DialogDescription>
              填写以下信息，提交后坐席人员会尽快处理
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="ticket-type">问题类型 *</Label>
              <select
                id="ticket-type"
                value={ticketType}
                onChange={(e) => setTicketType(e.target.value)}
                className="w-full h-10 px-3 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                required
              >
                <option value="">请选择问题类型</option>
                {problemTypes.map((type) => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ticket-title">问题标题 *</Label>
              <Input
                id="ticket-title"
                value={ticketTitle}
                onChange={(e) => setTicketTitle(e.target.value)}
                placeholder="简要描述问题"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ticket-desc">问题详情 *</Label>
              <Textarea
                id="ticket-desc"
                value={ticketDescription}
                onChange={(e) => setTicketDescription(e.target.value)}
                placeholder="请详细描述您遇到的问题，包括：&#10;- 问题现象&#10;- 发生时间&#10;- 已尝试的解决方法"
                rows={5}
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateTicketModal(false)}>
              取消
            </Button>
            <Button onClick={handleCreateTicket} disabled={createTicketLoading} className="bg-blue-600 hover:bg-blue-700">
              {createTicketLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  创建中...
                </>
              ) : (
                <>
                  <Ticket className="w-4 h-4 mr-2" />
                  提交工单
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
