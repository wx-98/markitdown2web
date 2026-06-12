"""VLM (Vision Language Model) image analysis."""

from __future__ import annotations

import base64
from pathlib import Path

from backend.config import settings
from backend.core.llm.client import get_vlm_client


async def analyze_image(image_path: str | Path, prompt: str) -> str:
    """Analyze a single image using VLM and return text description."""
    content = _build_image_content(prompt, [image_path])
    return await _vlm_chat(content)


async def analyze_images_batch(image_paths: list[str | Path], prompt: str) -> str:
    """Analyze multiple images in a single VLM call."""
    content = _build_image_content(prompt, image_paths)
    return await _vlm_chat(content)


def _build_image_content(prompt: str, paths: list[str | Path]) -> list[dict]:
    content: list[dict] = [{"type": "text", "text": prompt}]
    for p in paths:
        img_bytes = Path(p).read_bytes()
        b64 = base64.b64encode(img_bytes).decode()
        ext = Path(p).suffix.lstrip(".").lower()
        mime = {"jpg": "jpeg", "jpeg": "jpeg", "png": "png", "gif": "gif", "webp": "webp"}.get(
            ext, "jpeg"
        )
        content.append(
            {"type": "image_url", "image_url": {"url": f"data:image/{mime};base64,{b64}"}}
        )
    return content


async def _vlm_chat(content: list[dict]) -> str:
    client = get_vlm_client()
    resp = await client.chat.completions.create(
        model=settings.VLM_MODEL,
        messages=[{"role": "user", "content": content}],
        max_tokens=4096,
    )
    return resp.choices[0].message.content or ""
