from __future__ import annotations

from pydantic import BaseModel


class DocumentConvertRequest(BaseModel):
    generate_summary: bool = True
    note_style: str = "detailed"
