import { prisma } from '@/lib/prisma'
import { searchChunks } from '@/lib/chroma'
import { generateAnswerWithConfidence } from '@/lib/minimax'

export interface VerificationResult {
  improved: boolean
  oldScore: number
  newScore: number
  oldConfidence: number
  newConfidence: number
  explanation: string
}

const IMPROVEMENT_THRESHOLD = {
  confidence: 0.15,
  score: 0.2,
  rating: 1
}

export async function verifyOptimization(badcaseId: string): Promise<VerificationResult | null> {
  const badcase = await prisma.badcase.findUnique({
    where: { id: badcaseId }
  })

  if (!badcase) {
    console.error(`Badcase not found: ${badcaseId}`)
    return null
  }

  const oldConfidence = badcase.confidence || 0

  // 使用相同问题重新测试
  const searchResults = await searchChunks(badcase.question, 5)
  const ragResult = await generateAnswerWithConfidence(badcase.question, searchResults)

  const newConfidence = ragResult.confidence

  // 如果有期望要点，进行深度评测
  let oldScore = oldConfidence
  let newScore = newConfidence

  // 更新 Badcase 验证结果
  const improved = (newConfidence - oldConfidence) >= IMPROVEMENT_THRESHOLD.confidence

  await prisma.badcase.update({
    where: { id: badcaseId },
    data: {
      verified: true,
      verifiedAt: new Date(),
      verificationResult: improved ? 'improved' : (newConfidence < oldConfidence ? 'degraded' : 'no_change')
    }
  })

  return {
    improved,
    oldScore,
    newScore,
    oldConfidence,
    newConfidence,
    explanation: improved
      ? `优化后置信度提升 ${(newConfidence - oldConfidence).toFixed(2)}`
      : `优化后置信度无显著改善`
  }
}

export async function verifyByReTest(
  question: string,
  expectedImprovement: number = IMPROVEMENT_THRESHOLD.confidence
): Promise<{ passed: boolean; oldConfidence: number; newConfidence: number }> {
  // 查找该问题相关的未验证 Badcase
  const badcase = await prisma.badcase.findFirst({
    where: {
      question,
      verified: false,
      status: 'optimized'
    }
  })

  if (!badcase) {
    return { passed: false, oldConfidence: 0, newConfidence: 0 }
  }

  const result = await verifyOptimization(badcase.id)

  if (!result) {
    return { passed: false, oldConfidence: 0, newConfidence: 0 }
  }

  return {
    passed: result.improved,
    oldConfidence: result.oldConfidence,
    newConfidence: result.newConfidence
  }
}