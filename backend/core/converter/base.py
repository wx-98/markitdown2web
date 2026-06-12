from __future__ import annotations

import abc
from pathlib import Path


class BaseConverter(abc.ABC):
    """Abstract base class for all document-to-Markdown converters."""

    @abc.abstractmethod
    async def convert(self, file_path: Path) -> str:
        """Convert the file at *file_path* and return Markdown text."""

    @classmethod
    @abc.abstractmethod
    def supported_extensions(cls) -> set[str]:
        """Return the set of file extensions this converter handles (e.g. {'.pdf', '.docx'})."""
