"""VLM-assisted PDF converter for documents with formulas and figures.

Renders each page as an image and sends to VLM (e.g. GPT-4o) for accurate
extraction of text, LaTeX formulas, and figure descriptions.
"""

from __future__ import annotations

import logging
from pathlib import Path

from backend.core.converter.base import BaseConverter
from backend.core.converter.image_extractor import (
    extract_images_from_pdf,
    render_pdf_pages_as_images,
)
from backend.core.llm.prompts import VLM_PDF_PAGE_ANALYSIS
from backend.core.video.vlm import analyze_image

logger = logging.getLogger(__name__)


class PdfVlmConverter(BaseConverter):
    """Convert PDF to Markdown by sending each page image to VLM.

    Produces high-quality extraction of math formulas, tables, and figures
    that pure text-based extraction (MarkItDown / pdfminer) would miss.
    """

    def __init__(self, task_id: str = ""):
        self.task_id = task_id

    async def convert(self, file_path: Path) -> str:
        page_images = render_pdf_pages_as_images(file_path, self.task_id)
        if not page_images:
            logger.warning("No pages rendered for %s, falling back to empty", file_path)
            return ""

        embedded_images = extract_images_from_pdf(file_path, self.task_id)

        sections: list[str] = []
        total = len(page_images)

        for i, page_info in enumerate(page_images):
            logger.info("VLM analyzing page %d/%d", i + 1, total)
            try:
                page_text = await analyze_image(page_info["path"], VLM_PDF_PAGE_ANALYSIS)
            except Exception:
                logger.warning("VLM failed on page %d", i + 1, exc_info=True)
                page_text = f"[第 {i + 1} 页 VLM 分析失败]"

            page_embedded = [img for img in embedded_images if img["page"] == i + 1]
            if page_embedded:
                img_refs = "\n".join(
                    f"![图 {img['index']}（第 {img['page']} 页）]({img['url']})"
                    for img in page_embedded
                )
                page_text += f"\n\n{img_refs}"

            sections.append(f"<!-- Page {i + 1} -->\n{page_text}")

        return "\n\n---\n\n".join(sections)

    @classmethod
    def supported_extensions(cls) -> set[str]:
        return {".pdf"}
