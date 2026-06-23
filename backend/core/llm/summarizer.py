"""LLM-based content summarization and note generation."""

from __future__ import annotations

from typing import Callable, Awaitable

from backend.core.llm.client import chat_completion, chat_completion_stream
from backend.core.llm.prompts import STYLE_PROMPTS, SYSTEM_SUMMARIZER, TITLE_SYSTEM


def _build_summarize_messages(content: str, style: str, source_type: str, extra_context: str):
    style_prompt = STYLE_PROMPTS.get(style, STYLE_PROMPTS["detailed"])
    user_msg = f"{style_prompt}\n\n"
    if extra_context:
        user_msg += f"额外上下文：{extra_context}\n\n"
    user_msg += f"来源类型：{source_type}\n\n---\n\n{content}"
    if len(user_msg) > 120_000:
        user_msg = user_msg[:120_000] + "\n\n[内容已截断...]"
    return [
        {"role": "system", "content": SYSTEM_SUMMARIZER},
        {"role": "user", "content": user_msg},
    ]


async def summarize_content(
    content: str,
    *,
    style: str = "detailed",
    source_type: str = "text",
    extra_context: str = "",
) -> str:
    """Generate structured Markdown learning notes from raw content."""
    messages = _build_summarize_messages(content, style, source_type, extra_context)
    return await chat_completion(messages, max_tokens=8192)


async def summarize_content_stream(
    content: str,
    *,
    style: str = "detailed",
    source_type: str = "text",
    extra_context: str = "",
    on_token: Callable[[str], Awaitable[None]] | None = None,
) -> str:
    """Streaming variant — calls *on_token* for each chunk."""
    messages = _build_summarize_messages(content, style, source_type, extra_context)
    return await chat_completion_stream(messages, max_tokens=8192, on_token=on_token)


async def generate_title(content: str) -> str:
    """Generate a concise title for the content."""
    messages = [
        {"role": "system", "content": TITLE_SYSTEM},
        {"role": "user", "content": content[:3000]},
    ]
    return (await chat_completion(messages, max_tokens=100)).strip().strip('"\'')
