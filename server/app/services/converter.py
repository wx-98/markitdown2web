import os
import uuid
from pathlib import Path

from markitdown import MarkItDown, DocumentConverterResult

from app.core.config import settings
from app.core.errors import ConversionError

_md = MarkItDown()


def convert_file(file_path: Path) -> DocumentConverterResult:
    try:
        return _md.convert_local(str(file_path))
    except Exception as exc:
        raise ConversionError(detail=str(exc)) from exc


def convert_url(url: str) -> DocumentConverterResult:
    try:
        return _md.convert_url(url)
    except Exception as exc:
        raise ConversionError(detail=str(exc)) from exc


def save_upload(content: bytes, filename: str) -> Path:
    safe_name = f"{uuid.uuid4().hex}_{filename}"
    dest = settings.UPLOAD_DIR / safe_name
    dest.write_bytes(content)
    return dest


def cleanup_file(path: Path) -> None:
    try:
        os.unlink(path)
    except OSError:
        pass
