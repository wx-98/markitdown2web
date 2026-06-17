from sqlalchemy.ext.asyncio import AsyncSession

from backend.models.tracking import TrackingEvent


async def record_event(
    db: AsyncSession,
    *,
    event_type: str,
    user_id: str | None = None,
    event_data: dict | None = None,
    ip_address: str = "",
    user_agent: str = "",
    page_url: str = "",
    session_id: str = "",
) -> None:
    event = TrackingEvent(
        user_id=user_id,
        event_type=event_type,
        event_data=event_data,
        ip_address=ip_address,
        user_agent=user_agent,
        page_url=page_url,
        session_id=session_id,
    )
    db.add(event)
    await db.commit()
