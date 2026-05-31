from fastapi import APIRouter, UploadFile, File

from app.core.config import settings
from app.core.errors import FileTooLargeError
from app.schemas.convert import ConvertResponse, UrlConvertRequest
from app.services.converter import convert_file, convert_url, save_upload, cleanup_file

router = APIRouter(prefix="/convert", tags=["convert"])

_MAX_BYTES = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024


@router.post("/file", response_model=ConvertResponse)
async def convert_uploaded_file(file: UploadFile = File(...)):
    content = await file.read()
    if len(content) > _MAX_BYTES:
        raise FileTooLargeError(settings.MAX_UPLOAD_SIZE_MB)

    path = save_upload(content, file.filename or "upload")
    try:
        result = convert_file(path)
    finally:
        cleanup_file(path)

    return ConvertResponse(
        title=result.title,
        markdown=result.markdown,
        source=file.filename or "upload",
    )


@router.post("/url", response_model=ConvertResponse)
async def convert_from_url(body: UrlConvertRequest):
    result = convert_url(str(body.url))
    return ConvertResponse(
        title=result.title,
        markdown=result.markdown,
        source=str(body.url),
    )
