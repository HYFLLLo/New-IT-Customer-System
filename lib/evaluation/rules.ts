export interface RuleCheckResult {
  passed: boolean
  failReasons: string[]
  scores: {
    lengthScore: number
    confidenceScore: number
    keywordScore: number
    formatScore: number
  }
}

const MIN_CONFIDENCE = 0.5
const MIN_ANSWER_LENGTH = 30
const MAX_ANSWER_LENGTH = 3000
const MIN_KEYWORD_HIT_RATE = 0.3

const CRITICAL_KEYWORDS = [
  '重启', '联系IT', '800', 'it-support', '检查', '解决',
  '安装', '驱动', '重置', '更新', '设置'
]

export function checkRealtimeRules(
  question: string,
  answer: string,
  confidence: number
): RuleCheckResult {
  const failReasons: string[] = []
  const scores = {
    lengthScore: 1.0,
    confidenceScore: 1.0,
    keywordScore: 1.0,
    formatScore: 1.0
  }

  if (confidence < MIN_CONFIDENCE) {
    failReasons.push(`置信度过低: ${confidence} < ${MIN_CONFIDENCE}`)
    scores.confidenceScore = confidence / MIN_CONFIDENCE
  }

  if (answer.length < MIN_ANSWER_LENGTH) {
    failReasons.push(`回答过短: ${answer.length} < ${MIN_ANSWER_LENGTH}字符`)
    scores.lengthScore = answer.length / MIN_ANSWER_LENGTH
  }
  if (answer.length > MAX_ANSWER_LENGTH) {
    failReasons.push(`回答过长: ${answer.length} > ${MAX_ANSWER_LENGTH}字符`)
    scores.lengthScore = MAX_ANSWER_LENGTH / answer.length
  }

  const answerLower = answer.toLowerCase()
  const questionKeywords = extractKeywords(question)
  const hitKeywords = questionKeywords.filter(kw =>
    answerLower.includes(kw.toLowerCase())
  )
  const hitRate = questionKeywords.length > 0
    ? hitKeywords.length / questionKeywords.length
    : 1.0

  if (hitRate < MIN_KEYWORD_HIT_RATE) {
    failReasons.push(`关键词覆盖不足: ${hitRate} < ${MIN_KEYWORD_HIT_RATE}`)
    scores.keywordScore = hitRate / MIN_KEYWORD_HIT_RATE
  }

  const hasHelpfulContent = CRITICAL_KEYWORDS.some(kw => answer.includes(kw))
  if (!hasHelpfulContent && confidence < 0.7) {
    failReasons.push('低置信度回答缺少IT支持必要提示')
    scores.formatScore = 0.5
  }

  return { passed: failReasons.length === 0, failReasons, scores }
}

function extractKeywords(text: string): string[] {
  const chinese = text.match(/[一-龥]{2,}/g) || []
  const english = text.match(/[a-zA-Z]{3,}/g) || []
  return [...chinese, ...english.map(w => w.toLowerCase())]
}