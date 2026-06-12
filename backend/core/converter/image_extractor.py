"""Extract images from PDF documents and render pages as images for VLM analysis."""

from __future__ import annotations

import logging
import uuid
from pathlib import Path

from backend.config import settings

logger = logging.getLogger(__name__)


def _ensure_images_dir(task_id: str) -> Path:
    d = settings.storage_dir / "images" / task_id
    d.mkdir(parents=True, exist_ok=True)
    return d


def extract_images_from_pdf(pdf_path: Path, task_id: str) -> list[dict]:
    """Extract embedded images from a PDF using pdfplumber.

    Returns list of dicts with keys: path, page, index, url.
    """
    import pdfplumber

    images_dir = _ensure_images_dir(task_id)
    extracted: list[dict] = []

    try:
        with pdfplumber.open(str(pdf_path)) as pdf:
            for page_idx, page in enumerate(pdf.pages):
                for img_idx, img in enumerate(page.images):
                    try:
                        img_obj = page.crop(
                            (img["x0"], img["top"], img["x1"], img["bottom"])
                        ).to_image(resolution=200)
                        fname = f"page{page_idx + 1}_img{img_idx + 1}_{uuid.uuid4().hex[:6]}.png"
                        out_path = images_dir / fname
                        img_obj.save(str(out_path))
                        extracted.append({
                            "path": str(out_path),
                            "page": page_idx + 1,
                            "index": img_idx + 1,
                            "url": f"/api/v1/files/{task_id}/{fname}",
                        })
                    except Exception:
                        logger.debug("Failed to extract image page=%d img=%d", page_idx, img_idx)
    except Exception:
        logger.warning("pdfplumber image extraction failed for %s", pdf_path, exc_info=True)

    return extracted


def render_pdf_pages_as_images(pdf_path: Path, task_id: str) -> list[dict]:
    """Render each page of a PDF as a high-quality image for VLM analysis.

    Returns list of dicts with keys: path, page, url.
    """
    import pypdfium2 as pdfium

    images_dir = _ensure_images_dir(task_id)
    pages: list[dict] = []

    try:
        doc = pdfium.PdfDocument(str(pdf_path))
        for page_idx in range(len(doc)):
            page = doc[page_idx]
            bitmap = page.render(scale=2)
            pil_image = bitmap.to_pil()

            fname = f"page_{page_idx + 1:03d}.png"
            out_path = images_dir / fname
            pil_image.save(str(out_path), "PNG")

            pages.append({
                "path": str(out_path),
                "page": page_idx + 1,
                "url": f"/api/v1/files/{task_id}/{fname}",
            })
        doc.close()
    except Exception:
        logger.warning("PDF page rendering failed for %s", pdf_path, exc_info=True)

    return pages
