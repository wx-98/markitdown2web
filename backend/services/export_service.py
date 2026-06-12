"""Export service — converts results to downloadable files."""

from __future__ import annotations

import uuid

from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession

from backend.config import settings
from backend.core.export.factory import ExporterFactory
from backend.schemas.common import ApiResponse
from backend.services.task_service import get_result

_MEDIA_TYPES = {
    ".md": "text/markdown",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".pdf": "application/pdf",
    ".html": "text/html",
}


async def do_export(db: AsyncSession, result_id: str, fmt: str) -> FileResponse | ApiResponse:
    result = await get_result(db, result_id)
    if not result:
        return ApiResponse(code=404, message="结果不存在")

    safe_title = (result.title or "notes")[:60].replace("/", "_").replace("\\", "_")
    unique = uuid.uuid4().hex[:8]

    ext_map = {"markdown": ".md", "md": ".md", "word": ".docx", "docx": ".docx", "pdf": ".pdf"}
    ext = ext_map.get(fmt.lower(), ".md")
    output_path = settings.export_dir / f"{safe_title}_{unique}{ext}"

    exporter = ExporterFactory.get_exporter(fmt)
    actual_path = exporter.export(result.markdown_content, output_path)

    return FileResponse(
        path=str(actual_path),
        filename=actual_path.name,
        media_type=_MEDIA_TYPES.get(actual_path.suffix, "application/octet-stream"),
    )


async def get_conversion_result(db: AsyncSession, result_id: str) -> ApiResponse:
    result = await get_result(db, result_id)
    if not result:
        return ApiResponse(code=404, message="结果不存在")
    return ApiResponse(
        data={
            "id": result.id,
            "title": result.title,
            "markdown_content": result.markdown_content,
            "summary": result.summary,
            "raw_content": result.raw_content,
            "source_type": result.source_type,
            "source_url": result.source_url,
            "created_at": result.created_at.isoformat() if result.created_at else None,
        }
    )
