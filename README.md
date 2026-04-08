# IT Helpdesk 系统

基于 AI 的智能 IT 桌面运维客服系统

## 简介

IT Helpdesk 系统是一个现代化的全栈应用，旨在为企业内部员工提供智能的 IT 桌面运维支持。系统利用 AI 技术基于企业知识库自动回答员工的 IT 问题，提高 IT 支持效率，同时为复杂问题提供人工处理通道。

**核心价值**：
- 7×24 小时智能 AI 响应，快速解决常见 IT 问题
- 基于企业知识库的精准回答，确保信息一致性
- 智能工单管理，提高 IT 团队工作效率
- 满意度反馈机制，持续优化服务质量

## 快速开始

### 环境要求

- Node.js 18+
- npm
- Python 3.8+ (用于 ChromaDB 服务)
- PostgreSQL 17+

### 安装

```bash
git clone https://github.com/HYFLLLo/New-IT-Customer-System
cd it-helpdesk
npm install
```

### 配置

```bash
# 复制环境变量配置文件
cp .env.example .env.local

# 编辑 .env.local 填写以下配置：
# - DATABASE_URL: PostgreSQL 数据库连接字符串
# - MINIMAX_API_KEY: MiniMax LLM API 密钥
# - OLLAMA_HOST: Ollama 本地服务地址（用于嵌入模型）
# - CHROMA_HOST/CHROMA_PORT: ChromaDB 服务配置
```

### 运行

```bash
# 开发模式（同时启动 ChromaDB 和 Next.js）
npm run dev

# 仅启动 Next.js 开发服务器
npm run dev:nx

# 构建生产版本
npm run build

# 生产模式运行
npm start
```

## 功能特性

- **智能 AI 回答**：基于企业知识库的 RAG 技术，提供精准的 IT 问题解决方案
- **多轮对话**：支持连续提问，AI 能够理解上下文语境
- **置信度评估**：自动评估回答质量，低置信度问题自动转人工处理
- **工单管理**：完整的工单生命周期管理，包括创建、分配、处理和关闭
- **知识库管理**：支持上传和管理 PDF、Markdown、Word 文档，自动解析入库
- **质检报告**：AI 生成标准化的问题解决方案，形成知识库积累
- **员工反馈**：满意度评分机制，持续优化服务质量

## 技术栈

- **前端**：Next.js 16.2.1 + TypeScript + Tailwind CSS
- **后端**：Next.js App Router (API Routes)
- **数据库**：PostgreSQL + Prisma ORM
- **向量数据库**：ChromaDB
- **LLM**：MiniMax
- **文档解析**：pdf-parse、marked、mammoth
- **UI 组件**：Radix UI
- **状态管理**：React useState
- **通知**：Sonner

## 项目结构

```
it-helpdesk/
├── app/              # Next.js App Router
│   ├── agent/        # 坐席端页面
│   ├── api/          # API 路由
│   ├── employee/     # 员工端页面
│   ├── globals.css   # 全局样式
│   ├── layout.tsx    # 布局组件
│   └── page.tsx      # 首页
├── components/       # 可复用组件
│   ├── agent/        # 坐席端组件
│   ├── employee/     # 员工端组件
│   └── ui/           # 通用 UI 组件
├── lib/              # 工具库
│   ├── auth.ts       # 认证相关
│   ├── chroma.ts     # ChromaDB 操作
│   ├── minimax.ts    # MiniMax LLM 集成
│   ├── parser.ts     # 文档解析
│   ├── prisma.ts     # Prisma 客户端
│   └── utils.ts      # 通用工具
├── prisma/           # Prisma 配置
│   ├── migrations/   # 数据库迁移
│   ├── schema.prisma # 数据模型
│   └── seed.ts       # 种子数据
├── public/           # 静态资源
├── scripts/          # 脚本文件
│   ├── start-chroma.py  # 启动 ChromaDB 服务
│   └── sync-chroma.py   # 同步知识库到 ChromaDB
├── .env              # 环境变量
├── package.json      # 项目配置
└── README.md         # 项目说明
```

## 开发指南

### 数据库初始化

```bash
# 运行数据库迁移
npx prisma migrate dev

# 生成 Prisma 客户端
npx prisma generate
```

### 知识库同步

```bash
# 同步知识库文档到 ChromaDB
python3 scripts/sync-chroma.py
```

### 代码规范

```bash
# 运行 ESLint 检查
npm run lint
```

## 部署

### 生产环境部署

1. **构建应用**：
   ```bash
   npm run build
   ```

2. **启动服务**：
   ```bash
   npm start
   ```

3. **环境配置**：
   - 确保 PostgreSQL 数据库已启动
   - 确保 ChromaDB 服务已启动
   - 配置好所有环境变量

### Docker 部署（推荐）

```bash
# 构建 Docker 镜像
docker build -t it-helpdesk .

# 运行容器
docker run -p 3000:3000 --env-file .env.local it-helpdesk
```

## 常见问题

### Q: ChromaDB 服务启动失败？

A: 请确保已安装 Python 依赖：
```bash
pip install uvicorn chromadb fastapi opentelemetry-instrumentation-fastapi
```

### Q: 数据库连接失败？

A: 请检查 PostgreSQL 服务是否启动，以及 DATABASE_URL 配置是否正确。

### Q: AI 回答质量不高？

A: 请确保知识库已同步到 ChromaDB，并且包含足够的相关信息。

## 贡献

欢迎提交 Issue 和 Pull Request 来改进这个项目。

## 许可证

MIT License

## 致谢

- [Next.js](https://nextjs.org/) - 现代化的 React 框架
- [Prisma](https://www.prisma.io/) - 优雅的数据库 ORM
- [ChromaDB](https://www.trychroma.com/) - 开源向量数据库
- [MiniMax](https://www.minimax.chat/) - 强大的 LLM 服务
- [Tailwind CSS](https://tailwindcss.com/) - 实用的 CSS 框架
- [Radix UI](https://www.radix-ui.com/) - 高质量的 UI 组件

---

**注意**：请勿将包含敏感信息的 `.env.local` 文件提交到 Git。