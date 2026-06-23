"""End-to-end PPTX generation pipeline with SSE event support.

Flow: parse → plan → generate SVGs (preview) → export native PPTX.
Events are persisted to {workspace}/events.jsonl for history replay.
"""

from __future__ import annotations

import asyncio
import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from sqlalchemy import select

from backend.db.session import async_session_factory
from backend.models.pptx_job import PptxJob
from backend.models.base import utcnow
from pptx_backend.services.strategist import generate_design_spec
from pptx_backend.services.executor import generate_svgs
from pptx_backend.services.exporter import export_pptx
from pptx_backend.utils.workspace import create_workspace
from pptx_backend.config import PPTX_PROJECTS_DIR

logger = logging.getLogger(__name__)

_job_events: dict[str, asyncio.Queue] = {}


def get_event_queue(job_id: str) -> asyncio.Queue:
    if job_id not in _job_events:
        _job_events[job_id] = asyncio.Queue()
    return _job_events[job_id]


def cleanup_event_queue(job_id: str):
    _job_events.pop(job_id, None)


def _log_path(job_id: str) -> Path:
    return PPTX_PROJECTS_DIR / job_id / "events.jsonl"


def load_persisted_logs(job_id: str) -> list[dict]:
    """Load persisted events from disk for history replay."""
    path = _log_path(job_id)
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


async def _emit(job_id: str, event: str, data: dict[str, Any]):
    entry = {
        "event": event,
        "data": data,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

    # Persist to file
    path = _log_path(job_id)
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "a", encoding="utf-8") as f:
        f.write(json.dumps(entry, ensure_ascii=False) + "\n")

    # Push to SSE queue
    q = _job_events.get(job_id)
    if q:
        await q.put({"event": event, "data": data})


async def _update_job(job_id: str, **kwargs):
    async with async_session_factory() as session:
        result = await session.execute(select(PptxJob).where(PptxJob.id == job_id))
        job = result.scalar_one()
        for k, v in kwargs.items():
            setattr(job, k, v)
        job.updated_at = utcnow()
        await session.commit()


async def run_pptx_pipeline(job_id: str, content: str):
    """Background task that drives the full pipeline."""
    try:
        workspace = create_workspace(job_id)
        logger.info("PPTX pipeline started for job %s", job_id)

        # Phase 1: Planning
        await _update_job(job_id, status="planning", progress=10)
        await _emit(job_id, "status", {"status": "planning", "progress": 10, "message": "正在分析内容并规划设计..."})

        async with async_session_factory() as session:
            result = await session.execute(select(PptxJob).where(PptxJob.id == job_id))
            job = result.scalar_one()

        design_spec = await generate_design_spec(
            content=content,
            canvas_format=job.canvas_format,
            page_count=job.page_count,
            style=job.style,
        )
        await _update_job(job_id, design_spec=design_spec, progress=30)
        await _emit(job_id, "status", {"status": "planning", "progress": 30, "message": "设计规格已生成"})

        # Validate page count and emit plan
        try:
            spec = json.loads(design_spec)
            pages = spec.get("pages", [])
            actual_count = len(pages)
            if actual_count != job.page_count:
                await _emit(job_id, "status", {
                    "status": "planning", "progress": 30,
                    "message": f"页数验证: 要求 {job.page_count} 页, 实际生成 {actual_count} 页 (已自动修正)",
                })
            await _emit(job_id, "plan", {
                "title": spec.get("title", ""),
                "theme": spec.get("theme", {}),
                "page_count": actual_count,
                "pages": [{"title": p.get("title", ""), "layout": p.get("layout", "")} for p in pages],
            })
        except json.JSONDecodeError:
            pass

        # Phase 2: SVG preview generation (parallel)
        await _update_job(job_id, status="generating", progress=40)
        await _emit(job_id, "status", {"status": "generating", "progress": 40, "message": "正在生成幻灯片预览..."})

        svg_dir = await generate_svgs(
            design_spec=design_spec,
            workspace=workspace,
            canvas_format=job.canvas_format,
            on_slide_done=lambda i, total: asyncio.ensure_future(
                _on_slide_generated(job_id, i, total)
            ),
        )
        await _update_job(job_id, progress=75)

        # Phase 3: Native PPTX export
        await _update_job(job_id, status="exporting", progress=80)
        await _emit(job_id, "status", {"status": "exporting", "progress": 80, "message": "正在导出原生 PPTX 文件..."})

        output_path = await export_pptx(
            svg_dir=svg_dir,
            workspace=workspace,
            canvas_format=job.canvas_format,
            design_spec=design_spec,
        )

        await _update_job(
            job_id,
            status="completed",
            progress=100,
            output_path=str(output_path),
        )
        await _emit(job_id, "status", {"status": "completed", "progress": 100, "message": "PPTX 已生成完成！"})
        await _emit(job_id, "done", {"output_path": str(output_path)})
        logger.info("PPTX pipeline completed for job %s → %s", job_id, output_path)

    except Exception as exc:
        logger.exception("PPTX pipeline failed for job %s", job_id)
        await _update_job(job_id, status="failed", error_message=str(exc)[:2000])
        await _emit(job_id, "error", {"message": str(exc)[:500]})


async def _on_slide_generated(job_id: str, slide_index: int, total: int):
    progress = 40 + int(35 * (slide_index + 1) / max(total, 1))
    await _update_job(job_id, progress=progress)
    await _emit(job_id, "slide", {
        "index": slide_index,
        "total": total,
        "progress": progress,
        "message": f"幻灯片 {slide_index + 1}/{total} 预览已生成",
    })
