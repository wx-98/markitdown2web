"""LLM Strategist: analyse content and produce a structured design specification."""

from __future__ import annotations

import json
import logging

from backend.core.llm.client import chat_completion
from pptx_backend.config import PPT_MASTER_REFERENCES

logger = logging.getLogger(__name__)

_SYSTEM_PROMPT_TEMPLATE = """\
You are a professional presentation design strategist.
Analyse the provided content and create a detailed design specification for a presentation \
in {canvas_format} format with a "{style}" style.

CRITICAL REQUIREMENT: The "pages" array MUST contain EXACTLY {page_count} page objects. \
Not more, not fewer. If the content is short, expand with related sub-topics, examples, \
summaries, Q&A, and appendix slides. If content is too long, merge and summarize.

Your output MUST be valid JSON with this structure:
{{
  "title": "Presentation title",
  "theme": {{
    "primary_color": "#hex",
    "secondary_color": "#hex",
    "background_color": "#hex",
    "font_family": "font name",
    "accent_color": "#hex"
  }},
  "pages": [
    {{
      "page_number": 1,
      "layout": "title|content|two_column|image_text|chart|closing",
      "title": "Page title",
      "content_points": ["point1", "point2"],
      "notes": "Speaker notes",
      "visual_suggestion": "Description of suggested visual"
    }}
  ]
}}

Remember: "pages" array must have EXACTLY {page_count} entries.
Output ONLY the JSON, no markdown fences.
"""

_MAX_TOKENS_BY_PAGES = {10: 4096, 20: 8192, 30: 12288}


def _pick_max_tokens(page_count: int) -> int:
    for threshold, tokens in sorted(_MAX_TOKENS_BY_PAGES.items()):
        if page_count <= threshold:
            return tokens
    return 16384


async def generate_design_spec(
    content: str,
    canvas_format: str = "ppt169",
    page_count: int = 10,
    style: str = "professional",
) -> str:
    strategist_ref = PPT_MASTER_REFERENCES / "strategist.md"
    extra_context = ""
    if strategist_ref.exists():
        extra_context = f"\n\nReference guidelines:\n{strategist_ref.read_text(encoding='utf-8')[:3000]}"

    system_msg = _SYSTEM_PROMPT_TEMPLATE.format(
        page_count=page_count,
        canvas_format=canvas_format,
        style=style,
    ) + extra_context

    max_tokens = _pick_max_tokens(page_count)

    messages = [
        {"role": "system", "content": system_msg},
        {"role": "user", "content": f"Create a presentation design spec for the following content:\n\n{content[:12000]}"},
    ]

    raw = await chat_completion(messages, temperature=0.4, max_tokens=max_tokens)
    spec = _validate_and_fix(raw, page_count, canvas_format, style)
    return spec


def _validate_and_fix(raw: str, expected_pages: int, canvas_format: str, style: str) -> str:
    """Validate the spec JSON and attempt to fix page count mismatches."""
    try:
        spec = json.loads(raw)
    except json.JSONDecodeError:
        logger.warning("Strategist output is not valid JSON")
        return raw

    pages = spec.get("pages", [])
    actual = len(pages)

    if actual == expected_pages:
        return raw

    logger.warning("Page count mismatch: expected %d, got %d — fixing", expected_pages, actual)

    if actual < expected_pages:
        theme = spec.get("theme", {})
        for i in range(actual, expected_pages):
            filler_layout = "content" if i < expected_pages - 1 else "closing"
            pages.append({
                "page_number": i + 1,
                "layout": filler_layout,
                "title": f"补充内容 {i + 1 - actual}" if filler_layout == "content" else "总结与展望",
                "content_points": ["（需要扩展的内容点）"],
                "notes": "",
                "visual_suggestion": "",
            })
    elif actual > expected_pages:
        pages = pages[:expected_pages]

    spec["pages"] = pages
    for i, p in enumerate(pages):
        p["page_number"] = i + 1

    return json.dumps(spec, ensure_ascii=False, indent=2)
