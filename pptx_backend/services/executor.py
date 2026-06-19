"""LLM Executor: generate per-page SVG content based on the design spec."""

from __future__ import annotations

import json
import logging
from pathlib import Path

from backend.core.llm.client import chat_completion

logger = logging.getLogger(__name__)

_CANVAS_SIZES = {
    "ppt169": (1280, 720),
    "ppt43": (1024, 768),
}

_SVG_SYSTEM_PROMPT = """\
You are a professional SVG slide generator.
Generate a single SVG slide for a presentation page.

Canvas size: {width}x{height} pixels.
The SVG must:
- Have exact width="{width}" height="{height}" attributes
- Use the theme colors provided
- Include all text content with proper font sizing
- Use clean, professional layouts
- NOT include any external resources (images must be embedded or omitted)

Output ONLY the raw SVG markup, starting with <svg and ending with </svg>. No markdown fences.
"""


async def generate_svgs(
    design_spec: str,
    workspace: Path,
    canvas_format: str = "ppt169",
) -> Path:
    """Generate one SVG file per page. Returns the directory containing SVGs."""
    svg_dir = workspace / "svgs"
    svg_dir.mkdir(parents=True, exist_ok=True)

    width, height = _CANVAS_SIZES.get(canvas_format, (1280, 720))

    try:
        spec = json.loads(design_spec)
    except json.JSONDecodeError:
        spec = {"pages": [{"page_number": 1, "title": "Presentation", "content_points": [design_spec[:500]]}]}

    pages = spec.get("pages", [])
    theme = spec.get("theme", {})

    system_msg = _SVG_SYSTEM_PROMPT.format(width=width, height=height)

    for i, page in enumerate(pages):
        page_prompt = (
            f"Theme: {json.dumps(theme)}\n\n"
            f"Page {page.get('page_number', i + 1)}: {page.get('title', '')}\n"
            f"Layout: {page.get('layout', 'content')}\n"
            f"Content points:\n"
        )
        for pt in page.get("content_points", []):
            page_prompt += f"- {pt}\n"
        if page.get("visual_suggestion"):
            page_prompt += f"\nVisual suggestion: {page['visual_suggestion']}\n"

        messages = [
            {"role": "system", "content": system_msg},
            {"role": "user", "content": page_prompt},
        ]

        svg_content = await chat_completion(messages, temperature=0.3, max_tokens=4096)

        svg_start = svg_content.find("<svg")
        svg_end = svg_content.rfind("</svg>")
        if svg_start >= 0 and svg_end >= 0:
            svg_content = svg_content[svg_start:svg_end + 6]
        else:
            svg_content = (
                f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}">'
                f'<rect width="100%" height="100%" fill="{theme.get("background_color", "#ffffff")}"/>'
                f'<text x="50%" y="50%" text-anchor="middle" font-size="32">'
                f'{page.get("title", "Slide")}</text></svg>'
            )

        svg_path = svg_dir / f"slide_{i + 1:03d}.svg"
        svg_path.write_text(svg_content, encoding="utf-8")
        logger.info("Generated SVG: %s", svg_path.name)

    return svg_dir
