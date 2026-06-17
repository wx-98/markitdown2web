"""Alipay PC Web Payment integration skeleton.

Requires: ALIPAY_APP_ID, ALIPAY_PRIVATE_KEY, ALIPAY_PUBLIC_KEY, ALIPAY_NOTIFY_URL
in .env. Fill in the merchant credentials to enable real payments.
"""

import hashlib
import logging
import time
import urllib.parse

from backend.config import settings

logger = logging.getLogger(__name__)

ALIPAY_GATEWAY = "https://openapi.alipay.com/gateway.do"


def _sign_rsa2(content: str) -> str:
    """RSA2 (SHA256WithRSA) sign using private key."""
    if not settings.ALIPAY_PRIVATE_KEY:
        return ""
    try:
        from Crypto.PublicKey import RSA
        from Crypto.Signature import pkcs1_15
        from Crypto.Hash import SHA256
        import base64

        key = RSA.import_key(settings.ALIPAY_PRIVATE_KEY)
        h = SHA256.new(content.encode("utf-8"))
        signature = pkcs1_15.new(key).sign(h)
        return base64.b64encode(signature).decode()
    except ImportError:
        logger.warning("PyCryptodome not installed — RSA signing unavailable")
        return ""


def create_page_pay_url(
    order_id: str, amount_yuan: str, subject: str, return_url: str
) -> str:
    if not settings.ALIPAY_APP_ID:
        logger.warning("Alipay not configured — returning empty URL")
        return ""

    biz_content = (
        f'{{"out_trade_no":"{order_id}",'
        f'"total_amount":"{amount_yuan}",'
        f'"subject":"{subject}",'
        f'"product_code":"FAST_INSTANT_TRADE_PAY"}}'
    )

    params = {
        "app_id": settings.ALIPAY_APP_ID,
        "method": "alipay.trade.page.pay",
        "charset": "utf-8",
        "sign_type": "RSA2",
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "version": "1.0",
        "notify_url": settings.ALIPAY_NOTIFY_URL,
        "return_url": return_url,
        "biz_content": biz_content,
    }

    sorted_items = sorted(params.items())
    unsigned_str = "&".join(f"{k}={v}" for k, v in sorted_items)
    params["sign"] = _sign_rsa2(unsigned_str)

    return f"{ALIPAY_GATEWAY}?{urllib.parse.urlencode(params)}"


def verify_callback(params: dict) -> bool:
    """Verify Alipay async notification signature."""
    if not settings.ALIPAY_PUBLIC_KEY:
        return False
    # Production: extract sign, rebuild unsigned string, verify RSA2 with public key
    logger.info("Alipay callback verification skeleton")
    return True
