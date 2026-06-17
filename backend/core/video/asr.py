"""ASR (Automatic Speech Recognition) via OpenAI-compatible Whisper API."""

from __future__ import annotations

import logging
from pathlib import Path

from backend.config import settings
from backend.core.llm.client import get_asr_client

logger = logging.getLogger(__name__)

MAX_RETRIES = 2


async def transcribe_audio(audio_path: str | Path) -> str:
    """Transcribe an audio file. Returns empty string on failure instead of raising."""
    if not settings.ASR_ENABLED:
        logger.info("ASR 已禁用（ASR_ENABLED=false），跳过音频转录")
        return ""

    client = get_asr_client()

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            with open(audio_path, "rb") as f:
                resp = await client.audio.transcriptions.create(
                    model=settings.ASR_MODEL,
                    file=f,
                    response_format="text",
                )
            return str(resp)
        except Exception as exc:
            logger.warning(
                "ASR 转录失败 (尝试 %d/%d): %s: %s",
                attempt,
                MAX_RETRIES,
                type(exc).__name__,
                exc,
            )
            if attempt == MAX_RETRIES:
                logger.error(
                    "ASR 转录最终失败，跳过音频转录。"
                    "请检查 ASR 配置：当前 ASR_BASE_URL=%s, ASR_MODEL=%s。"
                    "如果你的 API 不支持 Whisper 音频转录端点，"
                    "请在 .env 中设置 ASR_ENABLED=false。",
                    settings.asr_base_url,
                    settings.ASR_MODEL,
                )
                return ""
    return ""
