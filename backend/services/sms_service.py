import random
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.core.sms import send_sms
from backend.models.sms_code import SmsCode

SMS_CODE_TTL_MINUTES = 5


def _generate_code() -> str:
    return f"{random.randint(0, 999999):06d}"


async def send_verification_code(db: AsyncSession, phone: str, purpose: str = "login") -> bool:
    code = _generate_code()
    expires = datetime.now(timezone.utc) + timedelta(minutes=SMS_CODE_TTL_MINUTES)

    record = SmsCode(phone=phone, code=code, purpose=purpose, expires_at=expires)
    db.add(record)
    await db.commit()

    return await send_sms(phone, code)


async def verify_code(db: AsyncSession, phone: str, code: str, purpose: str = "login") -> bool:
    now = datetime.now(timezone.utc)
    stmt = (
        select(SmsCode)
        .where(
            SmsCode.phone == phone,
            SmsCode.code == code,
            SmsCode.purpose == purpose,
            SmsCode.used == False,  # noqa: E712
            SmsCode.expires_at > now,
        )
        .order_by(SmsCode.created_at.desc())
        .limit(1)
    )
    result = await db.execute(stmt)
    record = result.scalar_one_or_none()
    if not record:
        return False

    record.used = True
    await db.commit()
    return True
