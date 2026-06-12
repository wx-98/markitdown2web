"""Task CRUD operations — create, read, update, list."""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.db.session import async_session_factory
from backend.models.conversion_result import ConversionResult
from backend.models.task import Task


async def create_task(db: AsyncSession, *, task_type: str, source: str) -> Task:
    task = Task(type=task_type, source=source)
    db.add(task)
    await db.commit()
    await db.refresh(task)
    return task


async def get_task(db: AsyncSession, task_id: str) -> Task | None:
    return await db.get(Task, task_id)


async def list_tasks(db: AsyncSession, *, limit: int = 50, offset: int = 0) -> list[Task]:
    stmt = select(Task).order_by(Task.created_at.desc()).limit(limit).offset(offset)
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def save_result(
    db: AsyncSession,
    *,
    task_id: str,
    title: str,
    raw_content: str,
    markdown_content: str,
    summary: str,
    source_type: str,
    source_url: str,
) -> ConversionResult:
    cr = ConversionResult(
        title=title,
        raw_content=raw_content,
        markdown_content=markdown_content,
        summary=summary,
        source_type=source_type,
        source_url=source_url,
    )
    db.add(cr)

    task = await db.get(Task, task_id)
    if task:
        task.result_id = cr.id
        task.status = "completed"
        task.progress = 100
    await db.commit()
    await db.refresh(cr)
    return cr


async def get_result(db: AsyncSession, result_id: str) -> ConversionResult | None:
    return await db.get(ConversionResult, result_id)


async def update_task(task_id: str, **fields) -> None:
    """Update task fields from a background coroutine (uses its own session)."""
    async with async_session_factory() as db:
        task = await db.get(Task, task_id)
        if task:
            for k, v in fields.items():
                setattr(task, k, v)
            await db.commit()
