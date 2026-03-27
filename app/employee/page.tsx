'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Send, Bot, User, Loader2, CheckCircle, History, Paperclip, Plus, Ticket, Cpu, MessageSquare, Bell, Mail } from 'lucide-react'

const CURRENT_EMPLOYEE_ID = 'emp-001'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  confidence?: number
  createdAt: string
}

interface AgentMessage {
  id: string
  content: string
  ticketId: string
  ticketTitle: string
  createdAt: string
  read: boolean
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
  const [mounted, setMounted] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [ticketId, setTicketId] = useState<string | null>(null)
  const [feedbackGiven, setFeedbackGiven] = useState(false)
  const [attachments, setAttachments] = useState<File[]>([])
  
  const [showCreateTicketModal, setShowCreateTicketModal] = useState(false)
  const [createTicketLoading, setCreateTicketLoading] = useState(false)
  const [ticketTitle, setTicketTitle] = useState('')
  const [ticketType, setTicketType] = useState('')
  const [ticketDescription, setTicketDescription] = useState('')
  
  // Messages dialog state
  const [showMessagesDialog, setShowMessagesDialog] = useState(false)
  const [agentMessages, setAgentMessages] = useState<AgentMessage[]>([])
  const [loadingAgentMessages, setLoadingAgentMessages] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    setMounted(true)
    scrollToBottom()
  }, [messages])

  // Fetch agent messages
  const fetchAgentMessages = async () => {
    setLoadingAgentMessages(true)
    try {
      const res = await fetch(`/api/employee/messages?employeeId=${CURRENT_EMPLOYEE_ID}`)
      const data = await res.json()
      setAgentMessages(data.messages || [])
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setLoadingAgentMessages(false)
    }
  }

  const handleOpenMessages = () => {
    fetchAgentMessages()
    setShowMessagesDialog(true)
  }

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
          conversationHistory: messages.map(m => ({ role: m.role, content: m.content })),
        }),
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || '提交失败')

      if (ticketId === null && data.ticketId) setTicketId(data.ticketId)

      if (data.answer) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.answer,
          confidence: data.confidence,
          createdAt: new Date().toISOString(),
        }
        setMessages(prev => [...prev, assistantMessage])
      } else if (data.showAnswer === false && data.shouldCreateTicket) {
        // AI couldn't help, ticket was created directly
        toast.success('已为您创建工单，IT人员会尽快处理！')
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: '抱歉，知识库中没有找到相关信息。为了确保您的问题能得到妥善解决，我已为您创建了工单，IT人员会尽快与您联系处理。',
          confidence: 0,
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
      
      if (data.ticket?.id) setTicketId(data.ticket.id)
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
    if (conf >= 0.8) return 'text-[#00ff88]'
    if (conf >= 0.6) return 'text-[#ffcc00]'
    return 'text-[#ff3366]'
  }

  const lastAssistantMessage = messages.filter(m => m.role === 'assistant').pop()
  const showFeedback = lastAssistantMessage && !feedbackGiven && lastAssistantMessage.confidence && lastAssistantMessage.confidence >= 0.6
  const isEmpty = messages.length === 0

  return (
    <div className="min-h-screen bg-[#0a0a0f] cyber-grid-bg flex flex-col">
      {/* Header */}
      <header className="bg-[#12122a]/80 backdrop-blur-sm border-b border-[#2a2a4a] sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#00f0ff]/20 to-[#00f0ff]/5 rounded-xl flex items-center justify-center border border-[#00f0ff]/30 cyber-glow">
                <Bot className="w-5 h-5 text-[#00f0ff]" />
              </div>
              <div>
                <h1 className="font-semibold text-white">IT智能助手</h1>
                <p className="text-xs text-[#8888aa]">基于知识库的AI问答</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {ticketId && (
                <Badge variant="secondary" className="bg-[#12122a] border border-[#00f0ff]/30 text-[#00f0ff] text-xs">
                  工单: {ticketId.slice(0, 8)}...
                </Badge>
              )}
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowCreateTicketModal(true)}
                className="border-[#00f0ff]/30 text-[#00f0ff] hover:bg-[#00f0ff]/10 hover:border-[#00f0ff]"
              >
                <Plus className="w-4 h-4 mr-1" />
                创建工单
              </Button>
              <Link href="/employee/history">
                <Button variant="ghost" size="icon" className="text-[#8888aa] hover:text-[#00f0ff] hover:bg-[#00f0ff]/10">
                  <History className="w-5 h-5" />
                </Button>
              </Link>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleOpenMessages}
                className="text-[#8888aa] hover:text-[#ff00aa] hover:bg-[#ff00aa]/10 relative"
              >
                <Bell className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <main className={`flex-1 max-w-3xl mx-auto w-full px-4 ${isEmpty ? 'flex flex-col items-center justify-center' : 'py-4 overflow-y-auto'}`}>
        {!mounted ? (
          <div className="w-20 h-20 bg-gradient-to-br from-[#00f0ff]/20 to-[#9d00ff]/10 rounded-2xl flex items-center justify-center border border-[#00f0ff]/30">
            <Bot className="w-10 h-10 text-[#00f0ff]" />
          </div>
        ) : isEmpty ? (
          <>
            <div className="w-20 h-20 bg-gradient-to-br from-[#00f0ff]/20 to-[#9d00ff]/10 rounded-2xl flex items-center justify-center mb-4 border border-[#00f0ff]/30 cyber-glow">
              <Bot className="w-10 h-10 text-[#00f0ff]" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">你好，我是IT智能助手</h2>
            <p className="text-[#8888aa] max-w-md mb-6 text-center">
              描述你遇到的IT问题，如电脑蓝屏、网络故障、软件安装等，我会尽力帮你解决
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {['电脑蓝屏了怎么办', '网络连不上', '如何申请软件权限'].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setInput(suggestion)}
                  className="px-4 py-2 bg-[#12122a] border border-[#2a2a4a] rounded-full text-sm text-[#8888aa] hover:border-[#00f0ff]/50 hover:text-[#00f0ff] transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
                  message.role === 'user' 
                    ? 'bg-gradient-to-br from-[#ff00aa] to-[#ff3366]' 
                    : 'bg-gradient-to-br from-[#00f0ff]/20 to-[#00f0ff]/5 border border-[#00f0ff]/30'
                }`}>
                  {message.role === 'user' ? (
                    <User className="w-4 h-4 text-white" />
                  ) : (
                    <Bot className="w-4 h-4 text-[#00f0ff]" />
                  )}
                </div>
                <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-gradient-to-r from-[#ff00aa] to-[#ff3366] text-white'
                    : 'bg-[#12122a] border border-[#2a2a4a] text-[#e0e0ff]'
                }`}>
                  {message.role === 'assistant' ? (
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h1: ({children}) => <h1 className="text-lg font-bold text-[#00f0ff] mb-2 mt-3">{children}</h1>,
                        h2: ({children}) => <h2 className="text-base font-semibold text-[#00f0ff] mb-2 mt-3">{children}</h2>,
                        h3: ({children}) => <h3 className="text-sm font-semibold text-[#00f0ff] mb-1 mt-2">{children}</h3>,
                        p: ({children}) => <p className="text-sm leading-relaxed mb-2 last:mb-0">{children}</p>,
                        ul: ({children}) => <ul className="list-disc list-inside text-sm mb-2 space-y-1">{children}</ul>,
                        ol: ({children}) => <ol className="list-decimal list-inside text-sm mb-2 space-y-1">{children}</ol>,
                        li: ({children}) => <li className="text-[#e0e0ff]">{children}</li>,
                        code: ({className, children}) => {
                          const isInline = !className
                          return isInline ? (
                            <code className="bg-[#0a0a0f] text-[#00ff88] px-1.5 py-0.5 rounded text-xs font-mono border border-[#2a2a4a]">{children}</code>
                          ) : (
                            <code className="block bg-[#0a0a0f] text-[#00ff88] p-3 rounded-lg text-xs font-mono border border-[#2a2a4a] overflow-x-auto my-2">{children}</code>
                          )
                        },
                        pre: ({children}) => <pre className="bg-[#0a0a0f] p-3 rounded-lg text-xs font-mono border border-[#2a2a4a] overflow-x-auto my-2">{children}</pre>,
                        strong: ({children}) => <strong className="font-semibold text-white">{children}</strong>,
                        em: ({children}) => <em className="italic text-[#8888aa]">{children}</em>,
                        blockquote: ({children}) => <blockquote className="border-l-2 border-[#00f0ff]/50 pl-3 italic text-[#8888aa] my-2">{children}</blockquote>,
                        a: ({href, children}) => <a href={href} className="text-[#00f0ff] underline hover:text-[#00d0dd]" target="_blank" rel="noopener noreferrer">{children}</a>,
                        hr: () => <hr className="border-[#2a2a4a] my-3" />,
                        table: ({children}) => <table className="w-full text-xs border-collapse my-2">{children}</table>,
                        th: ({children}) => <th className="border border-[#2a2a4a] bg-[#0a0a0f] p-2 text-left text-[#00f0ff]">{children}</th>,
                        td: ({children}) => <td className="border border-[#2a2a4a] p-2">{children}</td>,
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  ) : (
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
                  )}
                  
                  {message.role === 'assistant' && message.confidence !== undefined && (
                    <div className="mt-2 pt-2 border-t border-[#2a2a4a]">
                      <div className="flex items-center gap-2">
                        <Cpu className="w-3 h-3 text-[#8888aa]" />
                        <span className="text-xs text-[#8888aa]">置信度</span>
                        <span className={`text-sm font-semibold ${getConfidenceColor(message.confidence)}`}>
                          {(message.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                      <Progress 
                        value={message.confidence * 100} 
                        className="h-1 mt-1 bg-[#2a2a4a]"
                      />
                    </div>
                  )}
                  
                  <p className={`text-xs mt-1 ${
                    message.role === 'user' ? 'text-white/60' : 'text-[#8888aa]'
                  }`}>
                    {formatTime(message.createdAt)}
                  </p>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00f0ff]/20 to-[#00f0ff]/5 border border-[#00f0ff]/30 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-[#00f0ff]" />
                </div>
                <div className="bg-[#12122a] border border-[#2a2a4a] rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-2 text-[#00f0ff]">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">AI思考中...</span>
                  </div>
                </div>
              </div>
            )}

            {showFeedback && (
              <div className="flex items-center justify-center gap-3 py-4">
                <span className="text-sm text-[#8888aa]">问题解决了吗？</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFeedback(true)}
                  className="border-[#00ff88]/30 text-[#00ff88] hover:bg-[#00ff88]/10 hover:border-[#00ff88]"
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  已解决
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFeedback(false)}
                  className="border-[#ff3366]/30 text-[#ff3366] hover:bg-[#ff3366]/10 hover:border-[#ff3366]"
                >
                  <MessageSquare className="w-4 h-4 mr-1" />
                  未解决
                </Button>
              </div>
            )}

            {feedbackGiven && (
              <div className="text-center py-2">
                <Badge variant="success" className="bg-[#00ff88]/10 border border-[#00ff88]/30 text-[#00ff88]">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  感谢您的反馈
                </Badge>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      {/* Input Area - Always at bottom */}
      <footer className="bg-[#12122a]/80 backdrop-blur-sm border-t border-[#2a2a4a] sticky bottom-0">
        <div className="max-w-3xl mx-auto px-4 py-3">
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {attachments.map((file, index) => (
                <div key={index} className="flex items-center gap-1 px-2 py-1 bg-[#0a0a0f] border border-[#2a2a4a] rounded text-xs text-[#8888aa]">
                  <Paperclip className="w-3 h-3" />
                  <span className="max-w-[80px] truncate">{file.name}</span>
                  <button onClick={() => removeAttachment(index)} className="text-[#ff3366] hover:text-[#ff6688]">×</button>
                </div>
              ))}
            </div>
          )}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input ref={fileInputRef} type="file" accept="image/*,.pdf" multiple onChange={handleFileSelect} className="hidden" />
            <Button type="button" variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} className="flex-shrink-0 text-[#8888aa] hover:text-[#00f0ff] hover:bg-[#00f0ff]/10">
              <Paperclip className="w-5 h-5" />
            </Button>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="输入你的问题..."
              className="flex-1 bg-[#0a0a0f] border-[#2a2a4a] text-white placeholder:text-[#666688] focus:border-[#00f0ff]/50 focus:ring-[#00f0ff]/20"
              disabled={loading}
            />
            <Button type="submit" size="icon" disabled={loading || !input.trim()} className="flex-shrink-0 bg-gradient-to-r from-[#00f0ff] to-[#00c0cc] text-[#0a0a0f] hover:opacity-90 cyber-glow">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </Button>
          </form>
        </div>
      </footer>

      {/* Create Ticket Modal */}
      <Dialog open={showCreateTicketModal} onOpenChange={setShowCreateTicketModal}>
        <DialogContent className="bg-[#12122a] border border-[#00f0ff]/30 sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <div className="w-10 h-10 bg-gradient-to-br from-[#00f0ff]/20 to-[#00f0ff]/5 rounded-xl flex items-center justify-center border border-[#00f0ff]/30">
                <Ticket className="w-5 h-5 text-[#00f0ff]" />
              </div>
              创建工单
            </DialogTitle>
            <DialogDescription className="text-[#8888aa]">
              填写以下信息，提交后坐席人员会尽快处理
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="ticket-type" className="text-[#e0e0ff]">问题类型 *</Label>
              <select
                id="ticket-type"
                value={ticketType}
                onChange={(e) => setTicketType(e.target.value)}
                className="w-full h-10 px-3 bg-[#0a0a0f] border border-[#2a2a4a] rounded-md text-sm text-[#e0e0ff] focus:outline-none focus:border-[#00f0ff]/50"
                required
              >
                <option value="">请选择问题类型</option>
                {problemTypes.map((type) => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ticket-title" className="text-[#e0e0ff]">问题标题 *</Label>
              <Input
                id="ticket-title"
                value={ticketTitle}
                onChange={(e) => setTicketTitle(e.target.value)}
                placeholder="简要描述问题"
                className="bg-[#0a0a0f] border-[#2a2a4a] text-white placeholder:text-[#666688]"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ticket-desc" className="text-[#e0e0ff]">问题详情 *</Label>
              <Textarea
                id="ticket-desc"
                value={ticketDescription}
                onChange={(e) => setTicketDescription(e.target.value)}
                placeholder="请详细描述您遇到的问题..."
                rows={5}
                className="bg-[#0a0a0f] border-[#2a2a4a] text-white placeholder:text-[#666688] resize-none"
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateTicketModal(false)} className="border-[#2a2a4a] text-[#8888aa] hover:bg-[#1a1a2e]">
              取消
            </Button>
            <Button onClick={handleCreateTicket} disabled={createTicketLoading} className="bg-gradient-to-r from-[#00f0ff] to-[#00c0cc] text-[#0a0a0f] hover:opacity-90">
              {createTicketLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Ticket className="w-4 h-4 mr-2" />
              )}
              提交工单
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Messages Dialog */}
      <Dialog open={showMessagesDialog} onOpenChange={setShowMessagesDialog}>
        <DialogContent className="bg-[#12122a] border border-[#00f0ff]/30 sm:max-w-[500px] max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <div className="w-10 h-10 bg-gradient-to-br from-[#ff00aa]/20 to-[#ff00aa]/5 rounded-xl flex items-center justify-center border border-[#ff00aa]/30">
                <Mail className="w-5 h-5 text-[#ff00aa]" />
              </div>
              收到的消息
            </DialogTitle>
            <DialogDescription className="text-[#8888aa]">
              坐席人员发送给您的消息
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto py-4">
            {loadingAgentMessages ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-[#00f0ff]" />
              </div>
            ) : agentMessages.length === 0 ? (
              <div className="text-center py-8 text-[#8888aa]">
                <Mail className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">暂无消息</p>
                <p className="text-xs mt-1">坐席人员发送的消息将在此处显示</p>
              </div>
            ) : (
              <div className="space-y-4">
                {agentMessages.map((msg) => (
                  <div key={msg.id} className="bg-[#0a0a0f] rounded-xl border border-[#2a2a4a] p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="secondary" className="bg-[#00f0ff]/10 border-[#00f0ff]/30 text-[#00f0ff] text-xs">
                        工单: {msg.ticketTitle.slice(0, 20)}{msg.ticketTitle.length > 20 ? '...' : ''}
                      </Badge>
                      <span className="text-xs text-[#8888aa]">
                        {new Date(msg.createdAt).toLocaleString('zh-CN')}
                      </span>
                    </div>
                    <p className="text-sm text-[#e0e0ff] whitespace-pre-wrap">{msg.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
