"""Key frame extraction from video files via ffmpeg."""

from __future__ import annotations

import asyncio
from pathlib import Path

from backend.config import settings


async def extract_frames(
    video_path: Path, output_dir: Path, interval: int | None = None
) -> list[Path]:
    """Extract frames at a fixed interval (seconds)."""
    interval = interval or settings.FRAME_INTERVAL_SECONDS
    frames_dir = output_dir / "frames"
    frames_dir.mkdir(exist_ok=True)

    cmd = [
        "ffmpeg", "-i", str(video_path),
        "-vf", f"fps=1/{interval}",
        "-q:v", "2",
        str(frames_dir / "frame_%04d.jpg"),
    ]
    proc = await asyncio.create_subprocess_exec(
        *cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE
    )
    _, stderr = await proc.communicate()
    if proc.returncode != 0:
        raise RuntimeError(f"ffmpeg frame extraction failed: {stderr.decode()}")

    return sorted(frames_dir.glob("frame_*.jpg"))
