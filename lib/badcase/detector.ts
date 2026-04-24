import { prisma } from '@/lib/prisma'

export interface BadcaseCreateInput {
  sessionId: string
  question: string
  answer?: string
  confidence?: number
  sourceType: 'evaluation_failed' | 'user_feedback' | 'low_confidence'
  sourceId?: string
  priority?: 'low' | 'medium' | 'high' | 'critical'
}

export async function createBadcase(input: BadcaseCreateInput): Promise<string> {
  const priority = input.priority || determinePriority(input.sourceType, input.confidence)

  const badcase = await prisma.badcase.create({
    data: {
      sessionId: input.sessionId,
      question: input.question,
      answer: input.answer,
      confidence: input.confidence,
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      priority,
      status: 'pending'
    }
  })

  console.log(`Badcase created: ${badcase.id} (source: ${input.sourceType})`)
  return badcase.id
}

export function determinePriority(
  sourceType: 'evaluation_failed' | 'user_feedback' | 'low_confidence',
  confidence?: number
): 'low' | 'medium' | 'high' | 'critical' {
  if (sourceType === 'user_feedback') {
    return 'high'
  }
  if (confidence !== undefined && confidence < 0.2) {
    return 'high'
  }
  if (confidence !== undefined && confidence < 0.4) {
    return 'medium'
  }
  return 'low'
}

export async function detectFromEvaluationFailed(
  runId: string,
  question: string,
  answer: string,
  confidence: number,
  resultId: string,
  score: number
): Promise<void> {
  if (score < 0.4) {
    await createBadcase({
      sessionId: runId,
      question,
      answer,
      confidence,
      sourceType: 'evaluation_failed',
      sourceId: resultId,
      priority: score < 0.2 ? 'high' : 'medium'
    })
  }
}

export async function detectFromUserFeedback(
  ticketId: string,
  question: string,
  answer: string | null,
  confidence: number | null,
  feedbackId: string,
  rating: number
): Promise<void> {
  if (rating <= 2) {
    await createBadcase({
      sessionId: ticketId,
      question,
      answer: answer ?? undefined,
      confidence: confidence ?? undefined,
      sourceType: 'user_feedback',
      sourceId: feedbackId,
      priority: rating === 1 ? 'critical' : 'high'
    })
  }
}

export async function detectFromLowConfidence(
  sessionId: string,
  question: string,
  answer: string,
  confidence: number
): Promise<void> {
  if (confidence < 0.5) {
    await createBadcase({
      sessionId,
      question,
      answer,
      confidence,
      sourceType: 'low_confidence',
      priority: confidence < 0.3 ? 'high' : 'medium'
    })
  }
}