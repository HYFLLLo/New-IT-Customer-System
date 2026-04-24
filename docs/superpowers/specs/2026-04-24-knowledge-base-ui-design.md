# 知识库管理界面设计

> **文档版本：** v1.0
> **编制日期：** 2026-04-24
> **模块编号：** M4

---

## 1. 背景与目标

### 1.1 业务背景

当前系统已有知识库 API（上传、解析、向量化、搜索），但缺少可视化管理界面。坐席人员无法直观地查看文档处理状态、预览 Chunk 内容、测试检索效果。

### 1.2 目标

为坐席人员提供完整的知识库管理界面，实现：
- 文档上传与处理状态跟踪
- 文档详情与 Chunk 预览/编辑
- 检索效果测试工具

---

## 2. 界面布局

### 2.1 整体布局

```
┌─────────────────────────────────────────────────────────────────┐
│                    知识库管理                                    │
├─────────────────────────────────────────────────────────────────┤
│  [文档管理]  [搜索测试]                                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  (Tab 内容区)                                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

- 顶部 Tab 切换：文档管理 / 搜索测试
- 位于坐席工作台 (`app/agent/`) 下，坐席登录后可访问

---

## 3. 功能模块

### 3.1 文档管理 Tab

#### 3.1.1 文档列表

**UI 元素：**
- 表格列：文档名称 | 状态 | 上传时间 | Chunk数量 | 操作
- 状态 Badge 颜色：
  - Pending：黄色
  - Processing：蓝色
  - Processed：绿色
  - Failed：红色
- 操作按钮：查看详情 | 删除 | 重新处理
- 分页控件（每页 10 条）

**交互：**
- 点击行展开详情面板
- 状态实时更新（5秒轮询）

#### 3.1.2 文档详情面板

**展开内容：**
- 文档基本信息（名称、类型、大小、上传人、上传时间）
- 处理状态与进度文字
- Chunk 列表（可折叠/展开）
- 每个 Chunk 显示：
  - Chunk 索引号
  - 内容预览（前 100 字 + "..."）
  - 点击展开完整内容

**操作：**
- 展开/收起 Chunk 详情
- 复制 Chunk 内容

#### 3.1.3 文件上传

**UI 元素：**
- 拖拽上传区域
- 支持文件类型提示：PDF / Markdown / DOCX
- 上传进度条（显示百分比）

**交互：**
- 拖拽或点击选择文件
- 自动上传，实时显示进度
- 上传完成后刷新列表

---

### 3.2 搜索测试 Tab

#### 3.2.1 搜索输入

**UI 元素：**
- 输入框（placeholder："输入问题测试检索效果"）
- 搜索按钮

#### 3.2.2 搜索结果

**显示内容：**
- Top-10 检索结果
- 每条结果包含：
  - 排名序号
  - Chunk 内容摘要（前 150 字）
  - 来源文档名称
  - 距离得分（保留 3 位小数）
  - 关键词匹配高亮

**交互：**
- 输入问题后按回车或点击搜索
- 点击结果可展开查看完整 Chunk 内容

---

## 4. 组件结构

```
app/agent/knowledge/
├── page.tsx              # 主页面，Tab 容器
├── components/
│   ├── DocumentList.tsx     # 文档列表 + 详情
│   ├── SearchTest.tsx       # 搜索测试工具
│   ├── FileUpload.tsx      # 文件上传组件
│   ├── ChunkPreview.tsx    # Chunk 预览 Modal
│   └── StatusBadge.tsx     # 状态 Badge 组件
└── loading.tsx            # 加载状态
```

---

## 5. API 接口

### 5.1 已有接口（无需修改）

| 接口 | 方法 | 用途 |
|-----|------|------|
| `/api/agent/knowledge` | GET | 获取文档列表 |
| `/api/agent/knowledge` | POST | 上传文档 |
| `/api/agent/knowledge/[id]` | GET | 获取文档详情 |
| `/api/agent/knowledge/[id]` | DELETE | 删除文档 |

### 5.2 新增接口

#### GET /api/agent/knowledge/[id]/chunks

获取文档的所有 Chunk：

```typescript
// Response
{
  chunks: Array<{
    id: string
    content: string
    chunkIndex: number
  }>
}
```

#### POST /api/agent/knowledge/[id]/reprocess

重新处理文档：

```typescript
// Response
{ success: true }
```

#### GET /api/search/test?query=xxx&topK=10

测试检索效果（不生成回答）：

```typescript
// Response
{
  results: Array<{
    id: string
    content: string
    distance: number
    metadata: {
      doc_name: string
      chunk_index: number
    }
  }>
}
```

---

## 6. 数据模型

### 6.1 现有 Prisma 模型（无需修改）

```prisma
model Document {
  id        String         @id @default(uuid())
  title     String
  fileName  String
  fileType  FileType
  filePath  String
  status    DocumentStatus @default(PENDING)
  progress  String?
  createdAt DateTime       @default(now())

  uploadedBy   User   @relation(fields: [uploadedById], references: [id])
  uploadedById String

  chunks Chunk[]
}

model Chunk {
  id         String   @id @default(uuid())
  content    String
  chromaId   String   @unique
  createdAt  DateTime @default(now())

  document   Document @relation(fields: [documentId], references: [id], onDelete: Cascade)
  documentId String
}
```

---

## 7. 技术实现

### 7.1 技术栈

- **框架：** Next.js App Router
- **UI 组件：** Radix UI + Tailwind CSS
- **状态管理：** React Server Components + URL State
- **数据获取：** SWR 轮询（5秒间隔）

### 7.2 目录结构

```
app/agent/knowledge/
├── page.tsx                    # 主页面
├── components/
│   ├── DocumentList.tsx        # 文档列表组件
│   ├── DocumentDetail.tsx       # 文档详情（展开面板）
│   ├── ChunkPreview.tsx        # Chunk 预览 Modal
│   ├── SearchTest.tsx          # 搜索测试
│   ├── FileUpload.tsx          # 上传组件
│   └── StatusBadge.tsx          # 状态 Badge
├── api/
│   └── chunks/route.ts         # GET /api/agent/knowledge/[id]/chunks
└── loading.tsx                  # 加载骨架
```

---

## 8. 实施计划

### Phase 1: 基础布局

- [ ] 创建 `app/agent/knowledge/page.tsx` 主页面框架
- [ ] 实现 Tab 切换组件
- [ ] 添加路由 `/agent/knowledge`

### Phase 2: 文档列表

- [ ] 实现 `DocumentList` 组件
- [ ] 实现 `StatusBadge` 组件
- [ ] 调用 GET `/api/agent/knowledge` 获取列表
- [ ] 实现状态轮询（5秒）

### Phase 3: 文档详情

- [ ] 实现 `DocumentDetail` 展开面板
- [ ] 实现 `ChunkPreview` Modal
- [ ] 调用 GET `/api/agent/knowledge/[id]/chunks`

### Phase 4: 文件上传

- [ ] 实现 `FileUpload` 拖拽上传组件
- [ ] 调用 POST `/api/agent/knowledge`
- [ ] 上传后自动刷新列表

### Phase 5: 搜索测试

- [ ] 实现 `SearchTest` 组件
- [ ] 调用 GET `/api/search/test`
- [ ] 结果展示与高亮

---

## 9. 验收标准

| 功能 | 验收条件 |
|-----|---------|
| 文档列表 | 显示所有文档，状态正确，5秒轮询更新 |
| 文档上传 | 拖拽上传成功，进度可见，处理后状态变绿 |
| 文档详情 | 点击展开显示所有 Chunk，内容正确 |
| 搜索测试 | 输入问题返回 Top-10 结果，分数正确 |
| 响应式 | 在 1024px 以上屏幕正常显示 |

---

**文档结束**
