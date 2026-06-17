from backend.config import settings


async def send_sms(phone: str, code: str) -> bool:
    provider = settings.SMS_PROVIDER.lower()
    if provider == "twilio":
        from backend.core.sms.twilio_sms import send_twilio_sms
        return await send_twilio_sms(phone, code)
    else:
        from backend.core.sms.aliyun_sms import send_aliyun_sms
        return await send_aliyun_sms(phone, code)
