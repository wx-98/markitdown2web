import logging

from backend.config import settings

logger = logging.getLogger(__name__)


async def send_twilio_sms(phone: str, code: str) -> bool:
    if not settings.TWILIO_ACCOUNT_SID:
        logger.warning("Twilio SMS not configured, code=%s sent to phone=%s", code, phone)
        return True

    try:
        from twilio.rest import Client

        client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        client.messages.create(
            body=f"Your E2M verification code is: {code}",
            from_=settings.TWILIO_PHONE_NUMBER,
            to=phone,
        )
        return True
    except Exception:
        logger.exception("Twilio SMS send failed")
        return False
