from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from backend.api.deps import get_db
from backend.schemas.common import ApiResponse
from backend.schemas.task import TaskOut
from backend.services.task_service import get_task, list_tasks

router = APIRouter()


@router.get("")
async def get_tasks(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    tasks = await list_tasks(db, limit=limit, offset=offset)
    return ApiResponse(data=[TaskOut.model_validate(t).model_dump() for t in tasks])


@router.get("/{task_id}")
async def get_task_detail(task_id: str, db: AsyncSession = Depends(get_db)):
    task = await get_task(db, task_id)
    if not task:
        return ApiResponse(code=404, message="任务不存在")
    return ApiResponse(data=TaskOut.model_validate(task).model_dump())
