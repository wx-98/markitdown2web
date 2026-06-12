"""Audio extraction and chunking from video files via ffmpeg."""

from __future__ import annotations

import asyncio
import subprocess
from pathlib import Path


async def extract_audio(video_path: Path, output_dir: Path) -> Path:
    """Extract audio track to WAV using ffmpeg."""
    audio_path = output_dir / "audio.wav"
    cmd = [
        "ffmpeg", "-i", str(video_path),
        "-vn", "-acodec", "pcm_s16le", "-ar", "16000", "-ac", "1",
        "-y", str(audio_path),
    ]
    proc = await asyncio.create_subprocess_exec(
        *cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE
    )
    _, stderr = await proc.communicate()
    if proc.returncode != 0:
        raise RuntimeError(f"ffmpeg audio extraction failed: {stderr.decode()}")
    return audio_path


def _split_audio_sync(audio_path: Path, output_dir: Path, chunk_seconds: int = 600) -> list[Path]:
    """Split a long audio file into chunks (sync, runs in executor)."""
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
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(None, _split_audio_sync, audio_path, output_dir)
