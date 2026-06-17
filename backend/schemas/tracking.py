from pydantic import BaseModel


class TrackEventRequest(BaseModel):
    event_type: str
    event_data: dict | None = None
    page_url: str = ""
    session_id: str = ""
