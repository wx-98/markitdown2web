# MarkItDown Web

A modern web interface for [Microsoft MarkItDown](https://github.com/microsoft/markitdown) — convert 20+ document formats to Markdown in your browser.

## Features

- **File Upload** — drag & drop or click to upload PDF, DOCX, PPTX, XLSX, HTML, CSV, JSON, images, audio, and more
- **URL Conversion** — paste a URL to convert web pages, Wikipedia articles, YouTube transcripts, etc.
- **Markdown Preview** — live rendered preview with toggle to view raw Markdown source
- **Copy to Clipboard** — one-click copy of the converted Markdown

## Tech Stack

| Layer    | Technology                    |
| -------- | ----------------------------- |
| Frontend | React 19 · TypeScript · Vite · Tailwind CSS |
| Backend  | Python · FastAPI · Uvicorn    |
| Engine   | Microsoft MarkItDown          |

## Quick Start

### Prerequisites

- Python 3.12+
- Node.js 22+

### Backend

```bash
cd server
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Server runs at `http://localhost:8000`. API docs at `http://localhost:8000/api/v1/openapi.json`.

### Frontend

```bash
cd client
npm install
npm run dev
```

App runs at `http://localhost:5173`.

### Docker

```bash
docker compose up --build
```

## Project Structure

```
markitdown2web/
├── server/                    # Backend (FastAPI)
│   ├── app/
│   │   ├── api/v1/endpoints/  # Route handlers
│   │   ├── core/              # Config & error classes
│   │   ├── schemas/           # Pydantic models
│   │   └── services/          # Business logic
│   ├── requirements.txt
│   └── Dockerfile
├── client/                    # Frontend (React + Vite)
│   ├── src/
│   │   ├── api/               # HTTP client
│   │   ├── components/        # Reusable UI components
│   │   ├── hooks/             # Custom React hooks
│   │   ├── pages/             # Page-level components
│   │   └── types/             # TypeScript interfaces
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

## License

MIT
