from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from backend.api.deps import get_current_user, get_db
from backend.config import settings
from backend.core.payment import stripe_client, wechat_client, alipay_client
from backend.models.user import User
from backend.schemas.payment import CheckoutRequest, PlanInfo
from backend.services import payment_service

router = APIRouter(prefix="/payment", tags=["payment"])


@router.get("/plans")
async def get_plans():
    return {
        "plans": [
            PlanInfo(
                name="Monthly",
                price_cents=settings.MONTHLY_PRICE_USD,
                currency="USD",
                interval="month",
            ).model_dump(),
            PlanInfo(
                name="Monthly (CNY)",
                price_cents=settings.MONTHLY_PRICE_CNY,
                currency="CNY",
                interval="month",
            ).model_dump(),
        ]
    }


@router.post("/checkout")
async def checkout(
    body: CheckoutRequest,
    request: Request,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await payment_service.create_checkout(
        db,
        user,
        body.provider,
        success_url=body.success_url,
        cancel_url=body.cancel_url,
        ip_address=request.client.host if request.client else "",
        user_agent=request.headers.get("user-agent", ""),
    )
    return result


@router.post("/webhook/stripe")
async def stripe_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    payload = await request.body()
    sig = request.headers.get("stripe-signature", "")
    event = stripe_client.verify_webhook(payload, sig)
    if not event:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid webhook")

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        payment_id = session.get("metadata", {}).get("payment_id", "")
        if payment_id:
            await payment_service.handle_payment_success(
                db, payment_id, session.get("subscription", "")
            )
    return {"received": True}


@router.post("/webhook/wechat")
async def wechat_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    body = (await request.body()).decode()
    data = wechat_client.verify_callback(body)
    if not data:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid callback")
    if data.get("out_trade_no"):
        await payment_service.handle_payment_success(db, data["out_trade_no"])
    return "<xml><return_code><![CDATA[SUCCESS]]></return_code></xml>"


@router.post("/webhook/alipay")
async def alipay_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    form = await request.form()
    params = dict(form)
    if not alipay_client.verify_callback(params):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid callback")
    trade_no = params.get("out_trade_no", "")
    if trade_no and params.get("trade_status") == "TRADE_SUCCESS":
        await payment_service.handle_payment_success(
            db, trade_no, params.get("trade_no", "")
        )
    return "success"


@router.get("/subscription")
async def get_subscription(
    user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    return await payment_service.get_subscription(db, user.id)


@router.post("/cancel")
async def cancel_subscription(
    user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    ok = await payment_service.cancel_subscription(db, user.id)
    if not ok:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No active subscription")
    return {"message": "Subscription cancelled"}
