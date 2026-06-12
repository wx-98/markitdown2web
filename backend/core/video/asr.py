"""ASR (Automatic Speech Recognition) via Whisper API."""

from __future__ import annotations

from pathlib import Path

from backend.config import settings
from backend.core.llm.client import get_asr_client


async def transcribe_audio(audio_path: str | Path) -> str:
    """Transcribe an audio file to text using the configured ASR provider."""
    client = get_asr_client()
    with open(audio_path, "rb") as f:
        resp = await client.audio.transcriptions.create(
            model=settings.ASR_MODEL,
            file=f,
            response_format="text",
        )
    return str(resp)
