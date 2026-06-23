"""PPTX job CRUD + SSE streaming + SVG preview endpoints."""

from __future__ import annotations

import asyncio
import json
import logging
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse, Response
from sse_starlette.sse import EventSourceResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.db.session import get_db
from backend.models.pptx_job import PptxJob
from backend.models.base import new_id, utcnow
from pptx_backend.schemas import PptxJobOut
from pptx_backend.services.pipeline import run_pptx_pipeline, get_event_queue, cleanup_event_queue, load_persisted_logs
from pptx_backend.config import PPTX_PROJECTS_DIR

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/jobs", response_model=PptxJobOut, status_code=201)
async def create_job(
    db: AsyncSession = Depends(get_db),
    content: str = Form(""),
    source_type: str = Form("text"),
    source_name: str = Form(""),
    canvas_format: str = Form("ppt169"),
    style: str = Form("professional"),
    page_count: int = Form(10),
    file: UploadFile | None = File(None),
):
    if file and source_type == "file":
        source_name = source_name or file.filename or "upload.pdf"
        file_bytes = await file.read()
        workspace = PPTX_PROJECTS_DIR / new_id()
        workspace.mkdir(parents=True, exist_ok=True)
        input_path = workspace / source_name
        input_path.write_bytes(file_bytes)
        content = str(input_path)

    job = PptxJob(
        id=new_id(),
        status="pending",
        progress=0,
        source_type=source_type,
        source_name=source_name,
        canvas_format=canvas_format,
        style=style,
        page_count=page_count,
        created_at=utcnow(),
        updated_at=utcnow(),
    )
    db.add(job)
    await db.commit()
    await db.refresh(job)

    get_event_queue(job.id)
    asyncio.create_task(run_pptx_pipeline(job.id, content))

    return job


# --- Static / list routes MUST come before parameterised /jobs/{job_id} ---

@router.get("/jobs/active", response_model=list[PptxJobOut])
async def list_active_jobs(db: AsyncSession = Depends(get_db)):
    """Return all pending/in-progress PPTX jobs for cross-device sync."""
    result = await db.execute(
        select(PptxJob)
        .where(PptxJob.status.in_(["pending", "planning", "generating", "exporting"]))
        .order_by(PptxJob.created_at.desc())
        .limit(20)
    )
    return result.scalars().all()


@router.get("/jobs", response_model=list[PptxJobOut])
async def list_jobs(
    skip: int = 0,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(PptxJob).order_by(PptxJob.created_at.desc()).offset(skip).limit(limit)
    )
    return result.scalars().all()


# --- Parameterised routes ---

@router.get("/jobs/{job_id}/stream")
async def stream_job(job_id: str, db: AsyncSession = Depends(get_db)):
    """SSE endpoint: streams real-time generation progress events."""
    result = await db.execute(select(PptxJob).where(PptxJob.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if job.status in ("completed", "failed"):
        async def _immediate():
            saved = load_persisted_logs(job_id)
            for entry in saved:
                yield {"event": entry["event"], "data": json.dumps(entry["data"], ensure_ascii=False)}
            if not saved:
                yield {"event": "status", "data": json.dumps({
                    "status": job.status,
                    "progress": job.progress,
                    "message": "已完成" if job.status == "completed" else job.error_message or "失败",
                })}
                if job.status == "completed":
                    yield {"event": "done", "data": json.dumps({"output_path": job.output_path or ""})}
        return EventSourceResponse(_immediate())

    queue = get_event_queue(job_id)

    async def _event_generator():
        try:
            while True:
                try:
                    evt = await asyncio.wait_for(queue.get(), timeout=60)
                except asyncio.TimeoutError:
                    yield {"event": "ping", "data": "{}"}
                    continue

                yield {"event": evt["event"], "data": json.dumps(evt["data"], ensure_ascii=False)}

                if evt["event"] in ("done", "error"):
                    break
        finally:
            cleanup_event_queue(job_id)

    return EventSourceResponse(_event_generator())


@router.get("/jobs/{job_id}", response_model=PptxJobOut)
async def get_job(job_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(PptxJob).where(PptxJob.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@router.get("/jobs/{job_id}/logs")
async def get_job_logs(job_id: str):
    """Return persisted event logs for a job."""
    return load_persisted_logs(job_id)


@router.get("/jobs/{job_id}/slides")
async def list_slides(job_id: str):
    """List generated SVG slide previews for a job."""
    svg_dir = PPTX_PROJECTS_DIR / job_id / "svgs"
    if not svg_dir.exists():
        return []
    svgs = sorted(svg_dir.glob("*.svg"))
    return [{"index": i, "name": f.name, "url": f"/api/v1/pptx/jobs/{job_id}/slides/{i}"} for i, f in enumerate(svgs)]


@router.get("/jobs/{job_id}/slides/{slide_index}")
async def get_slide_svg(job_id: str, slide_index: int):
    """Return a single SVG slide for preview."""
    svg_dir = PPTX_PROJECTS_DIR / job_id / "svgs"
    svgs = sorted(svg_dir.glob("*.svg")) if svg_dir.exists() else []
    if slide_index < 0 or slide_index >= len(svgs):
        raise HTTPException(status_code=404, detail="Slide not found")
    svg_content = svgs[slide_index].read_text(encoding="utf-8")
    return Response(content=svg_content, media_type="image/svg+xml")


@router.get("/jobs/{job_id}/download")
async def download_job(job_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(PptxJob).where(PptxJob.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.status != "completed" or not job.output_path:
        raise HTTPException(status_code=400, detail="PPTX not ready")
    output = Path(job.output_path)
    if not output.exists():
        raise HTTPException(status_code=404, detail="File not found on disk")
    filename = job.source_name.rsplit(".", 1)[0] + ".pptx" if job.source_name else "output.pptx"
    return FileResponse(output, filename=filename, media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation")
