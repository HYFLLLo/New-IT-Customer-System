import { prisma } from '@/lib/prisma'
import { searchChunks } from '../chroma'
import { generateAnswerWithConfidence } from '../minimax'
import { evaluateAnswerWithLLM } from './deep-evaluator'
import { detectFromEvaluationFailed } from '../badcase/detector'

export interface RunProgress {
  total: number
  completed: number
  current: string
}

export type ProgressCallback = (progress: RunProgress) => void

export async function runEvaluation(
  datasetId: string,
  runName: string,
  runType: string,
  onProgress?: ProgressCallback
): Promise<string> {
  const run = await prisma.evaluationRun.create({
    data: {
      datasetId,
      name: runName,
      runType,
      status: 'running',
      startedAt: new Date()
    }
  })

  const items = await prisma.evaluationItem.findMany({
    where: { datasetId }
  })

  let totalScore = 0
  let totalLatency = 0
  let passCount = 0
  const failedItems: string[] = []

  for (let i = 0; i < items.length; i++) {
    const item = items[i]

    const startTime = Date.now()

    try {
      const searchResults = await searchChunks(item.question, 5)
      const ragResult = await generateAnswerWithConfidence(
        item.question,
        searchResults
      )
      const latencyMs = Date.now() - startTime

      const expectedKeyPoints = JSON.parse(item.expectedKeyPoints) as string[]
      const llmEval = await evaluateAnswerWithLLM(
        item.question,
        ragResult.answer,
        expectedKeyPoints
      )

      const overallScore = (
        0.3 * llmEval.accuracyScore +
        0.3 * llmEval.relevanceScore +
        0.2 * llmEval.completenessScore +
        0.2 * ragResult.confidence
      )

      await prisma.evaluationResult.create({
        data: {
          itemId: item.id,
          runId: run.id,
          question: item.question,
          answer: ragResult.answer,
          confidence: ragResult.confidence,
          accuracyScore: llmEval.accuracyScore,
          relevanceScore: llmEval.relevanceScore,
          completenessScore: llmEval.completenessScore,
          latencyMs,
          retrievalScore: ragResult.confidenceBreakdown.retrievalScore,
          answerQualityScore: ragResult.confidenceBreakdown.answerScore,
          coverageScore: ragResult.confidenceBreakdown.coverageScore,
          overallScore
        }
      })

      // Detect badcase if score is low
      if (overallScore < 0.4) {
        await detectFromEvaluationFailed(
          run.id,
          item.question,
          ragResult.answer,
          ragResult.confidence,
          result.id,
          overallScore
        )
      }

      totalScore += overallScore
      totalLatency += latencyMs
      if (overallScore >= 0.6) passCount++

      // Report progress AFTER successful processing
      onProgress?.({
        total: items.length,
        completed: i + 1,
        current: item.question.slice(0, 50)
      })

    } catch (error) {
      console.error(`Failed to evaluate item ${item.id}:`, error)
      failedItems.push(item.id)
      // Report failed progress
      onProgress?.({
        total: items.length,
        completed: i + 1,
        current: `FAILED: ${item.question.slice(0, 50)}`
      })
    }
  }

  // Log failed items summary
  if (failedItems.length > 0) {
    console.warn(`Failed to evaluate ${failedItems.length} items:`, failedItems)
  }

  await prisma.evaluationRun.update({
    where: { id: run.id },
    data: {
      status: 'completed',
      completedAt: new Date(),
      totalItems: items.length,
      avgScore: items.length > 0 ? totalScore / items.length : 0,
      avgLatencyMs: items.length > 0 ? Math.round(totalLatency / items.length) : 0,
      passRate: items.length > 0 ? passCount / items.length : 0
    }
  })

  return run.id
}