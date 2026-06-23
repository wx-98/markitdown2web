import asyncio
import json

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sse_starlette.sse import EventSourceResponse

from backend.api.deps import get_db
from backend.models.task import Task
from backend.schemas.common import ApiResponse
from backend.schemas.task import TaskOut
from backend.services.task_service import get_task, list_tasks
from backend.services.conversion_service import (
    get_task_event_queue,
    cleanup_task_event_queue,
    load_task_logs,
)

router = APIRouter()


@router.get("/active")
async def get_active_tasks(db: AsyncSession = Depends(get_db)):
    """Return all pending/processing tasks for the current user (cross-device sync)."""
    stmt = (
        select(Task)
        .where(Task.status.in_(["pending", "processing"]))
        .order_by(Task.created_at.desc())
        .limit(20)
    )
    result = await db.execute(stmt)
    tasks = result.scalars().all()
    return ApiResponse(data=[TaskOut.model_validate(t).model_dump() for t in tasks])


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


@router.get("/{task_id}/logs")
async def get_task_logs(task_id: str):
    """Return persisted event logs for a task."""
    return load_task_logs(task_id)


@router.get("/{task_id}/stream")
async def task_stream(task_id: str, db: AsyncSession = Depends(get_db)):
    """SSE endpoint — replays persisted logs for completed tasks, streams live for active."""
    task = await get_task(db, task_id)

    if task and task.status in ("completed", "failed"):
        async def _replay():
            saved = load_task_logs(task_id)
            for entry in saved:
                yield {"event": entry["event"], "data": json.dumps(entry["data"], ensure_ascii=False)}
            if not saved:
                yield {"event": "progress", "data": json.dumps({
                    "progress": task.progress,
                    "message": "已完成" if task.status == "completed" else "处理失败",
                })}
            if task.status == "completed" and task.result_id:
                yield {"event": "done", "data": json.dumps({"result_id": task.result_id, "title": ""})}
            elif task.status == "failed":
                yield {"event": "error", "data": json.dumps({"message": task.error_message or "未知错误"})}
        return EventSourceResponse(_replay())

    q = get_task_event_queue(task_id)

    async def _gen():
        try:
            while True:
                try:
                    msg = await asyncio.wait_for(q.get(), timeout=300)
                except asyncio.TimeoutError:
                    yield {"event": "ping", "data": "{}"}
                    continue
                event_name = msg.get("event", "message")
                yield {"event": event_name, "data": json.dumps(msg.get("data", {}), ensure_ascii=False)}
                if event_name in ("done", "error"):
                    break
        finally:
            cleanup_task_event_queue(task_id)

    return EventSourceResponse(_gen())
