from __future__ import annotations

import asyncio
from pathlib import Path

from markitdown import MarkItDown

from backend.core.converter.base import BaseConverter

_md: MarkItDown | None = None


def _get_markitdown() -> MarkItDown:
    global _md
    if _md is None:
        _md = MarkItDown()
    return _md


class MarkItDownConverter(BaseConverter):
    """Converter backed by Microsoft MarkItDown library."""

    EXTENSIONS = {
        ".pdf", ".docx", ".doc", ".pptx", ".ppt",
        ".xlsx", ".xls", ".csv",
        ".html", ".htm", ".epub",
        ".txt", ".md", ".json", ".xml",
        ".jpg", ".jpeg", ".png", ".gif", ".webp",
    }

    async def convert(self, file_path: Path) -> str:
        if not file_path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")
        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(None, self._sync_convert, str(file_path))

    @classmethod
    def supported_extensions(cls) -> set[str]:
        return cls.EXTENSIONS

    @staticmethod
    def _sync_convert(path_str: str) -> str:
        md = _get_markitdown()
        result = md.convert(path_str)
        return result.text_content
