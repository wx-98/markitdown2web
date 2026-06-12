"""Background conversion pipelines for video / URL / document."""

from __future__ import annotations

import asyncio
import logging
import traceback
from pathlib import Path

from backend.db.session import async_session_factory
from backend.services.task_service import save_result, update_task

logger = logging.getLogger(__name__)


def launch_background(coro) -> None:
    """Fire-and-forget an async coroutine in the running event loop."""
    asyncio.create_task(coro)


# ---------- Video pipeline ----------

async def run_video_pipeline(
    task_id: str, url: str | None, file_path: Path | None, style: str
) -> None:
    from backend.core.llm.summarizer import generate_title, summarize_content
    from backend.core.video.pipeline import process_video

    try:
        await update_task(task_id, status="processing", progress=5)

        async def _progress(pct: int, msg: str):
            await update_task(task_id, progress=pct)

        result = await process_video(url=url, file_path=file_path, progress_callback=_progress)

        raw = ""
        if result["transcript"]:
            raw += "## 语音转录\n\n" + result["transcript"] + "\n\n"
        if result["frame_analysis"]:
            raw += "## 视频帧分析\n\n" + result["frame_analysis"]

        await update_task(task_id, progress=90)
        md = await summarize_content(raw, style=style, source_type="video")
        title = await generate_title(md)

        async with async_session_factory() as db:
            await save_result(
                db,
                task_id=task_id,
                title=title,
                raw_content=raw,
                markdown_content=md,
                summary=md[:500],
                source_type="video",
                source_url=url or str(file_path or ""),
            )
    except Exception:
        logger.exception("Video pipeline failed for task %s", task_id)
        await update_task(
            task_id, status="failed", error_message=traceback.format_exc()[:2000]
        )


# ---------- URL pipeline ----------

async def run_url_pipeline(task_id: str, url: str, style: str) -> None:
    from backend.core.llm.summarizer import generate_title, summarize_content
    from backend.core.web.scraper import scrape_url

    try:
        await update_task(task_id, status="processing", progress=10)

        page = await scrape_url(url)
        raw = page["text"]
        page_title = page["title"]

        await update_task(task_id, progress=50)
        md = await summarize_content(
            raw, style=style, source_type="webpage",
            extra_context=f"网页标题: {page_title}",
        )
        title = page_title or await generate_title(md)

        await update_task(task_id, progress=90)
        async with async_session_factory() as db:
            await save_result(
                db,
                task_id=task_id,
                title=title,
                raw_content=raw,
                markdown_content=md,
                summary=md[:500],
                source_type="url",
                source_url=url,
            )
    except Exception:
        logger.exception("URL pipeline failed for task %s", task_id)
        await update_task(
            task_id, status="failed", error_message=traceback.format_exc()[:2000]
        )


# ---------- Document pipeline ----------

async def run_document_pipeline(
    task_id: str, file_path: Path, original_name: str, style: str
) -> None:
    from backend.core.converter.factory import ConverterFactory
    from backend.core.llm.summarizer import generate_title, summarize_content

    try:
        await update_task(task_id, status="processing", progress=10)

        converter = ConverterFactory.get_converter(original_name)
        raw = await converter.convert(file_path)

        await update_task(task_id, progress=50)
        md = await summarize_content(
            raw, style=style, source_type="document",
            extra_context=f"文件名: {original_name}",
        )
        title = await generate_title(md)

        await update_task(task_id, progress=90)
        async with async_session_factory() as db:
            await save_result(
                db,
                task_id=task_id,
                title=title,
                raw_content=raw,
                markdown_content=md,
                summary=md[:500],
                source_type="document",
                source_url=original_name,
            )
    except Exception:
        logger.exception("Document pipeline failed for task %s", task_id)
        await update_task(
            task_id, status="failed", error_message=traceback.format_exc()[:2000]
        )
