import json
import logging

from backend.config import settings

logger = logging.getLogger(__name__)


async def send_aliyun_sms(phone: str, code: str) -> bool:
    if not settings.ALIYUN_ACCESS_KEY_ID:
        logger.warning("Aliyun SMS not configured, code=%s sent to phone=%s", code, phone)
        return True

    try:
        from alibabacloud_dysmsapi20170525.client import Client
        from alibabacloud_dysmsapi20170525.models import SendSmsRequest
        from alibabacloud_tea_openapi.models import Config

        config = Config(
            access_key_id=settings.ALIYUN_ACCESS_KEY_ID,
            access_key_secret=settings.ALIYUN_ACCESS_KEY_SECRET,
            endpoint="dysmsapi.aliyuncs.com",
        )
        client = Client(config)
        request = SendSmsRequest(
            phone_numbers=phone,
            sign_name=settings.ALIYUN_SMS_SIGN_NAME,
            template_code=settings.ALIYUN_SMS_TEMPLATE_CODE,
            template_param=json.dumps({"code": code}),
        )
        resp = client.send_sms(request)
        return resp.body.code == "OK"
    except Exception:
        logger.exception("Aliyun SMS send failed")
        return False
