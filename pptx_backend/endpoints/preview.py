"""Optional preview endpoint (placeholder for future use)."""

from __future__ import annotations

from fastapi import APIRouter

router = APIRouter()


@router.get("/preview/{job_id}")
async def preview_job(job_id: str):
    return {"message": "Preview not yet implemented", "job_id": job_id}
