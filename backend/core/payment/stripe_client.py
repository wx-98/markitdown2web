import logging

import stripe

from backend.config import settings

logger = logging.getLogger(__name__)


def _init():
    if settings.STRIPE_SECRET_KEY:
        stripe.api_key = settings.STRIPE_SECRET_KEY


async def create_checkout_session(
    user_id: str, user_email: str, success_url: str, cancel_url: str
) -> dict:
    """Create a Stripe Checkout Session for monthly subscription."""
    _init()
    if not settings.STRIPE_SECRET_KEY:
        logger.warning("Stripe not configured — returning mock session")
        return {"url": success_url, "session_id": "mock_stripe_session"}

    session = stripe.checkout.Session.create(
        mode="subscription",
        customer_email=user_email,
        line_items=[{"price": settings.STRIPE_PRICE_ID_MONTHLY, "quantity": 1}],
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={"user_id": user_id},
    )
    return {"url": session.url, "session_id": session.id}


def verify_webhook(payload: bytes, sig_header: str) -> dict | None:
    _init()
    if not settings.STRIPE_WEBHOOK_SECRET:
        return None
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
        return event
    except Exception:
        logger.exception("Stripe webhook verification failed")
        return None
