"""End-to-end PPTX generation pipeline: parse → plan → generate SVGs → export."""

from __future__ import annotations

import logging

from sqlalchemy import select

from backend.db.session import async_session_factory
from backend.models.pptx_job import PptxJob
from backend.models.base import utcnow
from pptx_backend.services.strategist import generate_design_spec
from pptx_backend.services.executor import generate_svgs
from pptx_backend.services.exporter import export_pptx
from pptx_backend.utils.workspace import create_workspace, get_workspace

logger = logging.getLogger(__name__)


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

        # Phase 2: SVG generation
        await _update_job(job_id, status="generating", progress=40)
        svg_dir = await generate_svgs(
            design_spec=design_spec,
            workspace=workspace,
            canvas_format=job.canvas_format,
        )
        await _update_job(job_id, progress=70)

        # Phase 3: Export
        await _update_job(job_id, status="exporting", progress=80)
        output_path = await export_pptx(
            svg_dir=svg_dir,
            workspace=workspace,
            canvas_format=job.canvas_format,
        )
        await _update_job(
            job_id,
            status="completed",
            progress=100,
            output_path=str(output_path),
        )
        logger.info("PPTX pipeline completed for job %s → %s", job_id, output_path)

    except Exception as exc:
        logger.exception("PPTX pipeline failed for job %s", job_id)
        await _update_job(
            job_id,
            status="failed",
            error_message=str(exc)[:2000],
        )
