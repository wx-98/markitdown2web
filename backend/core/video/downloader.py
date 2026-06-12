"""Video downloading via yt-dlp."""

from __future__ import annotations

import asyncio
from pathlib import Path


async def download_video(url: str, output_dir: Path) -> Path:
    """Download a video and return the local file path."""
    output_template = str(output_dir / "%(title)s.%(ext)s")
    cmd = [
        "yt-dlp",
        "--no-playlist",
        "-f", "bestvideo[height<=1080]+bestaudio/best[height<=1080]/best",
        "--merge-output-format", "mp4",
        "-o", output_template,
        url,
    ]
    proc = await asyncio.create_subprocess_exec(
        *cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE
    )
    stdout, stderr = await proc.communicate()
    if proc.returncode != 0:
        raise RuntimeError(f"yt-dlp failed: {stderr.decode()}")

    mp4_files = list(output_dir.glob("*.mp4"))
    if not mp4_files:
        all_files = list(output_dir.iterdir())
        if all_files:
            return all_files[0]
        raise FileNotFoundError("No video file downloaded")
    return mp4_files[0]
