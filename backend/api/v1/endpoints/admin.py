import os
from datetime import datetime, timedelta, timezone
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select, case, and_
from sqlalchemy.ext.asyncio import AsyncSession

from backend.api.deps import get_admin_user, get_db
from backend.config import settings
from backend.models.payment import Payment
from backend.models.subscription import Subscription
from backend.models.task import Task
from backend.models.tracking import OrderTracking, TrackingEvent
from backend.models.user import User

router = APIRouter(prefix="/admin", tags=["admin"])


# ── Dashboard ────────────────────────────────────────────

@router.get("/dashboard")
async def dashboard(
    _: User = Depends(get_admin_user), db: AsyncSession = Depends(get_db)
):
    now = datetime.now(timezone.utc)
    month_ago = now - timedelta(days=30)

    total_users = (await db.execute(select(func.count(User.id)))).scalar() or 0
    new_users_30d = (
        await db.execute(
            select(func.count(User.id)).where(User.created_at >= month_ago)
        )
    ).scalar() or 0
    active_subs = (
        await db.execute(
            select(func.count(Subscription.id)).where(Subscription.status == "active")
        )
    ).scalar() or 0
    revenue_30d = (
        await db.execute(
            select(func.coalesce(func.sum(Payment.amount_cents), 0)).where(
                Payment.status == "succeeded", Payment.paid_at >= month_ago
            )
        )
    ).scalar() or 0
    total_conversions = (await db.execute(select(func.count(Task.id)))).scalar() or 0

    return {
        "total_users": total_users,
        "new_users_30d": new_users_30d,
        "active_subscriptions": active_subs,
        "revenue_30d_cents": revenue_30d,
        "total_conversions": total_conversions,
    }


# ── Users ────────────────────────────────────────────────

@router.get("/users")
async def list_users(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    search: str = Query(""),
    _: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(User)
    if search:
        stmt = stmt.where(
            User.email.ilike(f"%{search}%") | User.nickname.ilike(f"%{search}%")
        )
    total = (
        await db.execute(select(func.count()).select_from(stmt.subquery()))
    ).scalar() or 0
    rows = (
        await db.execute(
            stmt.order_by(User.created_at.desc())
            .offset((page - 1) * size)
            .limit(size)
        )
    ).scalars().all()

    return {
        "total": total,
        "page": page,
        "size": size,
        "items": [
            {
                "id": u.id,
                "email": u.email,
                "phone": u.phone,
                "nickname": u.nickname,
                "role": u.role,
                "is_blocked": u.is_blocked,
                "subscription_plan": u.subscription_plan,
                "auth_provider": u.auth_provider,
                "created_at": u.created_at.isoformat() if u.created_at else None,
            }
            for u in rows
        ],
    }


@router.patch("/users/{user_id}/block")
async def toggle_block(
    user_id: str,
    block: bool = Query(...),
    _: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    user.is_blocked = block
    await db.commit()
    return {"id": user.id, "is_blocked": user.is_blocked}


# ── Revenue ──────────────────────────────────────────────

@router.get("/revenue")
async def revenue(
    days: int = Query(30, ge=1, le=365),
    _: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    since = datetime.now(timezone.utc) - timedelta(days=days)
    stmt = (
        select(
            func.date(Payment.paid_at).label("date"),
            func.sum(Payment.amount_cents).label("total"),
            func.count(Payment.id).label("count"),
        )
        .where(Payment.status == "succeeded", Payment.paid_at >= since)
        .group_by(func.date(Payment.paid_at))
        .order_by(func.date(Payment.paid_at))
    )
    rows = (await db.execute(stmt)).all()
    return {
        "days": days,
        "data": [
            {"date": str(r.date), "total_cents": r.total or 0, "count": r.count}
            for r in rows
        ],
    }


# ── Orders ───────────────────────────────────────────────

@router.get("/orders")
async def list_orders(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    _: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    total = (
        await db.execute(select(func.count(OrderTracking.id)))
    ).scalar() or 0
    rows = (
        await db.execute(
            select(OrderTracking)
            .order_by(OrderTracking.created_at.desc())
            .offset((page - 1) * size)
            .limit(size)
        )
    ).scalars().all()

    return {
        "total": total,
        "page": page,
        "size": size,
        "items": [
            {
                "id": o.id,
                "user_id": o.user_id,
                "user_email": o.user_email,
                "plan": o.plan,
                "amount_cents": o.amount_cents,
                "currency": o.currency,
                "provider": o.provider,
                "order_status": o.order_status,
                "order_time": o.order_time.isoformat() if o.order_time else None,
                "paid_time": o.paid_time.isoformat() if o.paid_time else None,
            }
            for o in rows
        ],
    }


# ── Tracking ─────────────────────────────────────────────

@router.get("/tracking")
async def list_tracking(
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=200),
    event_type: str = Query(""),
    _: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(TrackingEvent)
    if event_type:
        stmt = stmt.where(TrackingEvent.event_type == event_type)
    total = (
        await db.execute(select(func.count()).select_from(stmt.subquery()))
    ).scalar() or 0
    rows = (
        await db.execute(
            stmt.order_by(TrackingEvent.created_at.desc())
            .offset((page - 1) * size)
            .limit(size)
        )
    ).scalars().all()

    return {
        "total": total,
        "page": page,
        "size": size,
        "items": [
            {
                "id": e.id,
                "user_id": e.user_id,
                "event_type": e.event_type,
                "event_data": e.event_data,
                "ip_address": e.ip_address,
                "page_url": e.page_url,
                "session_id": e.session_id,
                "created_at": e.created_at.isoformat() if e.created_at else None,
            }
            for e in rows
        ],
    }


# ── Config ───────────────────────────────────────────────

_ENV_FILE = Path(".env")

_SAFE_KEYS = {
    "APP_NAME", "DEBUG", "HOST", "PORT", "DATABASE_URL",
    "STORAGE_PATH", "EXPORT_PATH",
    "USE_SHARED_API_CONFIG", "LLM_MODEL", "VLM_MODEL", "ASR_MODEL", "ASR_ENABLED",
    "MAX_VIDEO_DURATION", "MAX_VIDEO_SIZE_MB", "FRAME_INTERVAL_SECONDS", "MAX_FILE_SIZE_MB",
    "SMS_PROVIDER", "MONTHLY_PRICE_CNY", "MONTHLY_PRICE_USD",
    "STRIPE_PUBLISHABLE_KEY", "STRIPE_PRICE_ID_MONTHLY",
    "GOOGLE_CLIENT_ID", "GOOGLE_REDIRECT_URI",
}


def _read_env() -> dict[str, str]:
    if not _ENV_FILE.exists():
        return {}
    result = {}
    for line in _ENV_FILE.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        if "=" in line:
            k, v = line.split("=", 1)
            result[k.strip()] = v.strip()
    return result


@router.get("/config")
async def get_config(_: User = Depends(get_admin_user)):
    env = _read_env()
    safe = {k: v for k, v in env.items() if k in _SAFE_KEYS}
    masked = {k: "****" for k in env if k not in _SAFE_KEYS and k in env}
    return {"config": {**safe, **masked}}


@router.patch("/config")
async def update_config(
    body: dict, _: User = Depends(get_admin_user)
):
    if not _ENV_FILE.exists():
        raise HTTPException(status.HTTP_404_NOT_FOUND, ".env file not found")

    env = _read_env()
    updated_keys = []
    for key, value in body.items():
        if key not in _SAFE_KEYS:
            continue
        env[key] = str(value)
        updated_keys.append(key)

    lines = [f"{k}={v}" for k, v in env.items()]
    _ENV_FILE.write_text("\n".join(lines) + "\n", encoding="utf-8")

    return {"updated": updated_keys}
