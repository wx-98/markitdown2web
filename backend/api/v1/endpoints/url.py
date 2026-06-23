from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from backend.api.deps import get_db
from backend.schemas.common import ApiResponse
from backend.schemas.url import UrlProcessRequest
from backend.services.task_service import create_task, get_task
from backend.services.conversion_service import get_task_event_queue, launch_background, run_url_pipeline

router = APIRouter()


@router.post("/process")
async def process_url(body: UrlProcessRequest, db: AsyncSession = Depends(get_db)):
    task = await create_task(db, task_type="url", source=body.url)
    get_task_event_queue(task.id)
    launch_background(run_url_pipeline(task.id, body.url, body.note_style))
    return ApiResponse(data={"task_id": task.id})


@router.get("/status/{task_id}")
async def url_status(task_id: str, db: AsyncSession = Depends(get_db)):
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
