const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY
const MINIMAX_MODEL = process.env.MINIMAX_MODEL || 'abab6.5s-chat'
const MINIMAX_BASE_URL = 'https://api.minimax.chat/v1'

interface MiniMaxMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface ChatCompletionResponse {
  choices: Array<{
    message: {
      content: string
    }
  }>
  usage?: {
    prompt_tokens: number
    completion_tokens: number
  }
}

export async function chatCompletion(
  messages: MiniMaxMessage[],
  temperature: number = 0.7
): Promise<string> {
  try {
    const response = await fetch(`${MINIMAX_BASE_URL}/text/chatcompletion_v2`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${MINIMAX_API_KEY}`,
      },
      body: JSON.stringify({
        model: MINIMAX_MODEL,
        messages,
        temperature,
      }),
    })

    if (response.ok) {
      const data: ChatCompletionResponse = await response.json()
      if (data.choices?.[0]?.message?.content) {
        return data.choices[0].message.content
      }
    }
  } catch {
    // Fall back to mock response
  }

  // Fallback: generate a mock response based on the last user message
  const lastUserMessage = messages.filter(m => m.role === 'user').pop()?.content || ''
  return generateMockResponse(lastUserMessage)
}

function generateMockResponse(question: string): string {
  // Simple keyword-based mock responses for demo
  const lowerQ = question.toLowerCase()
  
  if (lowerQ.includes('蓝屏') || lowerQ.includes('死机')) {
    return `根据您描述的问题，这是电脑蓝屏的解决方法：

1. 首先记录蓝屏错误代码（通常是 0x000000xx 格式）
2. 重启电脑，进入安全模式（开机时按 F8）
3. 检查最近是否安装了新软件或驱动
4. 如果有，请卸载后重新安装稳定版本驱动
5. 运行 Windows 内存诊断工具检查 RAM
6. 检查硬盘健康状态（使用 CrystalDiskInfo）

如果问题依旧存在，建议提交人工工单，由 IT 人员协助处理。`
  }
  
  if (lowerQ.includes('网络') || lowerQ.includes('连不上') || lowerQ.includes('wifi')) {
    return `网络连接问题的排查步骤：

1. 检查网线是否插好，或 WiFi 是否连接
2. 重启路由器和电脑
3. 检查网络适配器是否启用
4. 运行 ipconfig /release 和 ipconfig /renew 刷新 IP
5. 检查是否可以 ping 通网关

如仍无法解决，请联系 IT 部门。`
  }
  
  if (lowerQ.includes('打印') || lowerQ.includes('打印机')) {
    return `打印机无法连接的解决方案：

1. 检查打印机是否开机并连接
2. 确认电脑和打印机在同一个网络
3. 在控制面板中删除并重新添加打印机
4. 更新打印机驱动程序
5. 检查打印服务是否运行（services.msc）

如仍无法解决，请提交人工工单。`
  }
  
  if (lowerQ.includes('账号') || lowerQ.includes('权限')) {
    return `账号权限申请流程：

1. 联系直属上级审批
2. 登录 IT 帮辅系统提交申请
3. 说明需要的系统权限
4. IT 部门会在 24 小时内处理
5. 审批通过后，权限会自动生效

如有紧急需要，请联系 IT 部门。`
  }
  
  return `感谢您的提问！

根据您的描述："${question.slice(0, 50)}..."

建议您：
1. 提供更多细节信息（如错误代码、具体场景等）
2. 如果问题紧急，请提交人工工单

我可以帮您处理各类 IT 问题，包括电脑故障、网络问题、软件安装等。`
}

// Ollama configuration for embeddings
const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434'
const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || 'bge-m3'

export async function embedText(text: string): Promise<number[]> {
  // Try Ollama API first (local embedding)
  try {
    const response = await fetch(`${OLLAMA_HOST}/api/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        prompt: text,
      }),
    })

    if (response.ok) {
      const data = await response.json()
      if (data.embedding && Array.isArray(data.embedding)) {
        // Normalize the embedding (L2 norm) for better cosine similarity
        const embedding = data.embedding
        const magnitude = Math.sqrt(embedding.reduce((sum, v) => sum + v * v, 0))
        if (magnitude > 0) {
          return embedding.map(v => v / magnitude)
        }
        return embedding
      }
    }
  } catch {
    // Fall back to local embedding
  }

  // Fallback: use deterministic hash-based embedding
  return textToVector(text)
}

// Deterministic text-to-vector conversion (fallback when API unavailable)
function textToVector(text: string, dim: number = 1536): number[] {
  const crypto = require('crypto')
  const vector: number[] = []
  
  for (let i = 0; i < dim; i++) {
    const hashInput = `${text}:${i}`
    const hashVal = crypto.createHash('md5').update(hashInput).digest('hex')
    const floatVal = (parseInt(hashVal.slice(0, 8), 16) / 0xFFFFFFFF) * 2 - 1
    vector.push(floatVal)
  }
  
  // Normalize
  const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0))
  if (magnitude > 0) {
    return vector.map(v => v / magnitude)
  }
  return vector
}

export interface RAGResult {
  answer: string
  confidence: number
  retrievedChunks: string[]
  confidenceBreakdown: {
    retrievalScore: number
    consistencyScore: number
  }
}

export async function generateAnswerWithConfidence(
  question: string,
  context: string[],
  conversationHistory: Array<{role: string; content: string}> = []
): Promise<RAGResult> {
  // If no context, low confidence
  if (!context || context.length === 0) {
    const answer = await chatCompletion([
      { role: 'user', content: question },
    ])
    return {
      answer,
      confidence: 0.3,
      retrievedChunks: [],
      confidenceBreakdown: {
        retrievalScore: 0,
        consistencyScore: 0.3,
      },
    }
  }

  const contextText = context.map((c, i) => `[文档${i + 1}]:\n${c}`).join('\n\n')

  // Confidence calculation based on ChromaDB retrieval quality
  // ChromaDB returns chunks sorted by relevance, so position matters
  const lowerQ = question.toLowerCase()
  
  // Check how many chunks have meaningful overlap with the question
  let relevantChunks = 0
  context.forEach((chunk, idx) => {
    const chunkLower = chunk.toLowerCase()
    
    // Check for keyword overlap (at least 2 common words >= 2 chars)
    const questionWords = new Set(lowerQ.match(/[\w\u4e00-\u9fa5]{2,}/g) || [])
    const chunkWords = new Set(chunkLower.match(/[\w\u4e00-\u9fa5]{2,}/g) || [])
    
    let overlap = 0
    questionWords.forEach(w => {
      if (chunkWords.has(w) && w.length >= 2) overlap++
    })
    
    // Consider chunk relevant if it has at least 20% keyword overlap OR is in top 2 results
    if (overlap >= questionWords.size * 0.2 || idx < 2) {
      relevantChunks++
    }
  })
  
  // Base retrieval score from number of relevant chunks
  // More relevant chunks = higher confidence
  const retrievalScore = Math.min(0.3 + (relevantChunks / context.length) * 0.5, 0.9)

  // Build messages array with conversation history
  const messages: MiniMaxMessage[] = []
  
  // System prompt
  let systemPrompt = `你是一个IT桌面运维助手，基于以下知识库内容回答员工的问题。

要求：
1. 如果知识库中有相关内容，基于内容给出准确答案
2. 如果没有相关内容，明确告知"抱歉，知识库中没有找到相关信息，建议提交人工工单"
3. 回答要清晰、实用，包含具体步骤
4. 如果是追问，请结合之前的对话上下文回答`

  if (conversationHistory.length > 0) {
    systemPrompt += `\n\n[对话历史]\n${conversationHistory.map(m => `${m.role === 'user' ? '员工' : '助手'}: ${m.content}`).join('\n')}`
  }

  systemPrompt += `\n\n[知识库内容]\n${contextText}`

  messages.push({ role: 'system', content: systemPrompt })

  // Add conversation history
  conversationHistory.forEach(msg => {
    messages.push({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    })
  })

  // Add current question
  messages.push({ role: 'user', content: question })

  const answer = await chatCompletion(messages)

  // Check answer consistency
  const answerLower = answer.toLowerCase()
  
  // Check if answer mentions it can't help (should be rare with good context)
  const cantHelpPhrases = ['没有找到', '无法回答', '不知道', '知识库中没有', '抱歉']
  const isCantHelpAnswer = cantHelpPhrases.some(phrase => answerLower.includes(phrase))
  
  // Check if answer is suspiciously short (likely fallback)
  const isTooShort = answer.length < 30
  
  // Simple consistency: if answer addresses common IT issue keywords, it's likely good
  const itKeywords = ['重启', '驱动', '安装', '检查', '更新', '连接', '设置', '步骤', '解决', '联系']
  const addressesItIssue = itKeywords.some(kw => answerLower.includes(kw))
  
  let consistencyScore = 0.7 // Default good score
  if (isCantHelpAnswer) {
    consistencyScore = 0.3 // Very rare case
  } else if (isTooShort) {
    consistencyScore = 0.5 // Suspiciously short
  } else if (!addressesItIssue && answer.length < 100) {
    consistencyScore = 0.5 // Might be a poor response
  }

  // Final confidence: weighted average
  const confidence = 0.6 * retrievalScore + 0.4 * consistencyScore

  return {
    answer,
    confidence: Math.round(confidence * 100) / 100,
    retrievedChunks: context,
    confidenceBreakdown: {
      retrievalScore,
      consistencyScore,
    },
  }
}

// AI 生成质检报告草稿
export async function generateQAReport(
  ticketDescription: string,
  knowledgeContext: string[]
): Promise<{ title: string; content: string }> {
  const contextText = knowledgeContext.join('\n\n')

  const systemPrompt = `你是一个IT运维质检报告生成专家。根据以下信息生成一份完整的质检报告。

要求：
1. 标题简洁明了
2. 内容包含：问题概述、解决步骤（分步骤写）、注意事项
3. 解决步骤要详细、可操作，适合员工自助解决
4. 语言要专业但易懂`

  const userPrompt = `员工问题：
${ticketDescription}

相关知识库内容：
${contextText || '无相关知识库内容，请基于常见IT运维问题处理经验生成报告'}

请生成一份质检报告，包含标题和完整内容。`

  const result = await chatCompletion([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ])

  // Parse the result - expect format: "标题：xxx\n\n内容：xxx"
  const lines = result.split('\n')
  let title = 'IT问题质检报告'
  let content = result

  for (const line of lines) {
    if (line.startsWith('标题：') || line.startsWith('标题:')) {
      title = line.replace(/^标题[：:]\s*/, '').trim()
      content = result.replace(line, '').replace(/^内容[：:]\s*/, '').trim()
      break
    }
  }

  return { title, content }
}

// AI 提取工单关键字段
export async function extractTicketFields(
  ticketDescription: string
): Promise<Record<string, string>> {
  const systemPrompt = `你是一个IT工单分析专家。请从以下工单描述中提取关键信息。

提取以下字段：
- 问题类型：硬件故障/网络问题/软件问题/账号权限/其他
- 设备信息：电脑型号、操作系统、错误代码等（如有）
- 紧急程度：高/中/低
- 涉及部门：员工所属部门（如能判断）

以JSON格式输出，键为字段名，值为提取到的内容。如果没有某项信息，值设为"未提供"。`

  const result = await chatCompletion([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: ticketDescription },
  ])

  try {
    // Try to parse as JSON
    const jsonMatch = result.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
  } catch {
    // Return parsed text fields
  }

  return {
    rawAnalysis: result,
    问题类型: '待确认',
    设备信息: '待确认',
    紧急程度: '中',
    涉及部门: '待确认',
  }
}
