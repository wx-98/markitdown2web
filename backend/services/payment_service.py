from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.config import settings
from backend.core.payment import stripe_client, wechat_client, alipay_client
from backend.models.base import new_id
from backend.models.payment import Payment
from backend.models.subscription import Subscription
from backend.models.tracking import OrderTracking
from backend.models.user import User


async def create_checkout(
    db: AsyncSession,
    user: User,
    provider: str,
    success_url: str = "",
    cancel_url: str = "",
    ip_address: str = "",
    user_agent: str = "",
) -> dict:
    is_cny = provider in ("wechat", "alipay")
    amount = settings.MONTHLY_PRICE_CNY if is_cny else settings.MONTHLY_PRICE_USD
    currency = "CNY" if is_cny else "USD"

    payment = Payment(
        id=new_id(),
        user_id=user.id,
        amount_cents=amount,
        currency=currency,
        provider=provider,
        status="pending",
    )
    db.add(payment)

    order = OrderTracking(
        user_id=user.id,
        user_email=user.email or "",
        payment_id=payment.id,
        plan="monthly",
        amount_cents=amount,
        currency=currency,
        provider=provider,
        order_status="pending",
        ip_address=ip_address,
        user_agent=user_agent,
    )
    db.add(order)
    await db.commit()

    result: dict = {"payment_id": payment.id}

    if provider == "stripe":
        session = await stripe_client.create_checkout_session(
            user.id, user.email or "", success_url, cancel_url
        )
        result.update(session)
    elif provider == "wechat":
        wechat = await wechat_client.create_native_order(
            payment.id, amount, "E2M Monthly Subscription"
        )
        result.update(wechat)
    elif provider == "alipay":
        amount_yuan = f"{amount / 100:.2f}"
        pay_url = alipay_client.create_page_pay_url(
            payment.id, amount_yuan, "E2M Monthly Subscription", success_url
        )
        result["url"] = pay_url

    return result


async def handle_payment_success(
    db: AsyncSession, payment_id: str, external_id: str = ""
) -> None:
    stmt = select(Payment).where(Payment.id == payment_id)
    result = await db.execute(stmt)
    payment = result.scalar_one_or_none()
    if not payment or payment.status == "succeeded":
        return

    now = datetime.now(timezone.utc)
    payment.status = "succeeded"
    payment.external_payment_id = external_id
    payment.paid_at = now

    sub = Subscription(
        id=new_id(),
        user_id=payment.user_id,
        plan="monthly",
        status="active",
        payment_provider=payment.provider,
        external_subscription_id=external_id,
        current_period_start=now,
        current_period_end=now + timedelta(days=30),
    )
    db.add(sub)
    payment.subscription_id = sub.id

    user_stmt = select(User).where(User.id == payment.user_id)
    user_result = await db.execute(user_stmt)
    user = user_result.scalar_one_or_none()
    if user:
        user.subscription_plan = "monthly"
        user.subscription_expires_at = now + timedelta(days=30)

    # Update order tracking
    ot_stmt = select(OrderTracking).where(OrderTracking.payment_id == payment_id)
    ot_result = await db.execute(ot_stmt)
    ot = ot_result.scalar_one_or_none()
    if ot:
        ot.order_status = "succeeded"
        ot.paid_time = now

    await db.commit()


async def get_subscription(db: AsyncSession, user_id: str) -> dict:
    stmt = (
        select(Subscription)
        .where(Subscription.user_id == user_id, Subscription.status == "active")
        .order_by(Subscription.created_at.desc())
        .limit(1)
    )
    result = await db.execute(stmt)
    sub = result.scalar_one_or_none()
    if not sub:
        return {"plan": "free", "status": "none"}
    return {
        "id": sub.id,
        "plan": sub.plan,
        "status": sub.status,
        "provider": sub.payment_provider,
        "current_period_start": sub.current_period_start.isoformat() if sub.current_period_start else None,
        "current_period_end": sub.current_period_end.isoformat() if sub.current_period_end else None,
    }


async def cancel_subscription(db: AsyncSession, user_id: str) -> bool:
    stmt = (
        select(Subscription)
        .where(Subscription.user_id == user_id, Subscription.status == "active")
        .order_by(Subscription.created_at.desc())
        .limit(1)
    )
    result = await db.execute(stmt)
    sub = result.scalar_one_or_none()
    if not sub:
        return False

    sub.status = "cancelled"
    await db.commit()
    return True
