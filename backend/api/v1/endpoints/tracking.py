from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from backend.api.deps import get_current_user_optional, get_db
from backend.models.user import User
from backend.schemas.tracking import TrackEventRequest
from backend.services import tracking_service

router = APIRouter(prefix="/tracking", tags=["tracking"])


@router.post("/event")
async def track_event(
    body: TrackEventRequest,
    request: Request,
    user: User | None = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    await tracking_service.record_event(
        db,
        event_type=body.event_type,
        user_id=user.id if user else None,
        event_data=body.event_data,
        ip_address=request.client.host if request.client else "",
        user_agent=request.headers.get("user-agent", ""),
        page_url=body.page_url,
        session_id=body.session_id,
    )
    return {"ok": True}
