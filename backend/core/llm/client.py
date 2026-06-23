"""Unified LLM / VLM / ASR client wrapping the OpenAI SDK.

Three independent client instances are managed so that LLM, VLM and ASR
can each point to different API endpoints / keys when
``USE_SHARED_API_CONFIG=false``.
"""

from __future__ import annotations

from openai import AsyncOpenAI

from backend.config import settings

_llm_client: AsyncOpenAI | None = None
_vlm_client: AsyncOpenAI | None = None
_asr_client: AsyncOpenAI | None = None


def get_llm_client() -> AsyncOpenAI:
    global _llm_client
    if _llm_client is None:
        _llm_client = AsyncOpenAI(
            api_key=settings.OPENAI_API_KEY,
            base_url=settings.OPENAI_BASE_URL,
        )
    return _llm_client


def get_vlm_client() -> AsyncOpenAI:
    global _vlm_client
    if _vlm_client is None:
        _vlm_client = AsyncOpenAI(
            api_key=settings.vlm_api_key,
            base_url=settings.vlm_base_url,
        )
    return _vlm_client


def get_asr_client() -> AsyncOpenAI:
    global _asr_client
    if _asr_client is None:
        _asr_client = AsyncOpenAI(
            api_key=settings.asr_api_key,
            base_url=settings.asr_base_url,
        )
    return _asr_client


async def chat_completion(
    messages: list[dict],
    *,
    model: str | None = None,
    temperature: float = 0.7,
    max_tokens: int = 4096,
) -> str:
    client = get_llm_client()
    resp = await client.chat.completions.create(
        model=model or settings.LLM_MODEL,
        messages=messages,
        temperature=temperature,
        max_tokens=max_tokens,
    )
    return resp.choices[0].message.content or ""


async def chat_completion_stream(
    messages: list[dict],
    *,
    model: str | None = None,
    temperature: float = 0.7,
    max_tokens: int = 4096,
    on_token=None,
):
    """Streaming variant — yields tokens and optionally calls *on_token(chunk_str)*."""
    client = get_llm_client()
    stream = await client.chat.completions.create(
        model=model or settings.LLM_MODEL,
        messages=messages,
        temperature=temperature,
        max_tokens=max_tokens,
        stream=True,
    )
    parts: list[str] = []
    async for chunk in stream:
        delta = chunk.choices[0].delta if chunk.choices else None
        if delta and delta.content:
            parts.append(delta.content)
            if on_token:
                await on_token(delta.content)
    return "".join(parts)
