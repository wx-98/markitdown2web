from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from backend.api.deps import get_db
from backend.schemas.common import ApiResponse
from backend.services.task_service import create_task, get_task
from backend.services.conversion_service import launch_background, run_video_pipeline
from backend.utils.file_utils import save_upload

router = APIRouter()


@router.post("/process")
async def process_video(
    file: UploadFile | None = File(None),
    url: str | None = Form(None),
    note_style: str = Form("detailed"),
    db: AsyncSession = Depends(get_db),
):
    video_url: str | None = None
    file_path: str | None = None

    if url and url.strip():
        video_url = url.strip()
    elif file and file.filename:
        content = await file.read()
        file_path = save_upload(content, file.filename)
    else:
        return ApiResponse(code=400, message="请提供视频链接或上传视频文件")

    source = video_url or (file.filename if file else "uploaded_video")
    task = await create_task(db, task_type="video", source=source)

    launch_background(
        run_video_pipeline(task.id, video_url, Path(file_path) if file_path else None, note_style)
    )
    return ApiResponse(data={"task_id": task.id})


@router.get("/status/{task_id}")
async def video_status(task_id: str, db: AsyncSession = Depends(get_db)):
    task = await get_task(db, task_id)
    if not task:
        return ApiResponse(code=404, message="任务不存在")
    return ApiResponse(
        data={
            "task_id": task.id,
            "status": task.status,
            "progress": task.progress,
            "error_message": task.error_message,
            "result_id": task.result_id,
        }
    )
