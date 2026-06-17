from pydantic import BaseModel


class CheckoutRequest(BaseModel):
    provider: str  # stripe / wechat / alipay
    success_url: str = ""
    cancel_url: str = ""


class PlanInfo(BaseModel):
    name: str
    price_cents: int
    currency: str
    interval: str
