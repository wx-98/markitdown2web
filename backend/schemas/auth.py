from pydantic import BaseModel, EmailStr


class EmailRegisterRequest(BaseModel):
    email: EmailStr
    password: str
    nickname: str = ""


class EmailLoginRequest(BaseModel):
    email: EmailStr
    password: str


class EmailCodeSendRequest(BaseModel):
    email: EmailStr
    purpose: str = "login"


class EmailCodeVerifyRequest(BaseModel):
    email: EmailStr
    code: str
    purpose: str = "login"


class EmailRegisterWithCodeRequest(BaseModel):
    email: EmailStr
    code: str
    password: str
    nickname: str = ""


class SmsSendRequest(BaseModel):
    phone: str
    purpose: str = "login"


class SmsVerifyRequest(BaseModel):
    phone: str
    code: str
    purpose: str = "login"


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserInfo"


class UserInfo(BaseModel):
    id: str
    email: str | None = None
    phone: str | None = None
    nickname: str
    avatar_url: str | None = None
    auth_provider: str
    role: str
    subscription_plan: str
    subscription_expires_at: str | None = None


AuthResponse.model_rebuild()
