# Everything to Markdown (E2M)

AI 驱动的一站式内容转写与学习笔记生成平台。将视频、网页、文档智能转化为结构化 Markdown 学习笔记。

## 功能

- **视频转笔记** — YouTube/Bilibili 链接或本地视频 → 帧提取 + ASR 语音识别 + VLM 分析 → LLM 生成学习笔记
- **URL 转笔记** — 任意网页链接 → 内容抓取清洗 → LLM 总结
- **文档转笔记** — PDF / Word / PPT / Excel 等 → MarkItDown 转换 → LLM 总结
- **智能导出** — Markdown / Word / PDF 多格式导出

## 技术栈

| 层级 | 技术 |
|------|------|
| 后端 | Python 3.11+, FastAPI, SQLAlchemy, SQLite |
| AI | OpenAI API (GPT-4o / Whisper), MarkItDown |
| 前端 | React 18, TypeScript, Vite, Tailwind CSS |
| 部署 | Docker, Docker Compose, Nginx |

## 快速开始

### 1. 环境准备

```bash
# 克隆项目
git clone <repo-url>
cd everything2markdown

# 配置环境变量
cp .env.example .env
# 编辑 .env 填入你的 OpenAI API Key
```

### 2. 启动后端

```bash
python -m venv .venv
# Windows
.venv\Scripts\activate
# Linux/Mac
source .venv/bin/activate

pip install -e .
uvicorn backend.main:app --reload --port 8000
```

### 3. 启动前端

```bash
cd frontend
npm install
npm run dev
```

### 4. Docker 部署

```bash
docker-compose up -d
```

访问 http://localhost:3000 开始使用。

## 系统要求

- Python ≥ 3.11
- Node.js ≥ 18
- FFmpeg（视频处理需要）
- OpenAI API Key

## 许可证

MIT
