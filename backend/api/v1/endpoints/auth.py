from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession

from backend.api.deps import get_current_user, get_db
from backend.config import settings
from backend.models.user import User
from backend.schemas.auth import (
    AuthResponse,
    EmailCodeSendRequest,
    EmailCodeVerifyRequest,
    EmailLoginRequest,
    EmailRegisterRequest,
    EmailRegisterWithCodeRequest,
    SmsSendRequest,
    SmsVerifyRequest,
    UserInfo,
)
from backend.services import auth_service, email_service, sms_service

router = APIRouter(prefix="/auth", tags=["auth"])


def _user_info(u: User) -> UserInfo:
    return UserInfo(
        id=u.id,
        email=u.email,
        phone=u.phone,
        nickname=u.nickname,
        avatar_url=u.avatar_url,
        auth_provider=u.auth_provider,
        role=u.role,
        subscription_plan=u.subscription_plan,
        subscription_expires_at=(
            u.subscription_expires_at.isoformat() if u.subscription_expires_at else None
        ),
    )


@router.post("/register", response_model=AuthResponse)
async def register(body: EmailRegisterRequest, db: AsyncSession = Depends(get_db)):
    from sqlalchemy import select
    exists = await db.execute(select(User).where(User.email == body.email))
    if exists.scalar_one_or_none():
        raise HTTPException(status.HTTP_409_CONFLICT, "Email already registered")

    user, token = await auth_service.register_by_email(
        db, body.email, body.password, body.nickname
    )
    return AuthResponse(access_token=token, user=_user_info(user))


@router.post("/register/with-code", response_model=AuthResponse)
async def register_with_code(
    body: EmailRegisterWithCodeRequest, db: AsyncSession = Depends(get_db)
):
    """注册时需要先验证邮箱验证码。"""
    from sqlalchemy import select
    exists = await db.execute(select(User).where(User.email == body.email))
    if exists.scalar_one_or_none():
        raise HTTPException(status.HTTP_409_CONFLICT, "Email already registered")

    valid = await email_service.verify_code(db, body.email, body.code, "register")
    if not valid:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid or expired verification code")

    user, token = await auth_service.register_by_email(
        db, body.email, body.password, body.nickname
    )
    return AuthResponse(access_token=token, user=_user_info(user))


@router.post("/login", response_model=AuthResponse)
async def login(body: EmailLoginRequest, db: AsyncSession = Depends(get_db)):
    result = await auth_service.login_by_email(db, body.email, body.password)
    if not result:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid email or password")
    user, token = result
    return AuthResponse(access_token=token, user=_user_info(user))


@router.post("/email/send-code")
async def email_send_code(
    body: EmailCodeSendRequest, db: AsyncSession = Depends(get_db)
):
    ok = await email_service.send_verification_code(db, body.email, body.purpose)
    if not ok:
        raise HTTPException(
            status.HTTP_500_INTERNAL_SERVER_ERROR, "Failed to send email verification code"
        )
    return {"message": "Verification code sent"}


@router.post("/email/verify", response_model=AuthResponse)
async def email_verify_login(
    body: EmailCodeVerifyRequest, db: AsyncSession = Depends(get_db)
):
    """通过邮箱验证码直接登录（无需密码）。不存在则自动注册。"""
    valid = await email_service.verify_code(db, body.email, body.code, body.purpose)
    if not valid:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid or expired verification code")
    user, token = await auth_service.get_or_create_by_email(db, body.email)
    return AuthResponse(access_token=token, user=_user_info(user))


@router.post("/sms/send")
async def sms_send(body: SmsSendRequest, db: AsyncSession = Depends(get_db)):
    ok = await sms_service.send_verification_code(db, body.phone, body.purpose)
    if not ok:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Failed to send SMS")
    return {"message": "Verification code sent"}


@router.post("/sms/verify", response_model=AuthResponse)
async def sms_verify(body: SmsVerifyRequest, db: AsyncSession = Depends(get_db)):
    valid = await sms_service.verify_code(db, body.phone, body.code, body.purpose)
    if not valid:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid or expired code")
    user, token = await auth_service.get_or_create_by_phone(db, body.phone)
    return AuthResponse(access_token=token, user=_user_info(user))


@router.get("/google")
async def google_redirect():
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(status.HTTP_501_NOT_IMPLEMENTED, "Google OAuth not configured")
    params = (
        f"client_id={settings.GOOGLE_CLIENT_ID}"
        f"&redirect_uri={settings.GOOGLE_REDIRECT_URI}"
        "&response_type=code"
        "&scope=openid%20email%20profile"
        "&access_type=offline"
    )
    return RedirectResponse(f"https://accounts.google.com/o/oauth2/v2/auth?{params}")


@router.get("/google/callback", response_model=AuthResponse)
async def google_callback(code: str, db: AsyncSession = Depends(get_db)):
    import httpx

    async with httpx.AsyncClient() as client:
        token_resp = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": code,
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "redirect_uri": settings.GOOGLE_REDIRECT_URI,
                "grant_type": "authorization_code",
            },
        )
        if token_resp.status_code != 200:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Google token exchange failed")
        tokens = token_resp.json()

        userinfo_resp = await client.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {tokens['access_token']}"},
        )
        if userinfo_resp.status_code != 200:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Failed to get Google user info")
        info = userinfo_resp.json()

    user, token = await auth_service.get_or_create_by_google(
        db,
        google_id=info["sub"],
        email=info.get("email", ""),
        name=info.get("name", ""),
        avatar=info.get("picture"),
    )
    return AuthResponse(access_token=token, user=_user_info(user))


@router.get("/me", response_model=UserInfo)
async def me(user: User = Depends(get_current_user)):
    return _user_info(user)
