"""Abstract base class for PPTX generation providers.

Defines the interface that all providers must implement, enabling future
extensibility with different generation methods.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from pathlib import Path


class PptxProvider(ABC):
    """Base provider interface."""

    @abstractmethod
    async def generate(self, content: str, options: dict) -> Path:
        """Given Markdown/text content and options, produce a .pptx file.

        Args:
            content: Source content (Markdown, plain text, or file path).
            options: Generation options (canvas_format, style, page_count, etc.).

        Returns:
            Path to the generated .pptx file.
        """
