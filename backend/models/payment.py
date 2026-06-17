from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from backend.models.base import Base, new_id, utcnow


class Payment(Base):
    __tablename__ = "payments"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=new_id)
    user_id: Mapped[str] = mapped_column(String(32), ForeignKey("users.id"), index=True)
    subscription_id: Mapped[str | None] = mapped_column(
        String(32), ForeignKey("subscriptions.id"), nullable=True
    )
    amount_cents: Mapped[int] = mapped_column(Integer)
    currency: Mapped[str] = mapped_column(String(3), default="USD")
    provider: Mapped[str] = mapped_column(
        Enum("stripe", "wechat", "alipay", name="payment_provider_enum")
    )
    external_payment_id: Mapped[str] = mapped_column(String(255), default="")
    status: Mapped[str] = mapped_column(
        Enum("pending", "succeeded", "failed", "refunded", name="payment_status_enum"),
        default="pending",
    )
    paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
