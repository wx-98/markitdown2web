import random
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.core.email import build_verification_html, send_email
from backend.models.email_code import EmailCode

EMAIL_CODE_TTL_MINUTES = 5


def _generate_code() -> str:
    return f"{random.randint(0, 999999):06d}"


async def send_verification_code(
    db: AsyncSession, email: str, purpose: str = "login"
) -> bool:
    code = _generate_code()
    expires = datetime.now(timezone.utc) + timedelta(minutes=EMAIL_CODE_TTL_MINUTES)

    record = EmailCode(email=email, code=code, purpose=purpose, expires_at=expires)
    db.add(record)
    await db.commit()

    subject = "E2M 验证码"
    html = build_verification_html(code)
    return await send_email(email, subject, html)


async def verify_code(
    db: AsyncSession, email: str, code: str, purpose: str = "login"
) -> bool:
    now = datetime.now(timezone.utc)
    stmt = (
        select(EmailCode)
        .where(
            EmailCode.email == email,
            EmailCode.code == code,
            EmailCode.purpose == purpose,
            EmailCode.used == False,  # noqa: E712
            EmailCode.expires_at > now,
        )
        .order_by(EmailCode.created_at.desc())
        .limit(1)
    )
    result = await db.execute(stmt)
    record = result.scalar_one_or_none()
    if not record:
        return False

    record.used = True
    await db.commit()
    return True
