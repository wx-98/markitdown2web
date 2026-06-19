"""LLM Strategist: analyse content and produce a structured design specification."""

from __future__ import annotations

import json
import logging

from backend.core.llm.client import chat_completion
from pptx_backend.config import PPT_MASTER_REFERENCES

logger = logging.getLogger(__name__)

_SYSTEM_PROMPT_TEMPLATE = """\
You are a professional presentation design strategist.
Analyse the provided content and create a detailed design specification for a {page_count}-page \
presentation in {canvas_format} format with a "{style}" style.

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

Output ONLY the JSON, no markdown fences.
"""


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

    messages = [
        {"role": "system", "content": system_msg},
        {"role": "user", "content": f"Create a presentation design spec for the following content:\n\n{content[:8000]}"},
    ]

    raw = await chat_completion(messages, temperature=0.4, max_tokens=4096)

    try:
        json.loads(raw)
    except json.JSONDecodeError:
        logger.warning("Strategist output is not valid JSON, wrapping as-is")

    return raw
