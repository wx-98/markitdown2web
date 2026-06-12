from __future__ import annotations

from pydantic import BaseModel


class VideoProcessRequest(BaseModel):
    url: str | None = None
    generate_summary: bool = True
    note_style: str = "detailed"  # brief | detailed | outline
