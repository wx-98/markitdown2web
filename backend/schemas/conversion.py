from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class ConversionResultOut(BaseModel):
    id: str
    title: str
    raw_content: str
    markdown_content: str
    summary: str
    tags: list[str] | None = None
    source_type: str
    source_url: str
    metadata_: dict | None = Field(None, alias="metadata_")
    created_at: datetime

    model_config = {"from_attributes": True}
