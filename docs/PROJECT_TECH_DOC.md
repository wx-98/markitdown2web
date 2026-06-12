# Everything to Markdown (E2M) - 项目技术文档

## 1. 项目概述

**Everything to Markdown (E2M)** 是一个一站式的 AI 内容转写与学习笔记生成平台。用户可以将视频、URL 网页、Word/PDF 等文档内容智能转化为结构化的 Markdown 学习笔记，并支持导出为 Word、PDF 等格式。

### 核心功能

| 功能模块 | 输入源 | 处理方式 | 输出 |
|---------|--------|---------|------|
| 视频转笔记 | YouTube/Bilibili 链接、本地视频文件 | 帧提取 → VLM 分析 + ASR 语音转文字 → LLM 总结 | Markdown 笔记 |
| URL 转笔记 | 任意网页链接 | 网页抓取 → 内容清洗 → LLM 总结 | Markdown 笔记 |
| 文档转笔记 | PDF、Word、Excel、PPT 等 | MarkItDown 转换 → LLM 总结 | Markdown 笔记 |
| 智能总结 | 以上所有 | LLM 生成摘要、重点、思维导图 | Markdown 笔记 |
| 导出 | Markdown | Pandoc/WeasyPrint | Word(.docx)、PDF |

### 参考项目

- [videotranscriber.ai](https://videotranscriber.ai) - AI 音视频转文字平台
- [Microsoft MarkItDown](https://github.com/microsoft/markitdown) - 文档转 Markdown 工具

---

## 2. 技术栈

### 后端 (Backend)

| 技术 | 用途 | 版本 |
|------|------|------|
| Python | 编程语言 | ≥3.11 |
| FastAPI | Web 框架 | ≥0.110 |
| Uvicorn | ASGI 服务器 | ≥0.30 |
| SQLAlchemy | ORM 框架 | ≥2.0 |
| Alembic | 数据库迁移 | ≥1.13 |
| Celery | 异步任务队列 | ≥5.4 |
| Redis | 消息代理 + 缓存 | ≥7.0 |
| PostgreSQL | 关系型数据库 | ≥16 |

### AI/ML

| 技术 | 用途 |
|------|------|
| OpenAI API / Claude API | VLM 图像分析、LLM 文本总结 |
| Whisper API / Azure Speech | ASR 语音转文字 |
| MarkItDown | 文档转 Markdown |
| yt-dlp | YouTube/Bilibili 视频下载 |

### 前端 (Frontend)

| 技术 | 用途 |
|------|------|
| React 18 | UI 框架 |
| TypeScript | 类型安全 |
| Vite | 构建工具 |
| Tailwind CSS | 样式框架 |
| React Router | 路由管理 |
| Zustand | 状态管理 |
| Axios | HTTP 客户端 |

### DevOps

| 技术 | 用途 |
|------|------|
| Docker | 容器化 |
| Docker Compose | 多容器编排 |
| Nginx | 反向代理 |
| GitHub Actions | CI/CD |

---

## 3. 项目目录结构

```
everything2markdown/
├── .env                          # 环境变量配置
├── .env.example                  # 环境变量模板
├── .gitignore
├── docker-compose.yml            # Docker 编排
├── Dockerfile                    # 后端 Dockerfile
├── Dockerfile.frontend           # 前端 Dockerfile
├── nginx.conf                    # Nginx 反向代理配置
├── pyproject.toml                # Python 项目配置 (Poetry)
├── package.json                  # 前端项目配置
├── README.md
│
├── backend/                      # 后端代码
│   ├── __init__.py
│   ├── main.py                   # FastAPI 应用入口
│   ├── config/                   # 配置模块
│   │   ├── __init__.py
│   │   ├── settings.py           # 全局配置 (从 .env 读取)
│   │   └── logging.py            # 日志配置
│   │
│   ├── api/                      # API 层
│   │   ├── __init__.py
│   │   ├── v1/                   # API v1 版本
│   │   │   ├── __init__.py
│   │   │   ├── router.py         # 路由聚合
│   │   │   ├── endpoints/        # 各端点
│   │   │   │   ├── __init__.py
│   │   │   │   ├── video.py      # 视频处理相关 API
│   │   │   │   ├── url.py        # URL 抓取相关 API
│   │   │   │   ├── document.py   # 文档转换相关 API
│   │   │   │   ├── export.py     # 导出相关 API
│   │   │   │   └── health.py     # 健康检查
│   │   │   └── schemas/          # Pydantic 请求/响应模型
│   │   │       ├── __init__.py
│   │   │       ├── video.py
│   │   │       ├── url.py
│   │   │       ├── document.py
│   │   │       └── export.py
│   │   └── deps.py               # 依赖注入
│   │
│   ├── core/                     # 核心业务逻辑
│   │   ├── __init__.py
│   │   ├── converter/            # 转换引擎
│   │   │   ├── __init__.py
│   │   │   ├── base.py           # 转换器基类
│   │   │   ├── factory.py        # 转换器工厂
│   │   │   ├── markitdown_converter.py  # MarkItDown 集成
│   │   │   └── registry.py       # 转换器注册表
│   │   │
│   │   ├── video/                # 视频处理
│   │   │   ├── __init__.py
│   │   │   ├── downloader.py     # 视频下载 (yt-dlp)
│   │   │   ├── audio_extractor.py # 音频提取
│   │   │   ├── frame_extractor.py # 帧提取
│   │   │   ├── asr.py            # ASR 语音识别
│   │   │   ├── vlm.py            # VLM 图像分析
│   │   │   └── pipeline.py       # 视频处理流水线
│   │   │
│   │   ├── web/                  # URL 处理
│   │   │   ├── __init__.py
│   │   │   ├── crawler.py        # 网页抓取 & 内容提取
│   │   │   └── cleaner.py        # 内容清洗
│   │   │
│   │   ├── llm/                  # LLM 集成
│   │   │   ├── __init__.py
│   │   │   ├── client.py         # LLM 客户端封装 (OpenAI/Claude)
│   │   │   ├── summarizer.py     # 摘要/总结生成
│   │   │   ├── note_generator.py # 学习笔记生成
│   │   │   └── prompts.py        # Prompt 模板
│   │   │
│   │   └── export/               # 导出模块
│   │       ├── __init__.py
│   │       ├── base.py           # 导出器基类
│   │       ├── markdown_exporter.py   # Markdown 导出
│   │       ├── word_exporter.py       # Word 导出
│   │       ├── pdf_exporter.py        # PDF 导出
│   │       └── factory.py        # 导出器工厂
│   │
│   ├── models/                   # SQLAlchemy 数据库模型
│   │   ├── __init__.py
│   │   ├── base.py               # 模型基类
│   │   ├── project.py            # 项目模型
│   │   ├── task.py               # 任务模型
│   │   └── conversion_record.py  # 转换记录
│   │
│   ├── schemas/                  # 内部数据模型
│   │   ├── __init__.py
│   │   ├── conversion.py
│   │   └── task.py
│   │
│   ├── db/                       # 数据库
│   │   ├── __init__.py
│   │   ├── session.py            # 数据库会话
│   │   └── migrations/           # Alembic 迁移
│   │       ├── env.py
│   │       ├── alembic.ini
│   │       └── versions/
│   │
│   ├── services/                 # 业务服务层
│   │   ├── __init__.py
│   │   ├── task_service.py       # 任务管理
│   │   ├── conversion_service.py # 转换服务
│   │   └── export_service.py     # 导出服务
│   │
│   ├── tasks/                    # Celery 异步任务
│   │   ├── __init__.py
│   │   ├── celery_app.py         # Celery 应用
│   │   ├── video_tasks.py        # 视频处理任务
│   │   ├── url_tasks.py          # URL 处理任务
│   │   ├── document_tasks.py     # 文档处理任务
│   │   └── export_tasks.py       # 导出任务
│   │
│   ├── utils/                    # 工具函数
│   │   ├── __init__.py
│   │   ├── file_utils.py         # 文件操作
│   │   ├── media_utils.py        # 多媒体处理
│   │   └── text_utils.py         # 文本处理
│   │
│   └── storage/                  # 文件存储抽象
│       ├── __init__.py
│       ├── base.py               # 存储后端基类
│       ├── local.py              # 本地文件存储
│       └── s3.py                 # S3 兼容存储
│
├── frontend/                     # 前端代码
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── api/                  # API 调用层
│       │   ├── client.ts         # Axios 实例
│       │   ├── video.ts
│       │   ├── url.ts
│       │   ├── document.ts
│       │   └── export.ts
│       ├── components/           # 通用组件
│       │   ├── Layout/
│       │   ├── Upload/
│       │   ├── MarkdownRenderer/
│       │   └── common/
│       ├── pages/                # 页面
│       │   ├── Home/
│       │   ├── VideoConverter/
│       │   ├── UrlConverter/
│       │   ├── DocumentConverter/
│       │   ├── Result/
│       │   └── History/
│       ├── stores/               # Zustand 状态管理
│       │   ├── taskStore.ts
│       │   └── userStore.ts
│       ├── types/                # TypeScript 类型
│       │   └── index.ts
│       └── utils/                # 工具函数
│           └── index.ts
│
├── scripts/                      # 部署/运维脚本
│   ├── init_db.py                # 数据库初始化
│   └── seed_data.py              # 测试数据
│
└── tests/                        # 测试
    ├── backend/
    │   ├── conftest.py
    │   ├── test_api/
    │   ├── test_core/
    │   └── test_services/
    └── frontend/
```

---

## 4. 架构设计

### 4.1 系统架构图

```
┌─────────────────────────────────────────────────────────────┐
│                     Client (Browser)                        │
│              React SPA + Tailwind CSS                       │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTP/REST
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                   Nginx (Reverse Proxy)                      │
│              SSL Termination + Static Files                  │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                   FastAPI Application                        │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │  API Layer  │  │  Service     │  │  Core Engine      │  │
│  │  (RESTful)  │──│  Layer       │──│  (Converters)     │  │
│  └─────────────┘  └──────┬───────┘  └───────────────────┘  │
│                          │                                   │
│                    ┌─────▼──────┐                            │
│                    │  Celery    │  ← Redis (Broker)          │
│                    │  Workers   │                            │
│                    └─────┬──────┘                            │
└──────────────────────────┼──────────────────────────────────┘
                           │
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
    ┌──────────┐    ┌────────────┐   ┌──────────┐
    │PostgreSQL│    │   Redis    │   │ File     │
    │          │    │  (Cache)   │   │ Storage  │
    └──────────┘    └────────────┘   └──────────┘
```

### 4.2 处理流程

#### 视频处理流水线

```
用户上传/粘贴视频链接
        │
        ▼
[1] 视频下载 (yt-dlp) ──→ 临时存储
        │
        ├──→ [2a] 帧提取 (关键帧/固定间隔) ──→ [3a] VLM 分析 (GPT-4o/Claude)
        │                                              │
        └──→ [2b] 音频提取 ──→ [3b] ASR 转写 (Whisper) │
                                                        │
                                                        ▼
                                          [4] 内容融合与结构化
                                                        │
                                                        ▼
                                          [5] LLM 总结与笔记生成
                                                        │
                                                        ▼
                                          [6] Markdown 结果
```

#### 文档处理流水线

```
用户上传文件 (PDF/DOCX/PPTX/XLSX)
        │
        ▼
[1] MarkItDown 转换 ──→ Markdown 文本
        │
        ▼
[2] LLM 分析与总结 ──→ 学习笔记
        │
        ▼
[3] Markdown 结果
```

### 4.3 异步任务设计

使用 Celery + Redis 处理耗时任务：

- `process_video_task` - 视频处理 (下载→帧提取→ASR→VLM→总结)
- `process_url_task` - URL 内容抓取与总结
- `process_document_task` - 文档转换与总结
- `export_task` - 导出为 Word/PDF

任务状态通过 WebSocket 或轮询通知前端。

---

## 5. API 设计

### 5.1 API 端点

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/api/v1/video/process` | 提交视频处理任务 |
| GET | `/api/v1/video/status/{task_id}` | 查询视频处理状态 |
| POST | `/api/v1/url/process` | 提交 URL 处理任务 |
| GET | `/api/v1/url/status/{task_id}` | 查询 URL 处理状态 |
| POST | `/api/v1/document/convert` | 提交文档转换任务 |
| GET | `/api/v1/document/status/{task_id}` | 查询文档转换状态 |
| GET | `/api/v1/result/{result_id}` | 获取处理结果 (Markdown) |
| POST | `/api/v1/export/{result_id}` | 导出 (word/pdf/markdown) |
| GET | `/api/v1/tasks` | 获取任务历史列表 |
| GET | `/api/v1/health` | 健康检查 |

### 5.2 通用响应格式

```json
{
  "code": 200,
  "message": "success",
  "data": {},
  "request_id": "uuid"
}
```

---

## 6. 数据库设计

### 6.1 核心表

**tasks** - 任务记录

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| type | ENUM | 任务类型 (video/url/document) |
| source | TEXT | 原始输入 (链接/文件路径) |
| status | ENUM | 状态 (pending/processing/completed/failed) |
| progress | INT | 进度百分比 |
| error_message | TEXT | 错误信息 |
| result_id | UUID | 关联的转换结果 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

**conversion_results** - 转换结果

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| title | VARCHAR | 标题 |
| raw_content | TEXT | 原始提取内容 |
| markdown_content | TEXT | Markdown 笔记 |
| summary | TEXT | AI 摘要 |
| tags | JSON | 标签 |
| source_type | ENUM | 来源类型 |
| source_url | TEXT | 来源链接 |
| metadata | JSON | 额外元数据 |
| created_at | TIMESTAMP | 创建时间 |

---

## 7. 配置与环境变量 (`.env`)

```bash
# === 应用 ===
APP_NAME=Everything2Markdown
APP_VERSION=1.0.0
DEBUG=false
SECRET_KEY=your-secret-key-here

# === 服务器 ===
HOST=0.0.0.0
PORT=8000

# === 数据库 ===
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/e2m
DATABASE_POOL_SIZE=10
DATABASE_MAX_OVERFLOW=20

# === Redis ===
REDIS_URL=redis://localhost:6379/0

# === Celery ===
CELERY_BROKER_URL=redis://localhost:6379/1
CELERY_RESULT_BACKEND=redis://localhost:6379/2

# === 文件存储 ===
STORAGE_BACKEND=local
STORAGE_LOCAL_PATH=./data/storage
# STORAGE_S3_BUCKET=my-bucket
# STORAGE_S3_REGION=us-east-1
# STORAGE_AWS_ACCESS_KEY_ID=
# STORAGE_AWS_SECRET_ACCESS_KEY=

# === OpenAI (LLM & VLM) ===
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxx
OPENAI_BASE_URL=https://api.openai.com/v1
LLM_MODEL=gpt-4o
VLM_MODEL=gpt-4o

# === Claude (备选) ===
# ANTHROPIC_API_KEY=sk-ant-xxxxxxxx
# ANTHROPIC_MODEL=claude-sonnet-4-20250514

# === ASR (语音识别) ===
ASR_PROVIDER=openai  # openai | azure | deepgram
ASR_MODEL=whisper-1
# AZURE_SPEECH_KEY=
# AZURE_SPEECH_REGION=eastus

# === 视频处理 ===
MAX_VIDEO_DURATION=3600  # 秒，最长1小时
MAX_VIDEO_SIZE_MB=500
FRAME_INTERVAL_SECONDS=10  # 帧提取间隔
YOUTUBE_COOKIES_FILE=

# === 文档处理 ===
MAX_FILE_SIZE_MB=50
SUPPORTED_EXTENSIONS=pdf,docx,pptx,xlsx,epub,html,md,txt,csv,json,xml

# === 导出 ===
EXPORT_TEMP_DIR=./data/exports
```

---

## 8. 模块详细设计

### 8.1 文档转换模块 (`core/converter/`)

基于 Microsoft MarkItDown，采用策略模式 + 工厂模式：

- **基类**: `BaseConverter` - 定义 `convert()` 抽象接口
- **具体实现**: `MarkItDownConverter` - 封装 MarkItDown 库
- **工厂**: `ConverterFactory` - 根据文件类型选择转换器
- **注册表**: `ConverterRegistry` - 管理文件类型与转换器映射

### 8.2 视频处理模块 (`core/video/`)

采用流水线架构 (Pipeline Pattern)：

1. **下载器** (`Downloader`) - 使用 yt-dlp 下载视频/音频
2. **帧提取器** (`FrameExtractor`) - 提取关键帧或等间隔帧
3. **音频提取器** (`AudioExtractor`) - ffmpeg 提取音频
4. **ASR 引擎** (`ASREngine`) - OpenAI Whisper / Azure Speech 转文字
5. **VLM 分析器** (`VLMAnalyzer`) - 分析帧图像内容
6. **流水线** (`VideoPipeline`) - 编排以上步骤

### 8.3 LLM 模块 (`core/llm/`)

- **客户端封装**: 支持 OpenAI 和 Claude API（统一接口）
- **总结器**: 生成多层级摘要 (一句话/段落/详细)
- **笔记生成器**: 生成结构化学习笔记 (标题、重点、问答、扩展)
- **Prompt 模板**: 独立管理的提示词模板

### 8.4 导出模块 (`core/export/`)

- **Markdown**: 直接输出 .md 文件
- **Word**: 使用 python-docx 转换
- **PDF**: 使用 WeasyPrint 或 markdown→pdf 转换

---

## 9. 部署方案

### 开发环境

```bash
# 后端
cd backend
poetry install
poetry run uvicorn backend.main:app --reload

# 前端
cd frontend
npm install
npm run dev
```

### Docker 部署

```bash
docker-compose up -d
```

### 生产环境注意事项

1. 使用 Gunicorn + Uvicorn worker 部署 FastAPI
2. Nginx 反向代理 + SSL 终止
3. PostgreSQL + Redis 持久化配置
4. Celery worker 单独容器部署
5. 文件存储使用 S3 (生产环境)
6. 视频处理需要 GPU 实例 (可选)

---

## 10. 安全考虑

1. **文件上传安全**: 文件类型校验、大小限制、病毒扫描
2. **API 鉴权**: JWT Token 认证 (后续迭代)
3. **速率限制**: Redis 实现 API 限流
4. **LLM 内容安全**: Prompt 注入防护、内容过滤
5. **超时控制**: 长时间任务使用 Celery 异步处理
6. **HTTPS**: 生产环境强制 HTTPS

---

## 11. 未来规划

1. **用户系统**: 注册/登录、配额管理、历史记录
2. **批量处理**: 多文件/多链接批量转换
3. **思维导图**: 自动生成思维导图
4. **多语言**: 国际化支持
5. **WebSocket**: 实时进度推送
6. **插件系统**: 第三方转换器插件
7. **知识库**: 生成内容的向量化存储与检索
