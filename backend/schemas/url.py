from __future__ import annotations

from pydantic import BaseModel


class UrlProcessRequest(BaseModel):
    url: str
    generate_summary: bool = True
    note_style: str = "detailed"
