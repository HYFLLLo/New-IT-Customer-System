# 效果监控与评测系统实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 建立企业级大模型效果监控与评测体系，支持实时规则检查 + 离线深度评测 + Prompt调优实验

**Architecture:** 采用混合架构（实时层 + 离线层）：
- **实时层**：轻量级规则检查（置信度、回答长度、关键词过滤）→ 快速判断
- **离线层**：深度评测（抽样 + LLM辅助评分）→ 全面分析
- 两者结果汇总到评测仪表盘

**Tech Stack:** Next.js API Routes + Prisma + PostgreSQL + MiniMax LLM

---

## 1. 数据模型设计

### 1.1 扩展 Prisma Schema

**Modify:** `prisma/schema.prisma`

```prisma
// 评测数据集
model EvaluationDataset {
  id          String   @id @default(uuid())
  name        String
  description String?
  version     String   @default("v1.0")
  createdAt   DateTime @default(now())

  items EvaluationItem[]
  runs  EvaluationRun[]
}

// 评测数据项
model EvaluationItem {
  id                String  @id @default(uuid())
  datasetId         String
  dataset           EvaluationDataset @relation(fields: [datasetId], references: [id])

  question          String
  category          String
  subcategory       String
  difficulty        String  // simple/medium/difficult
  questionType      String  // factual/procedural/troubleshooting/open-ended
  expectedKeyPoints String  // JSON array
  sourceDoc         String
  sourceSection     String

  createdAt DateTime @default(now())

  results EvaluationResult[]
}

// 评测结果
model EvaluationResult {
  id          String   @id @default(uuid())
  itemId      String
  item        EvaluationItem @relation(fields: [itemId], references: [id])
  runId       String
  run         EvaluationRun  @relation(fields: [runId], references: [id])

  question    String
  answer      String
  confidence  Float

  // 各项评分
  accuracyScore    Float   // 准确度得分 (0-1)
  relevanceScore   Float   // 相关性得分 (0-1)
  completenessScore Float   // 完整性得分 (0-1)
  latencyMs        Int     // 响应延迟(ms)

  // 详细指标
  retrievalScore   Float   // 检索质量分
  answerQualityScore Float // 回答质量分
  coverageScore     Float  // 关键词覆盖分

  // 最终评分
  overallScore     Float   // 综合评分 (0-1)

  createdAt DateTime @default(now())
}

// 评测批次
model EvaluationRun {
  id          String   @id @default(uuid())
  datasetId   String
  dataset     EvaluationDataset @relation(fields: [datasetId], references: [id])

  name        String   // 批次名称
  description String?
  runType     String   // "auto" (定时) / "manual" (手动) / "prompt_test" (Prompt测试)

  // 统计摘要
  totalItems      Int     @default(0)
  avgScore        Float   @default(0)
  avgLatencyMs    Int     @default(0)
  passRate        Float   @default(0)  // 60%为及格线

  status      String   @default("pending") // pending/running/completed/failed
  startedAt   DateTime?
  completedAt DateTime?
  createdAt   DateTime @default(now())

  results EvaluationResult[]
}

// 实时规则检查日志 (用于效果监控)
model RealtimeCheckLog {
  id          String   @id @default(uuid())
  sessionId   String
  question    String
  answer      String
  confidence  Float

  // 检查结果
  passed      Boolean
  failReasons String?  // JSON array of failure reasons

  latencyMs   Int
  createdAt   DateTime @default(now())
}
```

---

## 2. 实时规则检查层

### 2.1 规则检查器

**Create:** `lib/evaluation/rules.ts`

```typescript
export interface RuleCheckResult {
  passed: boolean
  failReasons: string[]
  scores: {
    lengthScore: number      // 回答长度是否合理
    confidenceScore: number  // 置信度是否达标
    keywordScore: number     // 关键词是否包含
    formatScore: number      // 格式是否符合要求
  }
}

const MIN_CONFIDENCE = 0.5
const MIN_ANSWER_LENGTH = 30
const MAX_ANSWER_LENGTH = 3000
const MIN_KEYWORD_HIT_RATE = 0.3

// IT支持关键术语
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

  // 1. 检查置信度
  if (confidence < MIN_CONFIDENCE) {
    failReasons.push(`置信度过低: ${confidence} < ${MIN_CONFIDENCE}`)
    scores.confidenceScore = confidence / MIN_CONFIDENCE
  }

  // 2. 检查回答长度
  if (answer.length < MIN_ANSWER_LENGTH) {
    failReasons.push(`回答过短: ${answer.length} < ${MIN_ANSWER_LENGTH}字符`)
    scores.lengthScore = answer.length / MIN_ANSWER_LENGTH
  }
  if (answer.length > MAX_ANSWER_LENGTH) {
    failReasons.push(`回答过长: ${answer.length} > ${MAX_ANSWER_LENGTH}字符`)
    scores.lengthScore = MAX_ANSWER_LENGTH / answer.length
  }

  // 3. 检查关键词覆盖
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

  // 4. 检查是否包含必要提示
  const hasHelpfulContent = CRITICAL_KEYWORDS.some(kw =>
    answer.includes(kw)
  )
  if (!hasHelpfulContent && confidence < 0.7) {
    failReasons.push('低置信度回答缺少IT支持必要提示')
    scores.formatScore = 0.5
  }

  return {
    passed: failReasons.length === 0,
    failReasons,
    scores
  }
}

function extractKeywords(text: string): string[] {
  const chinese = text.match(/[一-龥]{2,}/g) || []
  const english = text.match(/[a-zA-Z]{3,}/g) || []
  return [...chinese, ...english.map(w => w.toLowerCase())]
}
```

### 2.2 指标采集器

**Create:** `lib/evaluation/metrics-collector.ts`

```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface MetricsSummary {
  totalRequests: number
  avgConfidence: number
  avgLatencyMs: number
  passRate: number
  failReasonsDistribution: Record<string, number>
}

export async function collectRealtimeMetrics(
  timeRange: { start: Date; end: Date }
): Promise<MetricsSummary> {
  const logs = await prisma.realtimeCheckLog.findMany({
    where: {
      createdAt: {
        gte: timeRange.start,
        lte: timeRange.end
      }
    }
  })

  if (logs.length === 0) {
    return {
      totalRequests: 0,
      avgConfidence: 0,
      avgLatencyMs: 0,
      passRate: 0,
      failReasonsDistribution: {}
    }
  }

  const totalRequests = logs.length
  const avgConfidence = logs.reduce((sum, l) => sum + l.confidence, 0) / totalRequests
  const avgLatencyMs = logs.reduce((sum, l) => sum + l.latencyMs, 0) / totalRequests
  const passCount = logs.filter(l => l.passed).length
  const passRate = passCount / totalRequests

  // 统计失败原因分布
  const failReasonsDistribution: Record<string, number> = {}
  logs.forEach(log => {
    if (!log.passed && log.failReasons) {
      const reasons = JSON.parse(log.failReasons) as string[]
      reasons.forEach(reason => {
        failReasonsDistribution[reason] = (failReasonsDistribution[reason] || 0) + 1
      })
    }
  })

  return {
    totalRequests,
    avgConfidence,
    avgLatencyMs,
    passRate,
    failReasonsDistribution
  }
}

export async function logRealtimeCheck(
  sessionId: string,
  question: string,
  answer: string,
  confidence: number,
  latencyMs: number,
  result: { passed: boolean; failReasons: string[] }
): Promise<void> {
  await prisma.realtimeCheckLog.create({
    data: {
      sessionId,
      question,
      answer,
      confidence,
      latencyMs,
      passed: result.passed,
      failReasons: JSON.stringify(result.failReasons)
    }
  })
}
```

---

## 3. 离线深度评测层

### 3.1 深度评分器

**Create:** `lib/evaluation/deep-evaluator.ts`

```typescript
import { chatCompletion } from './minimax'

export interface DeepEvaluationResult {
  accuracyScore: number      // 准确度 (0-1)
  relevanceScore: number      // 相关性 (0-1)
  completenessScore: number  // 完整性 (0-1)
  explanation: string        // 评分理由
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
    ], 0.3, 30000) // 低温度保证稳定性

    // 解析JSON结果
    const jsonMatch = result.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
  } catch (error) {
    console.error('LLM evaluation failed:', error)
  }

  // Fallback: 返回默认值
  return {
    accuracyScore: 0.5,
    relevanceScore: 0.5,
    completenessScore: 0.5,
    explanation: 'LLM评估失败，使用默认值'
  }
}
```

### 3.2 评测运行器

**Create:** `lib/evaluation/runner.ts`

```typescript
import { PrismaClient } from '@prisma/client'
import { embedText, searchChunks } from './chroma'
import { generateAnswerWithConfidence } from './minimax'
import { evaluateAnswerWithLLM } from './deep-evaluator'

const prisma = new PrismaClient()

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
  // 创建评测批次
  const run = await prisma.evaluationRun.create({
    data: {
      datasetId,
      name: runName,
      runType,
      status: 'running',
      startedAt: new Date()
    }
  })

  // 获取评测数据
  const items = await prisma.evaluationItem.findMany({
    where: { datasetId }
  })

  let totalScore = 0
  let totalLatency = 0
  let passCount = 0

  for (let i = 0; i < items.length; i++) {
    const item = items[i]

    onProgress?.({
      total: items.length,
      completed: i,
      current: item.question.slice(0, 50)
    })

    const startTime = Date.now()

    try {
      // 1. RAG检索
      const searchResults = await searchChunks(item.question, 5)

      // 2. 生成回答
      const ragResult = await generateAnswerWithConfidence(
        item.question,
        searchResults
      )

      const latencyMs = Date.now() - startTime

      // 3. LLM深度评估
      const expectedKeyPoints = JSON.parse(item.expectedKeyPoints) as string[]
      const llmEval = await evaluateAnswerWithLLM(
        item.question,
        ragResult.answer,
        expectedKeyPoints
      )

      // 4. 计算综合评分
      const overallScore = (
        0.3 * llmEval.accuracyScore +
        0.3 * llmEval.relevanceScore +
        0.2 * llmEval.completenessScore +
        0.2 * ragResult.confidence
      )

      // 5. 保存结果
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

      totalScore += overallScore
      totalLatency += latencyMs
      if (overallScore >= 0.6) passCount++

    } catch (error) {
      console.error(`Failed to evaluate item ${item.id}:`, error)
    }
  }

  // 更新批次统计
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
```

---

## 4. 数据导入

### 4.1 评测数据导入脚本

**Create:** `scripts/import-evaluation-dataset.ts`

```typescript
import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

interface EvaluationDataItem {
  id: string
  category: string
  subcategory: string
  difficulty: string
  question_type: string
  question: string
  expected_key_points: string[]
  source_doc: string
  source_section: string
}

async function importDataset() {
  const datasetFile = path.join(process.cwd(), 'docs/evaluation-dataset.md')

  // 从Markdown中解析JSON数据
  // 这里简化处理，实际应该用更健壮的解析
  const content = fs.readFileSync(datasetFile, 'utf-8')

  // 提取JSON代码块
  const jsonMatches = content.match(/```json\n([\s\S]*?)\n```/g)

  if (!jsonMatches) {
    console.error('No JSON data found in evaluation dataset')
    return
  }

  // 创建数据集记录
  const dataset = await prisma.evaluationDataset.create({
    data: {
      name: 'IT Helpdesk评测数据集 v1.0',
      description: '基于知识库模拟生成的种子评测数据',
      version: 'v1.0'
    }
  })

  let importCount = 0

  for (const match of jsonMatches) {
    const jsonStr = match.replace(/```json\n?/, '').replace(/\n?```/, '')
    const items: EvaluationDataItem[] = JSON.parse(jsonStr)

    for (const item of items) {
      await prisma.evaluationItem.create({
        data: {
          datasetId: dataset.id,
          question: item.question,
          category: item.category,
          subcategory: item.subcategory,
          difficulty: item.difficulty,
          questionType: item.question_type,
          expectedKeyPoints: JSON.stringify(item.expected_key_points),
          sourceDoc: item.source_doc,
          sourceSection: item.source_section
        }
      })
      importCount++
    }
  }

  console.log(`Imported ${importCount} evaluation items into dataset ${dataset.id}`)
}

importDataset()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```

---

## 5. API接口

### 5.1 评测运行API

**Create:** `app/api/evaluation/run/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { runEvaluation } from '@/lib/evaluation/runner'

export async function POST(request: NextRequest) {
  try {
    const { datasetId, name, runType = 'manual' } = await request.json()

    if (!datasetId || !name) {
      return NextResponse.json(
        { error: 'datasetId and name are required' },
        { status: 400 }
      )
    }

    // 启动评测运行（异步）
    const runId = await runEvaluation(datasetId, name, runType)

    return NextResponse.json({ runId, status: 'started' })
  } catch (error) {
    console.error('Failed to start evaluation:', error)
    return NextResponse.json(
      { error: 'Failed to start evaluation' },
      { status: 500 }
    )
  }
}
```

### 5.2 评测结果查询API

**Create:** `app/api/evaluation/results/[runId]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: { runId: string } }
) {
  try {
    const run = await prisma.evaluationRun.findUnique({
      where: { id: params.runId },
      include: {
        results: {
          orderBy: { overallScore: 'desc' }
        }
      }
    })

    if (!run) {
      return NextResponse.json(
        { error: 'Run not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(run)
  } catch (error) {
    console.error('Failed to get evaluation results:', error)
    return NextResponse.json(
      { error: 'Failed to get results' },
      { status: 500 }
    )
  }
}
```

### 5.3 实时指标API

**Create:** `app/api/evaluation/metrics/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { collectRealtimeMetrics } from '@/lib/evaluation/metrics-collector'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const hours = parseInt(searchParams.get('hours') || '24')

    const end = new Date()
    const start = new Date(end.getTime() - hours * 60 * 60 * 1000)

    const metrics = await collectRealtimeMetrics({ start, end })

    return NextResponse.json(metrics)
  } catch (error) {
    console.error('Failed to collect metrics:', error)
    return NextResponse.json(
      { error: 'Failed to collect metrics' },
      { status: 500 }
    )
  }
}
```

---

## 6. 任务清单

### Task 1: 数据库Schema扩展

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: 添加评测相关模型**

在schema.prisma文件末尾添加：

```prisma
model EvaluationDataset {
  id          String   @id @default(uuid())
  name        String
  description String?
  version     String   @default("v1.0")
  createdAt   DateTime @default(now())

  items EvaluationItem[]
  runs  EvaluationRun[]
}

model EvaluationItem {
  id                String  @id @default(uuid())
  datasetId         String
  dataset           EvaluationDataset @relation(fields: [datasetId], references: [id])
  question          String
  category          String
  subcategory       String
  difficulty        String
  questionType      String
  expectedKeyPoints String
  sourceDoc         String
  sourceSection     String
  createdAt DateTime @default(now())

  results EvaluationResult[]
}

model EvaluationResult {
  id          String   @id @default(uuid())
  itemId      String
  item        EvaluationItem @relation(fields: [itemId], references: [id])
  runId       String
  run         EvaluationRun  @relation(fields: [runId], references: [id])
  question    String
  answer      String
  confidence  Float
  accuracyScore    Float
  relevanceScore   Float
  completenessScore Float
  latencyMs        Int
  retrievalScore   Float
  answerQualityScore Float
  coverageScore     Float
  overallScore     Float
  createdAt DateTime @default(now())
}

model EvaluationRun {
  id          String   @id @default(uuid())
  datasetId   String
  dataset     EvaluationDataset @relation(fields: [datasetId], references: [id])
  name        String
  description String?
  runType     String
  totalItems      Int     @default(0)
  avgScore        Float   @default(0)
  avgLatencyMs    Int     @default(0)
  passRate        Float   @default(0)
  status      String   @default("pending")
  startedAt   DateTime?
  completedAt DateTime?
  createdAt   DateTime @default(now())

  results EvaluationResult[]
}

model RealtimeCheckLog {
  id          String   @id @default(uuid())
  sessionId   String
  question    String
  answer      String
  confidence  Float
  passed      Boolean
  failReasons String?
  latencyMs   Int
  createdAt   DateTime @default(now())
}
```

- [ ] **Step 2: 运行数据库迁移**

Run: `npx prisma migrate dev --name add_evaluation_models`
Expected: Migration created successfully

- [ ] **Step 3: 验证模型生成**

Run: `npx prisma generate`
Expected: Client generated successfully

---

### Task 2: 实时规则检查器

**Files:**
- Create: `lib/evaluation/rules.ts`

- [ ] **Step 1: 创建规则检查器代码**

```typescript
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
```

- [ ] **Step 2: 单元测试**

Create: `lib/evaluation/rules.test.ts`

```typescript
import { checkRealtimeRules } from './rules'

describe('checkRealtimeRules', () => {
  test('通过正常回答', () => {
    const result = checkRealtimeRules(
      '打印机没反应怎么办？',
      '请检查打印机是否开机，确认电源线连接正常。如果还是没反应，可以重启打印机后重试。',
      0.75
    )
    expect(result.passed).toBe(true)
  })

  test('置信度过低应失败', () => {
    const result = checkRealtimeRules(
      '打印机没反应怎么办？',
      '请检查一下',
      0.3
    )
    expect(result.passed).toBe(false)
    expect(result.failReasons).toContainEqual(
      expect.stringContaining('置信度过低')
    )
  })

  test('回答过短应失败', () => {
    const result = checkRealtimeRules(
      '打印机没反应怎么办？',
      '重启',
      0.6
    )
    expect(result.passed).toBe(false)
    expect(result.failReasons).toContainEqual(
      expect.stringContaining('回答过短')
    )
  })
})
```

Run: `npm test lib/evaluation/rules.test.ts`
Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git add prisma/schema.prisma lib/evaluation/rules.ts lib/evaluation/rules.test.ts
git commit -m "feat: add evaluation rules checker"
```

---

### Task 3: 指标采集器

**Files:**
- Create: `lib/evaluation/metrics-collector.ts`

- [ ] **Step 1: 创建指标采集器**

```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface MetricsSummary {
  totalRequests: number
  avgConfidence: number
  avgLatencyMs: number
  passRate: number
  failReasonsDistribution: Record<string, number>
}

export async function collectRealtimeMetrics(
  timeRange: { start: Date; end: Date }
): Promise<MetricsSummary> {
  const logs = await prisma.realtimeCheckLog.findMany({
    where: {
      createdAt: {
        gte: timeRange.start,
        lte: timeRange.end
      }
    }
  })

  if (logs.length === 0) {
    return {
      totalRequests: 0,
      avgConfidence: 0,
      avgLatencyMs: 0,
      passRate: 0,
      failReasonsDistribution: {}
    }
  }

  const totalRequests = logs.length
  const avgConfidence = logs.reduce((sum, l) => sum + l.confidence, 0) / totalRequests
  const avgLatencyMs = Math.round(logs.reduce((sum, l) => sum + l.latencyMs, 0) / totalRequests)
  const passCount = logs.filter(l => l.passed).length
  const passRate = passCount / totalRequests

  const failReasonsDistribution: Record<string, number> = {}
  logs.forEach(log => {
    if (!log.passed && log.failReasons) {
      const reasons = JSON.parse(log.failReasons) as string[]
      reasons.forEach(reason => {
        failReasonsDistribution[reason] = (failReasonsDistribution[reason] || 0) + 1
      })
    }
  })

  return {
    totalRequests,
    avgConfidence: Math.round(avgConfidence * 100) / 100,
    avgLatencyMs,
    passRate: Math.round(passRate * 100) / 100,
    failReasonsDistribution
  }
}

export async function logRealtimeCheck(
  sessionId: string,
  question: string,
  answer: string,
  confidence: number,
  latencyMs: number,
  result: { passed: boolean; failReasons: string[] }
): Promise<void> {
  await prisma.realtimeCheckLog.create({
    data: {
      sessionId,
      question,
      answer,
      confidence,
      latencyMs,
      passed: result.passed,
      failReasons: JSON.stringify(result.failReasons)
    }
  })
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/evaluation/metrics-collector.ts
git commit -m "feat: add metrics collector"
```

---

### Task 4: 深度评测器

**Files:**
- Create: `lib/evaluation/deep-evaluator.ts`

- [ ] **Step 1: 创建深度评测器**

```typescript
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
      return JSON.parse(jsonMatch[0])
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
```

- [ ] **Step 2: Commit**

```bash
git add lib/evaluation/deep-evaluator.ts
git commit -m "feat: add LLM-based deep evaluator"
```

---

### Task 5: 评测运行器

**Files:**
- Create: `lib/evaluation/runner.ts`

- [ ] **Step 1: 创建评测运行器**

```typescript
import { PrismaClient } from '@prisma/client'
import { searchChunks } from './chroma'
import { generateAnswerWithConfidence } from './minimax'
import { evaluateAnswerWithLLM } from './deep-evaluator'

const prisma = new PrismaClient()

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

  for (let i = 0; i < items.length; i++) {
    const item = items[i]

    onProgress?.({
      total: items.length,
      completed: i,
      current: item.question.slice(0, 50)
    })

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

      totalScore += overallScore
      totalLatency += latencyMs
      if (overallScore >= 0.6) passCount++

    } catch (error) {
      console.error(`Failed to evaluate item ${item.id}:`, error)
    }
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
```

- [ ] **Step 2: Commit**

```bash
git add lib/evaluation/runner.ts
git commit -m "feat: add evaluation runner"
```

---

### Task 6: API接口

**Files:**
- Create: `app/api/evaluation/run/route.ts`
- Create: `app/api/evaluation/results/[runId]/route.ts`
- Create: `app/api/evaluation/metrics/route.ts`

- [ ] **Step 1: 创建API路由**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { runEvaluation } from '@/lib/evaluation/runner'

export async function POST(request: NextRequest) {
  try {
    const { datasetId, name, runType = 'manual' } = await request.json()

    if (!datasetId || !name) {
      return NextResponse.json(
        { error: 'datasetId and name are required' },
        { status: 400 }
      )
    }

    const runId = await runEvaluation(datasetId, name, runType)
    return NextResponse.json({ runId, status: 'started' })
  } catch (error) {
    console.error('Failed to start evaluation:', error)
    return NextResponse.json(
      { error: 'Failed to start evaluation' },
      { status: 500 }
    )
  }
}
```

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: { runId: string } }
) {
  try {
    const run = await prisma.evaluationRun.findUnique({
      where: { id: params.runId },
      include: {
        results: {
          orderBy: { overallScore: 'desc' }
        }
      }
    })

    if (!run) {
      return NextResponse.json(
        { error: 'Run not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(run)
  } catch (error) {
    console.error('Failed to get evaluation results:', error)
    return NextResponse.json(
      { error: 'Failed to get results' },
      { status: 500 }
    )
  }
}
```

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { collectRealtimeMetrics } from '@/lib/evaluation/metrics-collector'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const hours = parseInt(searchParams.get('hours') || '24')

    const end = new Date()
    const start = new Date(end.getTime() - hours * 60 * 60 * 1000)

    const metrics = await collectRealtimeMetrics({ start, end })
    return NextResponse.json(metrics)
  } catch (error) {
    console.error('Failed to collect metrics:', error)
    return NextResponse.json(
      { error: 'Failed to collect metrics' },
      { status: 500 }
    )
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/evaluation/run/route.ts app/api/evaluation/results/[runId]/route.ts app/api/evaluation/metrics/route.ts
git commit -m "feat: add evaluation API routes"
```

---

### Task 7: 数据导入脚本

**Files:**
- Create: `scripts/import-evaluation-dataset.ts`

- [ ] **Step 1: 创建导入脚本**

```typescript
import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

interface EvaluationDataItem {
  id: string
  category: string
  subcategory: string
  difficulty: string
  question_type: string
  question: string
  expected_key_points: string[]
  source_doc: string
  source_section: string
}

async function importDataset() {
  const datasetFile = path.join(process.cwd(), 'docs/evaluation-dataset.md')
  const content = fs.readFileSync(datasetFile, 'utf-8')

  const jsonMatches = content.match(/```json\n([\s\S]*?)\n```/g)

  if (!jsonMatches) {
    console.error('No JSON data found in evaluation dataset')
    return
  }

  const dataset = await prisma.evaluationDataset.create({
    data: {
      name: 'IT Helpdesk评测数据集 v1.0',
      description: '基于知识库模拟生成的种子评测数据',
      version: 'v1.0'
    }
  })

  let importCount = 0

  for (const match of jsonMatches) {
    const jsonStr = match.replace(/```json\n?/, '').replace(/\n?```/, '')
    const items: EvaluationDataItem[] = JSON.parse(jsonStr)

    for (const item of items) {
      await prisma.evaluationItem.create({
        data: {
          datasetId: dataset.id,
          question: item.question,
          category: item.category,
          subcategory: item.subcategory,
          difficulty: item.difficulty,
          questionType: item.question_type,
          expectedKeyPoints: JSON.stringify(item.expected_key_points),
          sourceDoc: item.source_doc,
          sourceSection: item.source_section
        }
      })
      importCount++
    }
  }

  console.log(`Imported ${importCount} evaluation items into dataset ${dataset.id}`)
}

importDataset()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```

- [ ] **Step 2: 测试导入脚本**

Run: `npx ts-node scripts/import-evaluation-dataset.ts`
Expected: "Imported 150 evaluation items into dataset xxx"

- [ ] **Step 3: Commit**

```bash
git add scripts/import-evaluation-dataset.ts
git commit -m "feat: add evaluation dataset import script"
```

---

## 7. 自检清单

### 7.1 Spec覆盖检查

| 需求 | 实现位置 |
|-----|---------|
| 实时规则检查 | Task 2: lib/evaluation/rules.ts |
| 指标采集存储 | Task 3: lib/evaluation/metrics-collector.ts |
| 离线深度评测 | Task 4: lib/evaluation/deep-evaluator.ts |
| 评测运行器 | Task 5: lib/evaluation/runner.ts |
| API接口 | Task 6: app/api/evaluation/* |
| 数据模型 | Task 1: prisma/schema.prisma |
| 评测数据 | Task 7: docs/evaluation-dataset.md + scripts/import-evaluation-dataset.ts |

### 7.2 字段一致性检查

- `EvaluationItem.expectedKeyPoints` - JSON字符串，解析为`string[]`
- `EvaluationResult.retrievalScore` - 来自`ragResult.confidenceBreakdown.retrievalScore`
- `DeepEvaluationResult.accuracyScore` - LLM评分结果

### 7.3 无占位符检查

所有步骤均包含完整代码，无"TODO"、"TBD"等占位符。

---

**Plan file saved to:** `docs/superpowers/plans/2026-04-24-evaluation-system.md`

---

## 执行选择

**Plan complete and saved to `docs/superpowers/plans/2026-04-24-evaluation-system.md`. Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**