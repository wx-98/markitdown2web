from __future__ import annotations

from pathlib import Path

from backend.core.converter.base import BaseConverter
from backend.core.converter.markitdown_converter import MarkItDownConverter

_REGISTRY: dict[str, type[BaseConverter]] = {}


def _build_registry() -> None:
    if _REGISTRY:
        return
    for conv_cls in [MarkItDownConverter]:
        for ext in conv_cls.supported_extensions():
            _REGISTRY[ext] = conv_cls


class ConverterFactory:
    """Select the appropriate converter based on file extension and options."""

    @staticmethod
    def get_converter(
        filename: str,
        *,
        use_vlm: bool = False,
        task_id: str = "",
    ) -> BaseConverter:
        _build_registry()
        ext = Path(filename).suffix.lower()

        if use_vlm and ext == ".pdf":
            from backend.core.converter.pdf_vlm_converter import PdfVlmConverter
            return PdfVlmConverter(task_id=task_id)

        conv_cls = _REGISTRY.get(ext)
        if conv_cls is None:
            raise ValueError(f"Unsupported file type: {ext}")
        return conv_cls()

    @staticmethod
    def is_supported(filename: str) -> bool:
        _build_registry()
        return Path(filename).suffix.lower() in _REGISTRY
