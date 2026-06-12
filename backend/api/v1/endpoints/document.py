from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from backend.api.deps import get_db
from backend.schemas.common import ApiResponse
from backend.services.task_service import create_task, get_task
from backend.services.conversion_service import launch_background, run_document_pipeline
from backend.utils.file_utils import save_upload

router = APIRouter()


@router.post("/convert")
async def convert_document(
    file: UploadFile = File(...),
    note_style: str = Form("detailed"),
    db: AsyncSession = Depends(get_db),
):
    if not file.filename:
        return ApiResponse(code=400, message="请上传文件")

    content = await file.read()
    file_path = save_upload(content, file.filename)

    task = await create_task(db, task_type="document", source=file.filename)
    launch_background(
        run_document_pipeline(task.id, Path(file_path), file.filename, note_style)
    )
    return ApiResponse(data={"task_id": task.id})


@router.get("/status/{task_id}")
async def document_status(task_id: str, db: AsyncSession = Depends(get_db)):
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
