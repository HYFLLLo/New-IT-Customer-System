import { prisma } from '@/lib/prisma'
import { chatCompletion } from '@/lib/minimax'

export interface AnalysisResult {
  category: 'retrieval' | 'answer' | 'knowledge'
  rootCause: string
  suggestions: string[]
  confidence: number
}

const ANALYSIS_PROMPT = `你是一个IT技术支持问题分析专家。请分析以下 Badcase 并进行分类：

问题：{question}
AI回答：{answer}
置信度：{confidence}
评测详情：accuracy={accuracy}, relevance={relevance}, completeness={completeness}

分类选项：
- retrieval: 知识库检索不足，导致无法提供准确回答
- answer: 知识库有相关内容，但AI回答错误或不当
- knowledge: 知识库完全缺少相关知识

请输出JSON格式：
{
  "category": "retrieval|answer|knowledge",
  "rootCause": "根因描述，50字以内",
  "suggestions": ["建议1", "建议2"],
  "confidence": 分类置信度 0-1
}`

export async function analyzeBadcase(badcaseId: string): Promise<AnalysisResult | null> {
  const badcase = await prisma.badcase.findUnique({
    where: { id: badcaseId }
  })

  if (!badcase) {
    console.error(`Badcase not found: ${badcaseId}`)
    return null
  }

  // 如果已经有分析结果且是自动分析且置信度高，直接返回
  if (badcase.category && badcase.rootCause) {
    return {
      category: badcase.category as 'retrieval' | 'answer' | 'knowledge',
      rootCause: badcase.rootCause,
      suggestions: [],
      confidence: 0.9
    }
  }

  try {
    const prompt = ANALYSIS_PROMPT
      .replace('{question}', badcase.question)
      .replace('{answer}', badcase.answer || '无回答')
      .replace('{confidence}', String(badcase.confidence || 'N/A'))
      .replace('{accuracy}', 'N/A')
      .replace('{relevance}', 'N/A')
      .replace('{completeness}', 'N/A')

    const result = await chatCompletion([
      { role: 'user', content: prompt }
    ], 0.3, 20000)

    const jsonMatch = result.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('Failed to parse LLM analysis result')
      return null
    }

    const parsed = JSON.parse(jsonMatch[0]) as AnalysisResult

    // 保存分析记录
    await prisma.badcaseAnalysis.create({
      data: {
        badcaseId,
        analysisType: 'auto',
        category: parsed.category,
        rootCause: parsed.rootCause,
        suggestions: JSON.stringify(parsed.suggestions)
      }
    })

    // 更新 Badcase 状态
    await prisma.badcase.update({
      where: { id: badcaseId },
      data: {
        category: parsed.category,
        rootCause: parsed.rootCause,
        status: 'analyzing'
      }
    })

    return parsed
  } catch (error) {
    console.error('LLM analysis failed:', error)
    return null
  }
}

export async function updateBadcaseAnalysis(
  badcaseId: string,
  analysis: { category: string; rootCause: string; suggestions: string[] },
  createdBy?: string
): Promise<void> {
  await prisma.badcaseAnalysis.create({
    data: {
      badcaseId,
      analysisType: 'manual',
      category: analysis.category,
      rootCause: analysis.rootCause,
      suggestions: JSON.stringify(analysis.suggestions),
      createdBy
    }
  })

  await prisma.badcase.update({
    where: { id: badcaseId },
    data: {
      category: analysis.category,
      rootCause: analysis.rootCause,
      status: 'analyzing'
    }
  })
}