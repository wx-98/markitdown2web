"""File handling utilities."""

from __future__ import annotations

import uuid
from pathlib import Path

from backend.config import settings


def save_upload(content: bytes, original_filename: str) -> Path:
    """Save uploaded file bytes to storage and return the path."""
    ext = Path(original_filename).suffix
    unique_name = f"{uuid.uuid4().hex}{ext}"
    dest = settings.storage_dir / unique_name
    dest.write_bytes(content)
    return dest


def get_export_path(filename: str) -> Path:
    return settings.export_dir / filename
