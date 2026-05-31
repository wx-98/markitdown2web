from pydantic import BaseModel, HttpUrl


class UrlConvertRequest(BaseModel):
    url: HttpUrl


class ConvertResponse(BaseModel):
    title: str | None = None
    markdown: str
    source: str
