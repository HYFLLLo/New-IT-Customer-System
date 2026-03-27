'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  X, Send, Bot, User, Clock, CheckCircle, Loader2, 
  FileText, AlertTriangle, Cpu, MessageSquare, Wrench,
  Phone, Sparkles, ChevronDown, ChevronUp, Edit3, Save
} from 'lucide-react'

// Ticket types
interface TicketMessage {
  id: string
  content: string
  type: string
  senderId?: string
  createdAt: string
}

interface QAReport {
  id: string
  title: string
  content: string
  createdAt: string
}

interface Ticket {
  id: string
  title: string
  description?: string
  status: string
  confidence?: number | null
  createdAt: string
  employee: { id: string; name: string; email: string }
  messages?: TicketMessage[]
  qaReports?: QAReport[]
  _count?: { messages: number; qaReports: number }
}

interface ExtractedFields {
  problemType: string
  deviceInfo: string
  urgency: string
  department: string
}

// Preset messages
const PRESET_MESSAGES = [
  {
    id: 'on_site',
    title: '安排上门处理',
    content: '您好，您的工单已安排工作人员上门处理，请保持电话畅通。工作人员将在近期内联系您，感谢您的耐心等待！',
    icon: Wrench,
    color: 'text-[#ff3366]'
  },
  {
    id: 'qc_report',
    title: '发送质检报告',
    content: '您好！已为您发送详细的质检报告，请按照报告中的步骤操作。如有疑问或问题依旧存在，请联系工作人员。',
    icon: FileText,
    color: 'text-[#00f0ff]'
  }
]

const CURRENT_AGENT_ID = 'agent-001'

interface TicketProcessingModalProps {
  open: boolean
  onClose: () => void
  ticket: Ticket | null
  onTicketUpdate?: () => void
}

export function TicketProcessingModal({ open, onClose, ticket, onTicketUpdate }: TicketProcessingModalProps) {
  const [activeTab, setActiveTab] = useState<'chat' | 'report' | 'send'>('chat')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  
  // Extracted fields
  const [extractedFields, setExtractedFields] = useState<ExtractedFields | null>(null)
  const [extractingFields, setExtractingFields] = useState(false)
  const [fieldsExpanded, setFieldsExpanded] = useState(true)
  
  // Report
  const [reportTitle, setReportTitle] = useState('')
  const [reportContent, setReportContent] = useState('')
  const [generatingReport, setGeneratingReport] = useState(false)
  const [editingReport, setEditingReport] = useState(false)
  
  // Message
  const [customMessage, setCustomMessage] = useState('')
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null)

  useEffect(() => {
    if (ticket && open) {
      // Load existing report if any
      if (ticket.qaReports?.[0]) {
        setReportTitle(ticket.qaReports[0].title)
        setReportContent(ticket.qaReports[0].content)
      }
      // Extract fields automatically
      handleExtractFields()
    }
  }, [ticket, open])

  const handleExtractFields = async () => {
    if (!ticket) return
    
    setExtractingFields(true)
    try {
      const res = await fetch('/api/agent/tickets/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId: ticket.id }),
      })
      const data = await res.json()
      if (data.fields) {
        setExtractedFields(data.fields)
      } else {
        // Fallback if extraction fails
        const desc = ticket.description || ''
        setExtractedFields({
          problemType: desc.includes('网络') ? '网络问题' : 
                       desc.includes('打印') ? '硬件问题' : '其他',
          deviceInfo: '待确认',
          urgency: '中',
          department: '待确认'
        })
      }
    } catch (error) {
      toast.error('提取字段失败')
    } finally {
      setExtractingFields(false)
    }
  }

  const handleGenerateReport = async () => {
    if (!ticket) return

    setGeneratingReport(true)
    try {
      const res = await fetch('/api/agent/reports', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId: ticket.id }),
      })
      const data = await res.json()
      if (data.title && data.content) {
        setReportTitle(data.title)
        setReportContent(data.content)
        setEditingReport(true)
        toast.success('AI 质检报告已生成')
        setActiveTab('report')
      }
    } catch (error) {
      toast.error('生成失败')
    } finally {
      setGeneratingReport(false)
    }
  }

  const handleSendReport = async () => {
    if (!ticket || !reportTitle.trim() || !reportContent.trim()) return

    setSending(true)
    try {
      await fetch('/api/agent/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: ticket.id,
          title: reportTitle,
          content: reportContent,
          generatedBy: 'AI',
          createdById: CURRENT_AGENT_ID,
        }),
      })
      toast.success('质检报告已发送')
      onTicketUpdate?.()
      onClose()
    } catch (error) {
      toast.error('发送失败')
    } finally {
      setSending(false)
    }
  }

  const handleSendPresetMessage = async (messageId: string) => {
    if (!ticket) return
    
    const preset = PRESET_MESSAGES.find(m => m.id === messageId)
    if (!preset) return

    setSending(true)
    try {
      await fetch('/api/agent/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: ticket.id,
          senderId: CURRENT_AGENT_ID,
          content: preset.content,
          type: 'AGENT',
        }),
      })
      
      // If sending QC report message, also send the report
      if (messageId === 'qc_report' && reportTitle && reportContent) {
        await fetch('/api/agent/reports', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ticketId: ticket.id,
            title: reportTitle,
            content: reportContent,
            generatedBy: 'AI',
            createdById: CURRENT_AGENT_ID,
          }),
        })
      }
      
      // Update ticket status
      await fetch(`/api/agent/tickets/${ticket.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'IN_PROGRESS' }),
      })
      
      toast.success('消息已发送')
      onTicketUpdate?.()
      onClose()
    } catch (error) {
      toast.error('发送失败')
    } finally {
      setSending(false)
    }
  }

  const handleSendCustomMessage = async () => {
    if (!ticket || !customMessage.trim()) return

    setSending(true)
    try {
      await fetch('/api/agent/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: ticket.id,
          senderId: CURRENT_AGENT_ID,
          content: customMessage,
          type: 'AGENT',
        }),
      })
      toast.success('消息已发送')
      setCustomMessage('')
      onTicketUpdate?.()
      onClose()
    } catch (error) {
      toast.error('发送失败')
    } finally {
      setSending(false)
    }
  }

  if (!ticket) return null

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-[#12122a] border border-[#2a2a4a] max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-white flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-[#ff00aa]/20 to-[#ff00aa]/5 rounded-xl flex items-center justify-center border border-[#ff00aa]/30">
                <FileText className="w-5 h-5 text-[#ff00aa]" />
              </div>
              <div>
                <div className="text-sm font-normal text-[#8888aa]">工单处理</div>
                <div className="text-base">{ticket.title.slice(0, 30)}{ticket.title.length > 30 ? '...' : ''}</div>
              </div>
            </DialogTitle>
            <button onClick={onClose} className="text-[#8888aa] hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex gap-2 px-1 py-2 border-b border-[#2a2a4a] flex-shrink-0">
          {[
            { key: 'chat', label: '对话记录', icon: MessageSquare },
            { key: 'report', label: '质检报告', icon: FileText },
            { key: 'send', label: '发送消息', icon: Send },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${
                activeTab === key
                  ? 'bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/30'
                  : 'text-[#8888aa] hover:text-white hover:bg-[#1a1a2e]'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'chat' && (
            <div className="p-4 space-y-4">
              {/* AI Extracted Fields */}
              <div className="bg-[#0a0a0f] rounded-xl border border-[#2a2a4a] overflow-hidden">
                <button 
                  onClick={() => setFieldsExpanded(!fieldsExpanded)}
                  className="w-full px-4 py-3 flex items-center justify-between bg-[#0a0a0f] hover:bg-[#12122a] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-[#00f0ff]" />
                    <span className="text-sm font-medium text-white">AI 提取的关键字段</span>
                    {extractingFields && <Loader2 className="w-3 h-3 animate-spin text-[#00f0ff]" />}
                  </div>
                  {fieldsExpanded ? (
                    <ChevronUp className="w-4 h-4 text-[#8888aa]" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[#8888aa]" />
                  )}
                </button>
                
                {fieldsExpanded && extractedFields && (
                  <div className="px-4 pb-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { label: '问题类型', value: extractedFields.problemType, color: 'text-[#00f0ff]' },
                      { label: '设备信息', value: extractedFields.deviceInfo, color: 'text-[#ff00aa]' },
                      { label: '紧急程度', value: extractedFields.urgency, color: extractedFields.urgency === '高' ? 'text-[#ff3366]' : 'text-[#ffcc00]' },
                      { label: '涉及部门', value: extractedFields.department, color: 'text-[#00ff88]' },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="bg-[#12122a] rounded-lg p-3">
                        <div className="text-xs text-[#8888aa] mb-1">{label}</div>
                        <div className={`text-sm font-medium ${color}`}>{value}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Original Problem */}
              <div className="bg-[#0a0a0f] rounded-xl border border-[#2a2a4a] p-4">
                <div className="flex items-center gap-2 mb-3">
                  <User className="w-4 h-4 text-[#ff00aa]" />
                  <span className="text-sm font-medium text-white">原始问题</span>
                </div>
                <p className="text-sm text-[#e0e0ff] whitespace-pre-wrap">{ticket.description || '无描述'}</p>
                <div className="flex items-center gap-4 text-xs text-[#8888aa] mt-3 pt-3 border-t border-[#2a2a4a]">
                  <span>{ticket.employee.name}</span>
                  <span>·</span>
                  <span>{ticket.employee.email}</span>
                  <span>·</span>
                  <span>{new Date(ticket.createdAt).toLocaleString('zh-CN')}</span>
                </div>
              </div>

              {/* Messages */}
              <div className="space-y-3">
                <div className="text-sm font-medium text-white">对话记录</div>
                {!ticket.messages || ticket.messages.length === 0 ? (
                  <div className="text-center py-8 text-[#8888aa]">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">暂无对话记录</p>
                  </div>
                ) : (
                  ticket.messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-3 rounded-xl ${
                        msg.type === 'USER'
                          ? 'bg-gradient-to-r from-[#ff00aa]/20 to-[#ff3366]/10 border border-[#ff00aa]/20 ml-8'
                          : msg.type === 'AI'
                          ? 'bg-[#12122a] border border-[#2a2a4a] mr-8'
                          : 'bg-gradient-to-r from-[#00f0ff]/10 to-[#00f0ff]/5 border border-[#00f0ff]/20 mr-8'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className={`text-xs font-medium ${
                          msg.type === 'USER' ? 'text-[#ff00aa]' : 
                          msg.type === 'AI' ? 'text-[#00f0ff]' : 'text-[#00ff88]'
                        }`}>
                          {msg.type === 'USER' ? ticket.employee.name : 
                           msg.type === 'AI' ? 'AI 助手' : '坐席人员'}
                        </span>
                        <span className="text-xs text-[#8888aa]">
                          {new Date(msg.createdAt).toLocaleString('zh-CN')}
                        </span>
                      </div>
                      <p className="text-sm text-[#e0e0ff] whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'report' && (
            <div className="p-4 space-y-4">
              {/* Generate Report Button */}
              <Button
                onClick={handleGenerateReport}
                disabled={generatingReport}
                className="w-full bg-gradient-to-r from-[#00f0ff] to-[#00c0cc] text-[#0a0a0f] hover:opacity-90"
              >
                {generatingReport ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    AI 生成中...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    AI 生成质检报告
                  </>
                )}
              </Button>

              {reportTitle && (
                <div className="space-y-3">
                  <Input
                    value={reportTitle}
                    onChange={(e) => { setReportTitle(e.target.value); setEditingReport(true); }}
                    placeholder="报告标题"
                    className="bg-[#0a0a0f] border-[#2a2a4a] text-white"
                  />
                  
                  <Textarea
                    value={reportContent}
                    onChange={(e) => { setReportContent(e.target.value); setEditingReport(true); }}
                    rows={12}
                    placeholder="报告内容..."
                    className="bg-[#0a0a0f] border-[#2a2a4a] text-white resize-none"
                  />
                  
                  {editingReport && (
                    <div className="flex items-center gap-2 text-xs text-[#ffcc00]">
                      <Edit3 className="w-3 h-3" />
                      报告已修改，可发送或继续编辑
                    </div>
                  )}
                  
                  <Button
                    onClick={handleSendReport}
                    disabled={sending || !reportTitle.trim() || !reportContent.trim()}
                    className="w-full bg-gradient-to-r from-[#00ff88] to-[#00cc66] text-[#0a0a0f] hover:opacity-90"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    发送质检报告给员工
                  </Button>
                </div>
              )}

              {!reportTitle && !generatingReport && (
                <div className="text-center py-12 text-[#8888aa]">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">点击上方按钮，AI 将基于知识库和工单内容</p>
                  <p className="text-sm">生成一份完整的质检报告</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'send' && (
            <div className="p-4 space-y-4">
              {/* Preset Messages */}
              <div className="space-y-3">
                <div className="text-sm font-medium text-white">快捷消息</div>
                {PRESET_MESSAGES.map((preset) => {
                  const Icon = preset.icon
                  return (
                    <button
                      key={preset.id}
                      onClick={() => handleSendPresetMessage(preset.id)}
                      disabled={sending}
                      className={`w-full text-left p-4 rounded-xl border transition-all ${
                        selectedPreset === preset.id
                          ? 'border-[#00f0ff]/50 bg-[#00f0ff]/10'
                          : 'border-[#2a2a4a] bg-[#0a0a0f] hover:border-[#00f0ff]/30'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg bg-[#12122a] flex items-center justify-center ${preset.color}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-white">{preset.title}</div>
                          <div className="text-sm text-[#8888aa] mt-1 line-clamp-2">{preset.content}</div>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-[#2a2a4a]" />
                <span className="text-xs text-[#8888aa]">或</span>
                <div className="flex-1 h-px bg-[#2a2a4a]" />
              </div>

              {/* Custom Message */}
              <div className="space-y-3">
                <div className="text-sm font-medium text-white">自定义消息</div>
                <Textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  rows={4}
                  placeholder="输入要发送的消息..."
                  className="bg-[#0a0a0f] border-[#2a2a4a] text-white resize-none"
                />
                <Button
                  onClick={handleSendCustomMessage}
                  disabled={sending || !customMessage.trim()}
                  className="w-full bg-gradient-to-r from-[#ff00aa] to-[#ff3366] text-white hover:opacity-90"
                >
                  <Send className="w-4 h-4 mr-2" />
                  发送消息
                </Button>
              </div>

              {/* Contact Staff Button Info */}
              <div className="bg-[#0a0a0f] rounded-xl border border-[#2a2a4a] p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#ff3366]/10 flex items-center justify-center">
                    <Phone className="w-5 h-5 text-[#ff3366]" />
                  </div>
                  <div>
                    <div className="font-medium text-white">联系工作人员</div>
                    <div className="text-sm text-[#8888aa] mt-1">
                      如果员工点击"联系工作人员"按钮，系统将自动创建新工单并通知客服人员
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Status */}
        <div className="flex-shrink-0 px-4 py-3 border-t border-[#2a2a4a] bg-[#0a0a0f]">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-4">
              <Badge className={
                ticket.status === 'OPEN' ? 'bg-[#ff3366]/10 border-[#ff3366]/30 text-[#ff3366]' :
                ticket.status === 'AI_ANSWERED' ? 'bg-[#ffcc00]/10 border-[#ffcc00]/30 text-[#ffcc00]' :
                ticket.status === 'IN_PROGRESS' ? 'bg-[#00f0ff]/10 border-[#00f0ff]/30 text-[#00f0ff]' :
                'bg-[#00ff88]/10 border-[#00ff88]/30 text-[#00ff88]'
              }>
                {ticket.status === 'OPEN' ? '待处理' :
                 ticket.status === 'AI_ANSWERED' ? 'AI已回答' :
                 ticket.status === 'IN_PROGRESS' ? '处理中' :
                 ticket.status === 'RESOLVED' ? '已解决' : '已关闭'}
              </Badge>
              {ticket.confidence && (
                <div className="flex items-center gap-1">
                  <Cpu className="w-3 h-3 text-[#8888aa]" />
                  <span className="text-[#8888aa]">置信度</span>
                  <span className="text-[#00f0ff]">{(ticket.confidence * 100).toFixed(0)}%</span>
                </div>
              )}
            </div>
            <div className="text-[#8888aa]">
              {ticket.employee.name} · {new Date(ticket.createdAt).toLocaleString('zh-CN')}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
