"""PPTX job CRUD endpoints."""

from __future__ import annotations

import asyncio
import logging
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.db.session import get_db
from backend.models.pptx_job import PptxJob
from backend.models.base import new_id, utcnow
from pptx_backend.schemas import PptxJobCreate, PptxJobOut
from pptx_backend.services.pipeline import run_pptx_pipeline
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

    asyncio.create_task(run_pptx_pipeline(job.id, content))

    return job


@router.get("/jobs/{job_id}", response_model=PptxJobOut)
async def get_job(job_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(PptxJob).where(PptxJob.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


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
