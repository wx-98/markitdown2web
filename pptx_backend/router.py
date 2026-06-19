"""PPTX module router aggregation."""

from fastapi import APIRouter

from pptx_backend.endpoints import jobs, preview

pptx_router = APIRouter()
pptx_router.include_router(jobs.router, tags=["pptx-jobs"])
pptx_router.include_router(preview.router, tags=["pptx-preview"])
