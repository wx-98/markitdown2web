"""Serve extracted images and other stored files."""

from pathlib import Path

from fastapi import APIRouter
from fastapi.responses import FileResponse

from backend.config import settings
from backend.schemas.common import ApiResponse

router = APIRouter()

_MEDIA_TYPES = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
}


@router.get("/{task_id}/{filename}")
async def serve_file(task_id: str, filename: str):
    safe_task_id = Path(task_id).name
    safe_filename = Path(filename).name
    file_path = settings.storage_dir / "images" / safe_task_id / safe_filename

    if not file_path.exists() or not file_path.is_file():
        return ApiResponse(code=404, message="文件不存在")

    media_type = _MEDIA_TYPES.get(file_path.suffix.lower(), "application/octet-stream")
    return FileResponse(str(file_path), media_type=media_type)
