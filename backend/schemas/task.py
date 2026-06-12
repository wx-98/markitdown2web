from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel


class TaskOut(BaseModel):
    id: str
    type: str
    source: str
    status: str
    progress: int
    error_message: str | None = None
    result_id: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
