from __future__ import annotations

from pathlib import Path

from backend.core.export.base import BaseExporter


class MarkdownExporter(BaseExporter):
    def export(self, content: str, output_path: Path) -> Path:
        output_path.write_text(content, encoding="utf-8")
        return output_path
