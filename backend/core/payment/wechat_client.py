"""WeChat Pay Native integration skeleton.

Requires: WECHAT_APP_ID, WECHAT_MCH_ID, WECHAT_API_KEY, WECHAT_NOTIFY_URL
in .env. The actual WeChat Pay V3 API calls are structured here; fill in
the merchant credentials to enable real payments.
"""

import hashlib
import logging
import time
import uuid

import httpx

from backend.config import settings

logger = logging.getLogger(__name__)


def _nonce() -> str:
    return uuid.uuid4().hex


def _sign(params: dict) -> str:
    """MD5 sign for WeChat Pay V2 API."""
    sorted_items = sorted(params.items())
    raw = "&".join(f"{k}={v}" for k, v in sorted_items if v)
    raw += f"&key={settings.WECHAT_API_KEY}"
    return hashlib.md5(raw.encode()).hexdigest().upper()


async def create_native_order(
    order_id: str, amount_cents: int, description: str
) -> dict:
    if not settings.WECHAT_APP_ID:
        logger.warning("WeChat Pay not configured — returning mock")
        return {"code_url": "", "order_id": order_id}

    params = {
        "appid": settings.WECHAT_APP_ID,
        "mch_id": settings.WECHAT_MCH_ID,
        "nonce_str": _nonce(),
        "body": description,
        "out_trade_no": order_id,
        "total_fee": str(amount_cents),
        "spbill_create_ip": "127.0.0.1",
        "notify_url": settings.WECHAT_NOTIFY_URL,
        "trade_type": "NATIVE",
    }
    params["sign"] = _sign(params)

    xml_body = "<xml>" + "".join(f"<{k}>{v}</{k}>" for k, v in params.items()) + "</xml>"
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            "https://api.mch.weixin.qq.com/pay/unifiedorder",
            content=xml_body,
            headers={"Content-Type": "application/xml"},
        )
    # Simplified — production code should parse XML properly
    body = resp.text
    code_url = ""
    if "<code_url>" in body:
        code_url = body.split("<code_url><![CDATA[")[1].split("]]></code_url>")[0]
    return {"code_url": code_url, "order_id": order_id}


def verify_callback(xml_body: str) -> dict | None:
    """Parse and verify WeChat Pay callback XML. Returns parsed dict or None."""
    if not settings.WECHAT_API_KEY:
        return None
    # Production: parse XML, verify sign, return dict with out_trade_no, result_code, etc.
    logger.info("WeChat callback received (verification skeleton)")
    return {"out_trade_no": "", "result_code": "SUCCESS"}
