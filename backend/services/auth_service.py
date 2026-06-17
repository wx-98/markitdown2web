from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.core.security import hash_password, verify_password, create_access_token
from backend.models.user import User
from backend.models.base import new_id


async def register_by_email(
    db: AsyncSession, email: str, password: str, nickname: str = ""
) -> tuple[User, str]:
    user = User(
        id=new_id(),
        email=email,
        password_hash=hash_password(password),
        nickname=nickname or email.split("@")[0],
        auth_provider="email",
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    token = create_access_token(user.id, {"role": user.role})
    return user, token


async def login_by_email(
    db: AsyncSession, email: str, password: str
) -> tuple[User, str] | None:
    stmt = select(User).where(User.email == email)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    if not user or not user.password_hash:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user, create_access_token(user.id, {"role": user.role})


async def get_or_create_by_email(db: AsyncSession, email: str) -> tuple[User, str]:
    """邮箱验证码登录：存在则直接登录，不存在则自动创建账户。"""
    stmt = select(User).where(User.email == email)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        user = User(
            id=new_id(),
            email=email,
            nickname=email.split("@")[0],
            auth_provider="email",
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    token = create_access_token(user.id, {"role": user.role})
    return user, token


async def get_or_create_by_phone(db: AsyncSession, phone: str) -> tuple[User, str]:
    stmt = select(User).where(User.phone == phone)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        user = User(
            id=new_id(),
            phone=phone,
            nickname=f"user_{phone[-4:]}",
            auth_provider="phone",
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    token = create_access_token(user.id, {"role": user.role})
    return user, token


async def get_or_create_by_google(
    db: AsyncSession, google_id: str, email: str, name: str, avatar: str | None
) -> tuple[User, str]:
    stmt = select(User).where(User.google_id == google_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        stmt2 = select(User).where(User.email == email)
        res2 = await db.execute(stmt2)
        user = res2.scalar_one_or_none()
        if user:
            user.google_id = google_id
            user.avatar_url = avatar or user.avatar_url
            await db.commit()
            await db.refresh(user)
        else:
            user = User(
                id=new_id(),
                email=email,
                google_id=google_id,
                nickname=name,
                avatar_url=avatar,
                auth_provider="google",
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)

    token = create_access_token(user.id, {"role": user.role})
    return user, token


async def get_user_by_id(db: AsyncSession, user_id: str) -> User | None:
    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    return result.scalar_one_or_none()
