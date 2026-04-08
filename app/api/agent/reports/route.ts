import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateQAReport } from '@/lib/minimax'
import { searchChunks } from '@/lib/chroma'

// GET /api/agent/reports - List QA reports
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const ticketId = searchParams.get('ticketId')

  const where = ticketId ? { ticketId } : {}

  const reports = await prisma.qAReport.findMany({
    where,
    include: {
      ticket: {
        select: { id: true, title: true, employee: { select: { name: true } } },
      },
      createdBy: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ reports })
}

// POST /api/agent/reports - Create QA report (AI generated or manual)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { ticketId, title, content, generatedBy, createdById } = body

    if (!ticketId || !title || !content || !createdById) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const report = await prisma.qAReport.create({
      data: {
        ticketId,
        title,
        content,
        generatedBy: generatedBy || 'MANUAL',
        createdById,
      },
      include: {
        ticket: {
          select: { id: true, title: true, employee: { select: { name: true } } },
        },
      },
    })

    // Add report message to ticket
    await prisma.message.create({
      data: {
        ticketId,
        senderId: createdById,
        content: `【质检报告】${title}\n\n${content}`,
        type: 'AGENT',
      },
    })

    // Update ticket status
    await prisma.ticket.update({
      where: { id: ticketId },
      data: { status: 'RESOLVED' },
    })

    return NextResponse.json({ report }, { status: 201 })
  } catch (error) {
    console.error('Create report error:', error)
    return NextResponse.json(
      { error: 'Failed to create report' },
      { status: 500 }
    )
  }
}

// POST /api/agent/reports/generate - AI generate report draft
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { ticketId } = body

    if (!ticketId) {
      return NextResponse.json(
        { error: 'Missing ticketId' },
        { status: 400 }
      )
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
    })

    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      )
    }

    // 完全不使用知识库内容，只基于对话历史和工单描述生成报告
    // 这样可以确保AI不会直接复制知识库内容
    const context: string[] = []

    // Get conversation history
    const messages = await prisma.message.findMany({
      where: { ticketId },
      orderBy: { createdAt: 'asc' },
    })
    
    console.log('=== 调试信息 ===')
    console.log('工单ID:', ticketId)
    console.log('工单描述:', ticket.description)
    console.log('消息数量:', messages.length)
    console.log('消息内容:', messages.map(m => ({type: m.type, content: m.content.substring(0, 50)})))
    
    const conversationHistory = messages.map(m => ({
      role: m.type === 'USER' ? 'user' : 'assistant',
      content: m.content.replace(/^\[AI 回答\]\n/, ''),
    }))

    // Generate report
    console.log('开始生成报告...')
    const { title, content } = await generateQAReport(ticket.description, context, conversationHistory)
    console.log('报告生成完成，标题:', title)
    console.log('报告内容长度:', content.length)

    return NextResponse.json({ title, content })
  } catch (error) {
    console.error('Generate report error:', error)
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    )
  }
}
