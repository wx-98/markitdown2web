from __future__ import annotations

import abc
from pathlib import Path


class BaseExporter(abc.ABC):
    """Abstract base class for Markdown → target format exporters."""

    @abc.abstractmethod
    def export(self, content: str, output_path: Path) -> Path:
        """Write *content* (Markdown) to *output_path* in the target format.

        Returns the actual output path (may differ if fallback format is used).
        """
