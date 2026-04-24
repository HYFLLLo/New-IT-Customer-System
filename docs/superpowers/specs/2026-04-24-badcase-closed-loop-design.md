# Badcase 分析与闭环优化系统设计

> **文档版本：** v1.0
> **编制日期：** 2026-04-24
> **模块编号：** M3

---

## 1. 背景与目标

### 1.1 业务背景

当前系统已完成**效果监控与评测体系（M2）**，能够：
- 实时规则检查 AI 回答质量
- 离线深度评测 RAG 回答效果
- 量化评分（准确度、相关性、完整性）

但这些能力都是**被动检测**，缺少**主动优化**机制。需要构建 Badcase 闭环系统，将评测发现的问题转化为可执行的优化行动。

### 1.2 核心目标

| 目标 | 描述 |
|-----|------|
| **问题发现** | 自动识别低质量回答（评测失败/用户差评/低置信度） |
| **根因分析** | 区分问题类型（检索不足/回答错误/知识缺失） |
| **优化执行** | 触发知识库补充或 Prompt 调整 |
| **效果验证** | 验证优化后回答质量提升 |

### 1.3 闭环流程

```
┌─────────────────────────────────────────────────────────────────┐
│                        完整闭环流程                               │
│                                                                 │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐  │
│  │ 问题发现  │ → │ 分类归因  │ → │ 优化执行  │ → │ 效果验证  │  │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘  │
│        │                                                  │     │
│        └──────────────────────────────────────────────────┘     │
│                          持续迭代                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. 系统架构

### 2.1 整体架构

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Badcase 闭环系统                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    问题发现层 (Detection)                    │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │   │
│  │  │ 评测失败    │  │ 用户差评     │  │ 低置信度自动标记    │  │   │
│  │  │ (离线评测)  │  │ (Feedback)   │  │ (实时检查)          │  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                     │
│                              ▼                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    分类归因层 (Analysis)                     │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │   │
│  │  │ 检索不足    │  │ 回答错误     │  │ 知识缺失            │  │   │
│  │  │ (Retrieval) │  │ (Answer)    │  │ (Knowledge)        │  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                     │
│                              ▼                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    优化执行层 (Optimization)                 │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │   │
│  │  │ 知识库补充  │  │ Prompt优化  │  │ 相似问题聚类        │  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                     │
│                              ▼                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    效果验证层 (Verification)                 │   │
│  │  - 优化后重新评测                                             │   │
│  │  - 监控质量指标变化                                           │   │
│  │  - 未改善告警                                                 │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 数据模型

**Extend Prisma Schema:**

```prisma
// Badcase 记录
model Badcase {
  id            String    @id @default(uuid())
  sessionId     String    // 关联的会话/Ticket
  question      String    // 原始问题
  answer        String?   // AI 回答（如果有）
  confidence    Float?    // 置信度

  // 发现来源
  sourceType    String    // "evaluation_failed" | "user_feedback" | "low_confidence"
  sourceId      String?   // 关联的 EvaluationResult.id 或 Feedback.id

  // 分类归因
  category      String?  // "retrieval" | "answer" | "knowledge"
  rootCause     String?   // 根因描述

  // 处理状态
  status        String    @default("pending")  // pending/analyzing/optimized/verified/closed
  priority      String    @default("medium")   // low/medium/high/critical

  // 优化记录
  optimization  String?  // 优化措施描述
  optimizedAt   DateTime?

  // 验证结果
  verified      Boolean  @default(false)
  verifiedAt    DateTime?
  verificationResult String? // "improved" | "no_change" | "degraded"

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // 关联到知识库（如果是知识缺失类型）
  relatedChunks  Chunk[]
}

// Badcase 分析记录（每次分析的历史）
model BadcaseAnalysis {
  id          String   @id @default(uuid())
  badcaseId   String
  badcase     Badcase  @relation(fields: [badcaseId], references: [id])

  analysisType String  // "auto" | "manual"
  category     String  // 分析后的分类
  rootCause    String  // 根因
  suggestions  String  // 优化建议 (JSON array)

  createdBy   String?  // 如果是人工分析，记录分析人
  createdAt   DateTime @default(now())
}

// 优化任务
model OptimizationTask {
  id          String   @id @default(uuid())
  badcaseId   String

  taskType    String   // "add_knowledge" | "update_prompt" | "merge_cases"
  description String   // 任务描述
  status      String   @default("pending")  // pending/in_progress/completed/failed

  createdAt   DateTime @default(now())
  completedAt DateTime?
}
```

---

## 3. 功能模块设计

### 3.1 问题发现 (Detection)

#### 3.1.1 评测失败自动标记

**触发条件：**
- 离线评测 `overallScore < 0.4` 的结果

**处理流程：**
```typescript
async function onEvaluationComplete(result: EvaluationResult) {
  if (result.overallScore < 0.4) {
    await createBadcase({
      sessionId: result.runId,
      question: result.question,
      answer: result.answer,
      confidence: result.confidence,
      sourceType: 'evaluation_failed',
      sourceId: result.id,
      priority: result.overallScore < 0.2 ? 'high' : 'medium'
    })
  }
}
```

#### 3.1.2 用户差评自动标记

**触发条件：**
- `Feedback.rating <= 2`

**处理流程：**
```typescript
async function onLowRating(fb: Feedback) {
  const ticket = await prisma.ticket.findUnique({
    where: { id: fb.ticketId },
    include: { messages: { orderBy: { createdAt: 'desc' }, take: 1 } }
  })

  await createBadcase({
    sessionId: ticket.id,
    question: ticket.description,
    answer: ticket.messages[0]?.content,
    confidence: ticket.confidence,
    sourceType: 'user_feedback',
    sourceId: fb.id,
    priority: fb.rating === 1 ? 'critical' : 'high'
  })
}
```

#### 3.1.3 低置信度自动标记

**触发条件：**
- 实时检查 `confidence < 0.5`

**处理流程：**
```typescript
// 在 lib/evaluation/rules.ts 中
export function checkRealtimeRules(...) {
  // 现有规则检查...

  // 如果置信度过低，自动标记 Badcase
  if (!result.passed && result.scores.confidenceScore < 0.5) {
    await createBadcaseFromCheck(question, answer, confidence, result)
  }
}
```

---

### 3.2 分类归因 (Analysis)

#### 3.2.1 自动分类（LLM 分析）

**分类类型：**

| 类别 | 描述 | 判断标准 |
|-----|------|---------|
| `retrieval` | 检索不足 | Top-K 结果相关性低，关键词覆盖不足 |
| `answer` | 回答错误 | 准确度评分低，但检索结果正确 |
| `knowledge` | 知识缺失 | 检索结果为空或与问题无关 |

**LLM 分类 Prompt：**

```
你是一个IT技术支持问题分析专家。请分析以下 Badcase 并进行分类：

问题：{question}
AI回答：{answer}
置信度：{confidence}
评测详情：{evaluationDetails}

分类选项：
- retrieval: 知识库检索不足，导致无法提供准确回答
- answer: 知识库有相关内容，但AI回答错误或不当
- knowledge: 知识库完全缺少相关知识

请输出JSON格式：
{
  "category": "retrieval|answer|knowledge",
  "rootCause": "根因描述，50字以内",
  "confidence": 分类置信度 0-1
}
```

#### 3.2.2 人工复核

- **关键 case（priority=critical/high）** 必须人工复核
- 人工可修改分类、补充根因、添加优化建议

---

### 3.3 优化执行 (Optimization)

#### 3.3.1 知识库补充

**适用类型：** `knowledge`

**流程：**
1. 创建 OptimizationTask，类型 `add_knowledge`
2. 提示运维人员补充相关文档
3. 文档上传解析后，验证相关问题回答质量

**自动触发：**
```typescript
async function optimizeKnowledge(badcase: Badcase) {
  const task = await prisma.optimizationTask.create({
    data: {
      badcaseId: badcase.id,
      taskType: 'add_knowledge',
      description: `请在知识库中添加关于"${badcase.question}"的相关内容`
    }
  })

  // 通知机制（预留 Webhook/Email）
  await notifyAdmins(task)
}
```

#### 3.3.2 Prompt 优化

**适用类型：** `answer`

**流程：**
1. 分析回答错误模式
2. 调整 system prompt 中相关指导
3. 重新评测验证效果

#### 3.3.3 相似问题聚类

**功能：**
- 将相似问题归类，避免重复优化
- 一旦某个 cluster 优化，所有成员受益

```typescript
async function clusterSimilarBadcases() {
  const badcases = await prisma.badcase.findMany({
    where: { status: 'pending', category: 'knowledge' }
  })

  // 使用 embedding 相似度聚类
  const embeddings = await embedTexts(badcases.map(b => b.question))
  const clusters = clusterBySimilarity(embeddings, threshold: 0.85)

  return clusters
}
```

---

### 3.4 效果验证 (Verification)

#### 3.4.1 自动验证

**流程：**
1. 优化执行完成后，标记为 `verified` 待验证
2. 同一问题再次出现时，自动验证
3. 对比优化前后的评分/置信度

**验证标准：**

| 指标 | 改善标准 |
|-----|---------|
| 置信度 | 提升 ≥ 0.15 |
| 评测分数 | 提升 ≥ 0.2 |
| 用户评分 | 提升 ≥ 1 星 |

#### 3.4.2 验证结果记录

```typescript
await prisma.badcase.update({
  where: { id: badcaseId },
  data: {
    verified: true,
    verifiedAt: new Date(),
    verificationResult: compareResult > threshold ? 'improved' : 'no_change'
  }
})
```

#### 3.4.3 未改善告警

- 如果验证结果为 `no_change` 或 `degraded`
- 自动提升 priority 并通知相关人员

---

## 4. API 接口设计

### 4.1 Badcase 管理

#### GET /api/badcase
查询 Badcase 列表

```typescript
// Query params
interface BadcaseQuery {
  status?: string           // pending/analyzing/optimized/verified/closed
  category?: string         // retrieval/answer/knowledge
  priority?: string          // low/medium/high/critical
  sourceType?: string        // evaluation_failed/user_feedback/low_confidence
  page?: number
  pageSize?: number
}

// Response
interface BadcaseListResponse {
  items: Badcase[]
  total: number
  page: number
  pageSize: number
}
```

#### GET /api/badcase/[id]
获取 Badcase 详情

```typescript
interface BadcaseDetailResponse {
  badcase: Badcase
  analyses: BadcaseAnalysis[]
  optimizationTasks: OptimizationTask[]
}
```

#### PATCH /api/badcase/[id]
更新 Badcase（状态、分类、根因等）

```typescript
interface UpdateBadcaseRequest {
  status?: string
  category?: string
  rootCause?: string
  priority?: string
  optimization?: string
}
```

#### POST /api/badcase/[id]/analyze
手动触发 LLM 分析

```typescript
interface AnalyzeResponse {
  category: string
  rootCause: string
  suggestions: string[]
}
```

#### POST /api/badcase/[id]/verify
手动验证优化效果

```typescript
interface VerifyRequest {
  question: string  // 验证时使用的问题
}

interface VerifyResponse {
  result: 'improved' | 'no_change' | 'degraded'
  oldScore?: number
  newScore?: number
  oldConfidence?: number
  newConfidence?: number
}
```

### 4.2 统计接口

#### GET /api/badcase/stats
Badcase 统计概览

```typescript
interface BadcaseStats {
  total: number
  byStatus: Record<string, number>
  byCategory: Record<string, number>
  byPriority: Record<string, number>
  bySourceType: Record<string, number>
  avgResolutionTime: number  // 平均解决时间（小时）
  improvementRate: number    // 改善率
}
```

#### GET /api/badcase/trends
趋势分析

```typescript
interface BadcaseTrends {
  daily: { date: string; created: number; resolved: number }[]
  weekly: { week: string; created: number; resolved: number }[]
}
```

---

## 5. 文件结构

```
lib/
├── badcase/
│   ├── detector.ts       # 问题发现
│   ├── analyzer.ts       # 分类归因（LLM分析）
│   ├── optimizer.ts      # 优化执行
│   ├── verifier.ts       # 效果验证
│   ├── cluster.ts        # 相似问题聚类
│   └── index.ts          # 统一导出

app/api/badcase/
├── route.ts              # GET list, POST create
├── stats/route.ts         # 统计接口
├── [id]/
│   ├── route.ts           # GET, PATCH
│   ├── analyze/route.ts   # POST analyze
│   └── verify/route.ts    # POST verify
```

---

## 6. 实施计划

### Task 1: 数据库扩展

- [ ] 扩展 `prisma/schema.prisma` 添加 Badcase 相关模型
- [ ] 运行 `prisma migrate dev`

### Task 2: 问题发现层

- [ ] `lib/badcase/detector.ts` - 三种发现源统一入口
- [ ] `lib/badcase/index.ts` - 集成到现有评测和反馈流程

### Task 3: 分类归因层

- [ ] `lib/badcase/analyzer.ts` - LLM 自动分类
- [ ] API `POST /api/badcase/[id]/analyze`

### Task 4: 优化执行层

- [ ] `lib/badcase/optimizer.ts` - 优化任务管理
- [ ] `lib/badcase/cluster.ts` - 相似问题聚类

### Task 5: 效果验证层

- [ ] `lib/badcase/verifier.ts` - 验证逻辑
- [ ] API `POST /api/badcase/[id]/verify`

### Task 6: API 接口

- [ ] `GET /api/badcase` - 列表查询
- [ ] `GET /api/badcase/[id]` - 详情
- [ ] `PATCH /api/badcase/[id]` - 更新
- [ ] `GET /api/badcase/stats` - 统计
- [ ] `GET /api/badcase/trends` - 趋势

### Task 7: 集成测试

- [ ] 集成到评测失败回调
- [ ] 集成到用户差评回调
- [ ] 全流程 E2E 测试

---

## 7. 与现有系统集成

### 7.1 集成点

| 现有模块 | 集成位置 | 触发条件 |
|---------|---------|---------|
| 评测系统 | `lib/evaluation/runner.ts` | 评测完成且分数 < 0.4 |
| 反馈系统 | `app/api/feedback/route.ts` | 用户评分 ≤ 2 |
| 实时检查 | `lib/evaluation/rules.ts` | 置信度 < 0.5 且规则检查失败 |

### 7.2 集成代码示例

```typescript
// lib/evaluation/runner.ts 评测完成后
const result = await prisma.evaluationResult.create({...})

// 触发 Badcase 检测
if (result.overallScore < 0.4) {
  await detectBadcase({
    sessionId: result.runId,
    question: result.question,
    answer: result.answer,
    confidence: result.confidence,
    sourceType: 'evaluation_failed',
    sourceId: result.id
  })
}
```

---

## 8. 成功指标

| 指标 | 目标值 | 说明 |
|-----|-------|------|
| Badcase 发现率 | 100% | 评测失败/差评自动标记 |
| 分类准确率 | ≥ 85% | LLM 分类与人工确认一致 |
| 优化响应时间 | ≤ 24h | 从发现到优化执行 |
| 改善率 | ≥ 70% | 优化后质量提升的比例 |
| 重复问题减少 | ≥ 50% | 聚类优化后相似问题减少 |

---

## 9. 后续扩展

1. **自动优化**：对于简单的知识缺失，尝试自动生成答案草稿
2. **知识图谱**：构建 IT 支持知识图谱，支持更精准的问答
3. **预测性分析**：在问题发生前预警（知识库老化、新软件缺乏文档）

---

**文档结束**
