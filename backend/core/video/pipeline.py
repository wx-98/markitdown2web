"""Video processing pipeline: download → extract frames & audio → VLM + ASR → merge."""

from __future__ import annotations

import asyncio
import shutil
import tempfile
from pathlib import Path
from typing import Callable, Awaitable

from backend.core.video.asr import transcribe_audio
from backend.core.video.audio_extractor import extract_audio, split_audio
from backend.core.video.downloader import download_video
from backend.core.video.frame_extractor import extract_frames
from backend.core.video.vlm import analyze_images_batch
from backend.core.llm.prompts import VLM_FRAME_ANALYSIS

ProgressCallback = Callable[[int, str], Awaitable[None]] | None


async def process_video(
    url: str | None = None,
    file_path: Path | None = None,
    *,
    progress_callback: ProgressCallback = None,
) -> dict:
    """Full video processing pipeline.

    Returns dict with keys: transcript, frame_analysis, frames_count.
    """
    work_dir = Path(tempfile.mkdtemp(prefix="e2m_video_"))
    try:
        if progress_callback:
            await progress_callback(5, "准备处理视频...")

        # --- 1. Obtain video file ---
        if url:
            if progress_callback:
                await progress_callback(10, "正在下载视频...")
            video_path = await download_video(url, work_dir)
        elif file_path:
            video_path = file_path
        else:
            raise ValueError("Must provide either url or file_path")

        # --- 2. Parallel extraction ---
        if progress_callback:
            await progress_callback(25, "正在提取音频和关键帧...")

        audio_path, frames = await asyncio.gather(
            extract_audio(video_path, work_dir),
            extract_frames(video_path, work_dir),
        )

        # --- 3. ASR ---
        if progress_callback:
            await progress_callback(40, "正在进行语音识别...")

        transcript = ""
        if audio_path.exists():
            chunks = await split_audio(audio_path, work_dir)
            transcripts = []
            for i, chunk in enumerate(chunks):
                t = await transcribe_audio(chunk)
                transcripts.append(t)
                if progress_callback:
                    pct = 40 + int(20 * (i + 1) / len(chunks))
                    await progress_callback(pct, f"语音识别中 ({i+1}/{len(chunks)})...")
            transcript = "\n".join(transcripts)

        # --- 4. VLM ---
        if progress_callback:
            await progress_callback(65, "正在分析视频帧...")

        frame_analysis = ""
        if frames:
            batch_size = 10
            analyses = []
            for i in range(0, len(frames), batch_size):
                batch = frames[i : i + batch_size]
                analysis = await analyze_images_batch(batch, VLM_FRAME_ANALYSIS)
                analyses.append(analysis)
                if progress_callback:
                    pct = 65 + int(20 * (i + batch_size) / len(frames))
                    await progress_callback(min(pct, 85), "分析视频帧中...")
            frame_analysis = "\n\n".join(analyses)

        if progress_callback:
            await progress_callback(90, "处理完成")

        return {
            "transcript": transcript,
            "frame_analysis": frame_analysis,
            "frames_count": len(frames),
        }
    finally:
        shutil.rmtree(work_dir, ignore_errors=True)
