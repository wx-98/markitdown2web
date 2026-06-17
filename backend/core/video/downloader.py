"""Video downloading via yt-dlp."""

from __future__ import annotations

import asyncio
import subprocess
from pathlib import Path


def _download_sync(url: str, output_dir: Path) -> Path:
    output_template = str(output_dir / "%(title)s.%(ext)s")
    cmd = [
        "yt-dlp",
        "--no-playlist",
        "-f", "bestvideo[height<=1080]+bestaudio/best[height<=1080]/best",
        "--merge-output-format", "mp4",
        "-o", output_template,
        url,
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(f"yt-dlp failed: {result.stderr}")

    mp4_files = list(output_dir.glob("*.mp4"))
    if not mp4_files:
        all_files = list(output_dir.iterdir())
        if all_files:
            return all_files[0]
        raise FileNotFoundError("No video file downloaded")
    return mp4_files[0]


async def download_video(url: str, output_dir: Path) -> Path:
    """Download a video and return the local file path."""
    return await asyncio.to_thread(_download_sync, url, output_dir)
