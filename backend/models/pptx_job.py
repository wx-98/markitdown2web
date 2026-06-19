"""PptxJob model — tracks PPTX generation tasks."""

from datetime import datetime

from sqlalchemy import DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from backend.models.base import Base, new_id, utcnow


class PptxJob(Base):
    __tablename__ = "pptx_jobs"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=new_id)
    user_id: Mapped[str | None] = mapped_column(String(32), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="pending")
    progress: Mapped[int] = mapped_column(Integer, default=0)
    source_type: Mapped[str] = mapped_column(String(20), default="text")
    source_name: Mapped[str] = mapped_column(String(500), default="")
    canvas_format: Mapped[str] = mapped_column(String(10), default="ppt169")
    style: Mapped[str] = mapped_column(String(50), default="professional")
    page_count: Mapped[int] = mapped_column(Integer, default=10)
    design_spec: Mapped[str | None] = mapped_column(Text, nullable=True)
    output_path: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow
    )
