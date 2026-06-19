# Everything to Markdown (E2M)

AI 驱动的一站式内容转写与学习笔记生成平台。将视频、网页、文档智能转化为结构化 Markdown 学习笔记。

## 功能

- **视频转笔记** — YouTube/Bilibili 链接或本地视频 → 帧提取 + ASR 语音识别 + VLM 分析 → LLM 生成学习笔记
- **URL 转笔记** — 任意网页链接 → 内容抓取清洗 → LLM 总结
- **文档转笔记** — PDF / Word / PPT / Excel 等 → MarkItDown 转换 → LLM 总结
- **智能导出** — Markdown / Word / PDF 多格式导出
- **用户认证** — 邮箱（Google/QQ）、手机号（短信验证码）、Google OAuth 登录注册
- **按月订阅** — Stripe（国际卡）/ 微信支付 / 支付宝
- **埋点追踪** — 用户行为、API 请求、订单全链路数据采集
- **管理后台** — 独立界面，收入统计、用户管理、订单查看、埋点分析、系统配置

## 技术栈

| 层级 | 技术 |
|------|------|
| 后端 | Python 3.11+, FastAPI, SQLAlchemy, MySQL |
| AI | OpenAI API (GPT-4o / Whisper), MarkItDown |
| 前端 | React 18, TypeScript, Vite, Tailwind CSS |
| 管理后台 | React 18, TypeScript, Vite, Tailwind CSS, Recharts |
| 认证 | JWT, bcrypt, Google OAuth 2.0 |
| 支付 | Stripe, 微信支付, 支付宝 |
| 短信 | 阿里云 SMS / Twilio |
| 部署 | Docker, Docker Compose, Nginx, MySQL 8.0 |

## 项目结构

```
markitdown2web/
├── backend/                 # 主后端 (FastAPI)
│   ├── api/v1/endpoints/    # API 路由 (auth, payment, admin, tracking, ...)
│   ├── core/                # 核心模块 (security, sms, payment, converter, llm)
│   ├── models/              # SQLAlchemy 数据模型 (9 张表)
│   ├── services/            # 业务逻辑层
│   ├── middleware/           # 埋点中间件
│   ├── db/                  # 数据库会话 + init.sql 建表脚本
│   └── config/              # Pydantic Settings
├── pptx_backend/            # PPTX 生成子模块（挂载到主后端 /api/v1/pptx）
│   ├── endpoints/           # jobs CRUD + preview
│   ├── services/            # strategist, executor, exporter, pipeline
│   ├── providers/           # Provider 抽象 + ppt-master 实现
│   └── utils/               # 工作空间管理
├── frontend/                # 用户前端 (React + Vite, :3000)
│   └── src/
│       ├── pages/           # Home, Video, Url, Document, Login, Register, Pricing...
│       ├── api/             # auth, payment, tracking API 客户端
│       ├── stores/          # Zustand (auth, task)
│       └── components/      # AuthGuard, SubscriptionBadge, ...
├── pptx-frontend/           # PPTX 独立前端 (React + Vite, :3002)
│   └── src/
│       ├── pages/           # Home, JobDetail, History
│       ├── api/             # PPTX 任务 API 客户端
│       ├── stores/          # authStore（与主前端共享 token）
│       ├── components/      # Layout, FileUpload, JobProgress
│       └── types/           # PptxJob 类型定义
├── admin/                   # 管理后台 (React + Vite, :3001)
│   └── src/
│       ├── pages/           # Dashboard, Users, Orders, Tracking, Settings
│       ├── api/             # 管理 API 客户端
│       └── components/      # Sidebar, StatsCard, DataTable
├── ppt-master/              # git submodule: https://github.com/hugohe3/ppt-master
├── docs/                    # 文档
│   ├── API_REFERENCE.md     # 后端接口文档
│   └── DEPLOYMENT.md        # 部署指南
├── .env.example             # 环境变量模板
├── docker-compose.yml       # Docker 编排 (MySQL + Backend + Frontend + Admin + PPTX)
├── Dockerfile               # 后端 Dockerfile
├── Dockerfile.frontend      # 主前端 Dockerfile
├── Dockerfile.admin         # 管理后台 Dockerfile
├── Dockerfile.pptx          # PPTX 前端 Dockerfile
└── pyproject.toml           # Python 依赖
```

## 快速开始

### 1. 环境准备

```bash
git clone <repo-url>
cd markitdown2web
cp .env.example .env
# 编辑 .env 填入 MySQL 连接、OpenAI API Key 等配置
```

### 2. 初始化 MySQL

```bash
mysql -u root -p < backend/db/init.sql
```

默认管理员：`728003092@qq.com` / `123456`

### 3. 初始化 ppt-master 子模块

```bash
git submodule update --init --recursive
```

### 4. 启动后端

```bash
python -m venv .venv
source .venv/bin/activate
pip install -e .
uvicorn backend.main:app --reload --port 8001
```

### 5. 启动前端

```bash
cd frontend && npm install && npm run dev         # 主前端  :3000
cd admin && npm install && npm run dev             # 管理后台 :3001
cd pptx-frontend && npm install && npm run dev     # PPTX前端 :3002
```

### 6. Docker 部署

```bash
docker-compose up -d
```

- 主前端: http://localhost:3000
- PPTX 前端: http://localhost:3002
- 管理后台: http://localhost:3001
- API: http://localhost:8001/api/v1

## 系统要求

- Python >= 3.11
- Node.js >= 18
- MySQL >= 8.0
- FFmpeg（视频处理需要）
- OpenAI API Key

## 许可证

MIT
