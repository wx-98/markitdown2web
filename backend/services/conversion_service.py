"""Background conversion pipelines for video / URL / document.

Each pipeline emits SSE events via an in-memory asyncio.Queue keyed by task_id.
Events are also persisted to data/task_logs/{task_id}.jsonl for history replay.
"""

from __future__ import annotations

import asyncio
import json
import logging
import traceback
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from backend.db.session import async_session_factory
from backend.services.task_service import save_result, update_task

logger = logging.getLogger(__name__)

_TASK_LOG_DIR = Path("data/task_logs")
_TASK_LOG_DIR.mkdir(parents=True, exist_ok=True)

# --------------- SSE event infrastructure ---------------

_task_events: dict[str, asyncio.Queue] = {}


def get_task_event_queue(task_id: str) -> asyncio.Queue:
    if task_id not in _task_events:
        _task_events[task_id] = asyncio.Queue()
    return _task_events[task_id]


def cleanup_task_event_queue(task_id: str):
    _task_events.pop(task_id, None)


def load_task_logs(task_id: str) -> list[dict]:
    path = _TASK_LOG_DIR / f"{task_id}.jsonl"
    if not path.exists():
        return []
    entries = []
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line:
            try:
                entries.append(json.loads(line))
            except json.JSONDecodeError:
                pass
    return entries


async def _emit(task_id: str, event: str, data: dict[str, Any]):
    # Persist to file (skip high-frequency token events)
    if event != "token":
        entry = {"event": event, "data": data, "timestamp": datetime.now(timezone.utc).isoformat()}
        path = _TASK_LOG_DIR / f"{task_id}.jsonl"
        with open(path, "a", encoding="utf-8") as f:
            f.write(json.dumps(entry, ensure_ascii=False) + "\n")

    q = _task_events.get(task_id)
    if q:
        await q.put({"event": event, "data": data})


async def _emit_progress(task_id: str, progress: int, message: str):
    await update_task(task_id, progress=progress)
    await _emit(task_id, "progress", {"progress": progress, "message": message})


async def _emit_log(task_id: str, message: str):
    await _emit(task_id, "log", {"message": message})


async def _emit_token(task_id: str, token: str):
    await _emit(task_id, "token", {"token": token})


def launch_background(coro) -> None:
    """Fire-and-forget an async coroutine in the running event loop."""
    asyncio.create_task(coro)


# --------------- Video pipeline ---------------

async def run_video_pipeline(
    task_id: str, url: str | None, file_path: Path | None, style: str
) -> None:
    from backend.core.llm.summarizer import generate_title, summarize_content_stream
    from backend.core.video.pipeline import process_video

    try:
        await update_task(task_id, status="processing", progress=5)
        await _emit(task_id, "status", {"status": "processing"})

        async def _progress(pct: int, msg: str):
            await _emit_progress(task_id, pct, msg)

        await _emit_log(task_id, "开始处理视频…")
        result = await process_video(url=url, file_path=file_path, progress_callback=_progress)

        raw = ""
        has_transcript = bool(result["transcript"])
        has_frame_analysis = bool(result["frame_analysis"])

        if has_transcript:
            raw += "## 语音转录\n\n" + result["transcript"] + "\n\n"
        if has_frame_analysis:
            raw += "## 视频帧分析\n\n" + result["frame_analysis"]

        if not raw.strip():
            raise RuntimeError("视频处理未能产出任何内容（ASR 和 VLM 均未返回结果）")

        extra_context = ""
        if not has_transcript:
            extra_context = (
                "注意：本视频无语音转录文本（ASR 未启用或失败），"
                "内容完全基于视频帧的视觉分析。请基于帧分析内容整理笔记。"
            )

        await _emit_progress(task_id, 85, "AI 正在生成学习笔记…")
        await _emit_log(task_id, "AI 正在生成学习笔记（流式输出）…")

        async def _on_token(tok: str):
            await _emit_token(task_id, tok)

        md = await summarize_content_stream(
            raw, style=style, source_type="video",
            extra_context=extra_context, on_token=_on_token,
        )
        await _emit_log(task_id, "正在生成标题…")
        title = await generate_title(md)

        await _emit_progress(task_id, 95, "正在保存结果…")
        async with async_session_factory() as db:
            cr = await save_result(
                db,
                task_id=task_id,
                title=title,
                raw_content=raw,
                markdown_content=md,
                summary=md[:500],
                source_type="video",
                source_url=url or str(file_path or ""),
            )
        await _emit(task_id, "done", {"result_id": cr.id, "title": title})
    except Exception:
        logger.exception("Video pipeline failed for task %s", task_id)
        err = traceback.format_exc()[:2000]
        await update_task(task_id, status="failed", error_message=err)
        await _emit(task_id, "error", {"message": err})


# --------------- URL pipeline ---------------

async def run_url_pipeline(task_id: str, url: str, style: str) -> None:
    from backend.core.llm.summarizer import generate_title, summarize_content_stream
    from backend.core.web.scraper import scrape_url

    try:
        await update_task(task_id, status="processing", progress=10)
        await _emit(task_id, "status", {"status": "processing"})
        await _emit_log(task_id, f"正在抓取网页: {url}")

        page = await scrape_url(url)
        raw = page["text"]
        page_title = page["title"]

        await _emit_progress(task_id, 40, f"网页抓取完成: {page_title}")
        await _emit_log(task_id, f"网页抓取完成，共 {len(raw)} 字符")

        await _emit_progress(task_id, 50, "AI 正在生成学习笔记…")
        await _emit_log(task_id, "AI 正在生成学习笔记（流式输出）…")

        async def _on_token(tok: str):
            await _emit_token(task_id, tok)

        md = await summarize_content_stream(
            raw, style=style, source_type="webpage",
            extra_context=f"网页标题: {page_title}", on_token=_on_token,
        )
        title = page_title or await generate_title(md)

        await _emit_progress(task_id, 95, "正在保存结果…")
        async with async_session_factory() as db:
            cr = await save_result(
                db,
                task_id=task_id,
                title=title,
                raw_content=raw,
                markdown_content=md,
                summary=md[:500],
                source_type="url",
                source_url=url,
            )
        await _emit(task_id, "done", {"result_id": cr.id, "title": title})
    except Exception:
        logger.exception("URL pipeline failed for task %s", task_id)
        err = traceback.format_exc()[:2000]
        await update_task(task_id, status="failed", error_message=err)
        await _emit(task_id, "error", {"message": err})


# --------------- Document pipeline ---------------

async def run_document_pipeline(
    task_id: str,
    file_path: Path,
    original_name: str,
    style: str,
    *,
    use_vlm: bool = False,
) -> None:
    from backend.core.converter.factory import ConverterFactory
    from backend.core.llm.summarizer import generate_title, summarize_content_stream

    try:
        await update_task(task_id, status="processing", progress=10)
        await _emit(task_id, "status", {"status": "processing"})
        await _emit_log(task_id, f"正在解析文档: {original_name}")

        converter = ConverterFactory.get_converter(
            original_name, use_vlm=use_vlm, task_id=task_id
        )
        raw = await converter.convert(file_path)

        await _emit_progress(task_id, 40, "文档解析完成")
        await _emit_log(task_id, f"文档解析完成，共 {len(raw)} 字符")

        extra = f"文件名: {original_name}"
        if use_vlm:
            extra += "\n此文档通过 VLM 逐页分析提取，内容中可能包含图片引用，请保留。"

        await _emit_progress(task_id, 50, "AI 正在生成学习笔记…")
        await _emit_log(task_id, "AI 正在生成学习笔记（流式输出）…")

        async def _on_token(tok: str):
            await _emit_token(task_id, tok)

        md = await summarize_content_stream(
            raw, style=style, source_type="document",
            extra_context=extra, on_token=_on_token,
        )
        title = await generate_title(md)

        await _emit_progress(task_id, 95, "正在保存结果…")
        async with async_session_factory() as db:
            cr = await save_result(
                db,
                task_id=task_id,
                title=title,
                raw_content=raw,
                markdown_content=md,
                summary=md[:500],
                source_type="document",
                source_url=original_name,
            )
        await _emit(task_id, "done", {"result_id": cr.id, "title": title})
    except Exception:
        logger.exception("Document pipeline failed for task %s", task_id)
        err = traceback.format_exc()[:2000]
        await update_task(task_id, status="failed", error_message=err)
        await _emit(task_id, "error", {"message": err})
