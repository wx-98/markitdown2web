from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from backend.models.base import Base, new_id, utcnow


class Subscription(Base):
    __tablename__ = "subscriptions"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=new_id)
    user_id: Mapped[str] = mapped_column(String(32), ForeignKey("users.id"), index=True)
    plan: Mapped[str] = mapped_column(Enum("monthly", name="plan_enum"), default="monthly")
    status: Mapped[str] = mapped_column(
        Enum("active", "cancelled", "expired", "past_due", name="sub_status_enum"),
        default="active",
    )
    payment_provider: Mapped[str] = mapped_column(
        Enum("stripe", "wechat", "alipay", name="pay_provider_enum")
    )
    external_subscription_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    current_period_start: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    current_period_end: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
