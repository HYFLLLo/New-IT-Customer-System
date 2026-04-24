import { chatCompletion } from './minimax'

export interface DeepEvaluationResult {
  accuracyScore: number
  relevanceScore: number
  completenessScore: number
  explanation: string
}

export async function evaluateAnswerWithLLM(
  question: string,
  answer: string,
  expectedKeyPoints: string[]
): Promise<DeepEvaluationResult> {
  const systemPrompt = `你是一个专业的IT技术支持质量评估专家。你的任务是对AI助手的回答进行多维度评分。

评分标准：

1. **准确度 (accuracyScore)** - 回答中的信息是否正确
   - 1.0: 完全正确，无事实错误
   - 0.7: 基本正确，有小错误
   - 0.4: 有明显错误
   - 0.0: 完全错误

2. **相关性 (relevanceScore)** - 回答是否针对问题
   - 1.0: 完全针对问题
   - 0.7: 基本相关
   - 0.4: 有一定相关性
   - 0.0: 完全不相关

3. **完整性 (completenessScore)** - 是否完整回答了问题
   - 1.0: 完整覆盖所有要点
   - 0.7: 覆盖大部分要点
   - 0.4: 只回答了部分
   - 0.0: 完全没回答

请分析以下问答对并给出评分，输出JSON格式：
{
  "accuracyScore": 0-1的数值,
  "relevanceScore": 0-1的数值,
  "completenessScore": 0-1的数值,
  "explanation": "评分理由，100字以内"
}`

  const userPrompt = `问题：${question}

期望回答要点：${expectedKeyPoints.join(', ')}

AI回答：${answer}

请评分：`

  try {
    const result = await chatCompletion([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], 0.3, 30000)

    const jsonMatch = result.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as DeepEvaluationResult
      // Validate runtime type safety
      if (
        typeof parsed.accuracyScore === 'number' &&
        typeof parsed.relevanceScore === 'number' &&
        typeof parsed.completenessScore === 'number' &&
        typeof parsed.explanation === 'string'
      ) {
        return parsed
      }
      console.warn('Invalid LLM response format, using defaults')
    }
  } catch (error) {
    console.error('LLM evaluation failed:', error)
  }

  return {
    accuracyScore: 0.5,
    relevanceScore: 0.5,
    completenessScore: 0.5,
    explanation: 'LLM评估失败，使用默认值'
  }
}