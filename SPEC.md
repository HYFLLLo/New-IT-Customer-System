# IT Helpdesk 客服系统规格文档

## 1. 项目概述

**项目名称**: IT Helpdesk 内部客服系统  
**项目类型**: 全栈 Next.js 应用 (TypeScript)  
**核心功能**: 员工提交桌面运维问题 → AI 基于知识库生成回答 → 坐席人工处理高难度工单  
**目标用户**: 内部员工（提问者）、IT 坐席/管理员（处理者）

---

## 2. 技术栈

| 层级 | 技术选型 |
|------|----------|
| 前端框架 | Next.js 15 + TypeScript + Tailwind CSS |
| 后端框架 | Next.js App Router (API Routes) |
| 数据库 | PostgreSQL + Prisma ORM |
| 向量数据库 | ChromaDB (本地部署) |
| LLM | MiniMax (abab6.5s-chat) |
| 文档解析 | pdf-parse (PDF), marked (Markdown), mammoth (Word .docx) |
| 文件存储 | 本地文件系统 (`./uploads/`) |

---

## 3. 数据模型

### User (用户)
- `id`: UUID
- `name`: 姓名
- `email`: 邮箱（唯一）
- `role`: ENUM ('EMPLOYEE', 'AGENT', 'ADMIN')
- `createdAt`

### Document (知识库文档)
- `id`: UUID
- `title`: 文档标题
- `fileName`: 原始文件名
- `fileType`: ENUM ('PDF', 'MARKDOWN', 'DOCX')
- `filePath`: 存储路径
- `status`: ENUM ('PENDING', 'PROCESSING', 'PROCESSED', 'FAILED')
- `uploadedById`: 上传者 (User)
- `createdAt`

### Chunk (文档切片，存入 ChromaDB)
- `id`: UUID
- `documentId`: 所属文档
- `content`: 文本内容
- `chromaId`: ChromaDB 中的 ID
- `createdAt`

### Ticket (工单)
- `id`: UUID
- `title`: 问题标题
- `description`: 问题描述
- `status`: ENUM ('OPEN', 'AI_ANSWERED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED')
- `confidence`: 置信度 (0.0 - 1.0)
- `employeeId`: 提问员工
- `assignedToId`: 分配的坐席 (nullable)
- `createdAt`
- `updatedAt`

### Message (工单消息)
- `id`: UUID
- `ticketId`: 所属工单
- `senderId`: 发送者
- `content`: 消息内容
- `type`: ENUM ('USER', 'AI', 'AGENT')
- `createdAt`

### QAReport (质检报告)
- `id`: UUID
- `ticketId`: 关联工单
- `title`: 报告标题
- `content`: 报告内容（完整解决步骤）
- `generatedBy`: ENUM ('AI', 'MANUAL')
- `createdById`: 创建者
- `createdAt`

### Feedback (员工反馈)
- `id`: UUID
- `ticketId`: 关联工单
- `rating`: 满意度评分 (1-5)
- `comment`: 评价内容 (nullable)
- `createdAt`

---

## 4. 功能模块

### 4.1 员工端

#### 提问页面 (`/employee`)
- 输入问题描述（文本框）
- 提交按钮
- 显示 AI 回答结果 + 置信度
- 置信度 > 0.8：直接显示答案，提供"问题解决/未解决"反馈按钮
- 置信度 0.6-0.8：显示答案 + "提交人工工单"按钮
- 置信度 < 0.6：隐藏答案，显示"提交人工工单"按钮

#### 历史记录 (`/employee/history`)
- 展示该员工所有提问记录
- 显示状态（AI回答中/待处理/已解决）
- 可点击查看详情

#### 质检报告查看 (`/employee/report/[id]`)
- 查看坐席发送的质检报告
- 报告内含完整解决步骤
- 提供"联系工作人员"按钮（跳转反馈表单）

#### 反馈 (`/employee/feedback/[ticketId]`)
- 对工单进行满意度评分 (1-5 星)
- 可选填写评价文字

---

### 4.2 坐席端

#### 登录页面 (`/login`)
- 坐席/管理员登录（邮箱 + 密码，简单实现）

#### 仪表盘 (`/agent/dashboard`)
- 工单列表（状态筛选）
- 新工单卡片高亮
- 点击进入工单详情

#### 工单详情 (`/agent/ticket/[id]`)
- 查看员工原始问题
- AI 提取的关键字段（问题类型、设备信息等）
- AI 生成的参考答案
- 操作按钮：
  - "发送质检报告" → 跳转报告编辑
  - "发送信息" → 发送固定文案消息
  - "联系员工" → 发送自由文本消息

#### 知识库管理 (`/agent/knowledge`)
- 文档列表（上传者、状态、时间）
- 上传新文档（支持 PDF / Markdown / Word）
- 删除文档（同步删除 ChromaDB 中的 chunks）
- 文档上传后自动解析入库

#### 质检报告编辑 (`/agent/report/new/[ticketId]`)
- 基于 AI 生成的报告草稿
- 可编辑修改
- 发送至员工

#### 反馈统计 (`/agent/feedback`)
- 满意度评分分布
- 工单解决率统计

---

## 5. API 设计

### 员工端

| Method | Endpoint | 说明 |
|--------|----------|------|
| POST | `/api/chat` | 员工提问，RAG + LLM 生成回答 |
| GET | `/api/tickets?employeeId=` | 获取员工工单列表 |
| GET | `/api/tickets/[id]` | 获取工单详情 |
| POST | `/api/feedback` | 提交满意度反馈 |

### 坐席端

| Method | Endpoint | 说明 |
|--------|----------|------|
| GET | `/api/agent/tickets` | 获取所有工单（支持状态筛选）|
| PATCH | `/api/agent/tickets/[id]` | 更新工单状态/分配坐席 |
| POST | `/api/agent/reports` | 创建质检报告 |
| POST | `/api/agent/messages` | 发送消息给员工 |
| GET | `/api/agent/knowledge` | 获取知识库文档列表 |
| POST | `/api/agent/knowledge` | 上传文档（multipart）|
| DELETE | `/api/agent/knowledge/[id]` | 删除文档 |
| GET | `/api/agent/feedback-stats` | 反馈统计数据 |

### 内部 API

| Method | Endpoint | 说明 |
|--------|----------|------|
| POST | `/api/internal/extract-fields` | AI 提取工单关键字段 |
| POST | `/api/internal/generate-report` | AI 生成质检报告草稿 |

---

## 6. RAG 流程（员工提问）

```
员工输入问题
    ↓
文本 embedding (MiniMax) → ChromaDB 相似度检索 Top-K
    ↓
拼接 context (检索到的文档片段)
    ↓
MiniMax 生成回答 + 置信度评分
    ↓
置信度 > 0.8 → 直接返回答案
置信度 0.6-0.8 → 返回答案 + 建议提交工单
置信度 < 0.6 → 隐藏答案 + 强制提交工单选项
```

---

## 7. 置信度计算

采用"检索相关度 + 生成一致性"双重计算：

1. **检索分数**: ChromaDB 返回的 cosine similarity 的均值 (0-1)
2. **生成一致性**: 再次调用 MiniMax，让其判断回答与检索内容的契合度 (0-1)
3. **最终置信度**: `0.6 * 检索分数 + 0.4 * 一致性分数`

---

## 8. MVP 范围

### 第一期（当前实现）

**必须完成**:
- [x] 项目初始化 + 技术栈搭建
- [x] Prisma 数据模型
- [x] ChromaDB 集成
- [x] 知识库上传 + 解析 + 入库
- [x] 员工提问 → RAG → 置信度回答
- [x] 坐席工单列表
- [x] AI 生成质检报告草稿
- [x] 坐席发送质检报告/信息
- [x] 员工反馈（满意度评分）
- [x] 基础 UI 界面

**暂不实现**:
- [ ] 用户认证系统（第一期用简单邮箱识别）
- [ ] 消息实时推送（WebSocket）
- [ ] 多语言支持
- [ ] 数据导出

---

## 9. 目录结构

```
it-helpdesk/
├── prisma/
│   └── schema.prisma
├── lib/
│   ├── prisma.ts
│   ├── chroma.ts
│   ├── minimax.ts
│   └── parser.ts
├── uploads/               # 文件存储
├── app/
│   ├── layout.tsx
│   ├── page.tsx          # 首页（入口选择）
│   ├── employee/
│   │   ├── page.tsx      # 员工提问
│   │   ├── history/
│   │   ├── report/
│   │   └── feedback/
│   ├── agent/
│   │   ├── login/
│   │   ├── dashboard/
│   │   ├── ticket/
│   │   ├── knowledge/
│   │   ├── report/
│   │   └── feedback/
│   └── api/
│       ├── chat/
│       ├── tickets/
│       ├── feedback/
│       └── agent/
│           ├── tickets/
│           ├── knowledge/
│           ├── reports/
│           └── messages/
└── package.json
```
