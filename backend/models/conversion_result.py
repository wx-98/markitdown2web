from datetime import datetime

from sqlalchemy import JSON, DateTime, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from backend.models.base import Base, new_id, utcnow


class ConversionResult(Base):
    __tablename__ = "conversion_results"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=new_id)
    title: Mapped[str] = mapped_column(String(500), default="")
    raw_content: Mapped[str] = mapped_column(Text, default="")
    markdown_content: Mapped[str] = mapped_column(Text, default="")
    summary: Mapped[str] = mapped_column(Text, default="")
    tags: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    source_type: Mapped[str] = mapped_column(String(50), default="")
    source_url: Mapped[str] = mapped_column(Text, default="")
    metadata_: Mapped[dict | None] = mapped_column("metadata", JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
