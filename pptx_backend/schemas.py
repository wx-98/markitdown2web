"""Pydantic schemas for PPTX module."""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class PptxJobCreate(BaseModel):
    source_type: Literal["file", "url", "text"] = "text"
    source_name: str = ""
    content: str = ""
    canvas_format: str = "ppt169"
    style: str = "professional"
    page_count: int = Field(default=10, ge=1, le=50)


class PptxJobOut(BaseModel):
    id: str
    status: str
    progress: int
    source_type: str
    source_name: str
    canvas_format: str
    style: str
    page_count: int
    error_message: str | None = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PptxJobConfirm(BaseModel):
    approved: bool = True
    modifications: str | None = None
