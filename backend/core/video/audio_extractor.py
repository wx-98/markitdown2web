"""Audio extraction and chunking from video files via ffmpeg."""

from __future__ import annotations

import asyncio
import subprocess
from pathlib import Path


def _extract_audio_sync(video_path: Path, output_dir: Path) -> Path:
    audio_path = output_dir / "audio.wav"
    cmd = [
        "ffmpeg", "-i", str(video_path),
        "-vn", "-acodec", "pcm_s16le", "-ar", "16000", "-ac", "1",
        "-y", str(audio_path),
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(f"ffmpeg audio extraction failed: {result.stderr}")
    return audio_path


async def extract_audio(video_path: Path, output_dir: Path) -> Path:
    """Extract audio track to WAV using ffmpeg."""
    return await asyncio.to_thread(_extract_audio_sync, video_path, output_dir)


def _split_audio_sync(audio_path: Path, output_dir: Path, chunk_seconds: int = 600) -> list[Path]:
    """Split a long audio file into chunks."""
    result = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=noprint_wrappers=1:nokey=1", str(audio_path)],
        capture_output=True, text=True,
    )
    duration = float(result.stdout.strip()) if result.stdout.strip() else 0
    if duration <= chunk_seconds:
        return [audio_path]

    chunks: list[Path] = []
    start = 0
    idx = 0
    while start < duration:
        chunk_path = output_dir / f"chunk_{idx:03d}.wav"
        subprocess.run(
            ["ffmpeg", "-i", str(audio_path), "-ss", str(start),
             "-t", str(chunk_seconds), "-y", str(chunk_path)],
            capture_output=True,
        )
        if chunk_path.exists() and chunk_path.stat().st_size > 0:
            chunks.append(chunk_path)
        start += chunk_seconds
        idx += 1
    return chunks


async def split_audio(audio_path: Path, output_dir: Path) -> list[Path]:
    return await asyncio.to_thread(_split_audio_sync, audio_path, output_dir)
