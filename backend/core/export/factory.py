from __future__ import annotations

from backend.core.export.base import BaseExporter
from backend.core.export.markdown_exporter import MarkdownExporter
from backend.core.export.pdf_exporter import PdfExporter
from backend.core.export.word_exporter import WordExporter


class ExporterFactory:
    """Select the appropriate exporter by format name."""

    _MAP: dict[str, type[BaseExporter]] = {
        "markdown": MarkdownExporter,
        "md": MarkdownExporter,
        "word": WordExporter,
        "docx": WordExporter,
        "pdf": PdfExporter,
    }

    @classmethod
    def get_exporter(cls, fmt: str) -> BaseExporter:
        exporter_cls = cls._MAP.get(fmt.lower())
        if exporter_cls is None:
            raise ValueError(f"Unsupported export format: {fmt}")
        return exporter_cls()
