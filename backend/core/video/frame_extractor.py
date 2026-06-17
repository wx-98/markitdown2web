"""Key frame extraction from video files via ffmpeg."""

from __future__ import annotations

import asyncio
import subprocess
from pathlib import Path

from backend.config import settings


def _extract_frames_sync(video_path: Path, output_dir: Path, interval: int) -> list[Path]:
    frames_dir = output_dir / "frames"
    frames_dir.mkdir(exist_ok=True)

    cmd = [
        "ffmpeg", "-i", str(video_path),
        "-vf", f"fps=1/{interval}",
        "-q:v", "2",
        str(frames_dir / "frame_%04d.jpg"),
    ]
    result = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")
    if result.returncode != 0:
        raise RuntimeError(f"ffmpeg frame extraction failed: {result.stderr}")

    return sorted(frames_dir.glob("frame_*.jpg"))


async def extract_frames(
    video_path: Path, output_dir: Path, interval: int | None = None
) -> list[Path]:
    """Extract frames at a fixed interval (seconds)."""
    interval = interval or settings.FRAME_INTERVAL_SECONDS
    return await asyncio.to_thread(_extract_frames_sync, video_path, output_dir, interval)
