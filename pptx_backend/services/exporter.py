"""Export SVG slides to a .pptx file.

Uses python-pptx to create a presentation. If ppt-master's svg_to_pptx scripts
are available they will be used; otherwise a built-in fallback handles the conversion.
"""

from __future__ import annotations

import asyncio
import logging
import subprocess
import sys
from pathlib import Path

from pptx_backend.config import PPT_MASTER_SCRIPTS

logger = logging.getLogger(__name__)

_CANVAS_SIZES = {
    "ppt169": (13335400, 7559675),  # EMU for 16:9
    "ppt43": (9144000, 6858000),    # EMU for 4:3
}


async def export_pptx(
    svg_dir: Path,
    workspace: Path,
    canvas_format: str = "ppt169",
) -> Path:
    """Convert SVG slides to a .pptx file."""
    output_path = workspace / "output.pptx"

    svg_to_pptx_script = PPT_MASTER_SCRIPTS / "svg_to_pptx" / "svg_to_pptx.py"
    if svg_to_pptx_script.exists():
        return await _export_via_ppt_master(svg_dir, output_path, svg_to_pptx_script, canvas_format)

    return await _export_builtin(svg_dir, output_path, canvas_format)


async def _export_via_ppt_master(
    svg_dir: Path,
    output_path: Path,
    script: Path,
    canvas_format: str,
) -> Path:
    """Delegate to ppt-master's svg_to_pptx script."""
    cmd = [
        sys.executable,
        str(script),
        "--input-dir", str(svg_dir),
        "--output", str(output_path),
        "--format", canvas_format,
    ]
    proc = await asyncio.to_thread(
        subprocess.run, cmd, capture_output=True, text=True, encoding="utf-8", errors="replace"
    )
    if proc.returncode != 0:
        logger.warning("ppt-master export failed: %s", proc.stderr[:500])
        return await _export_builtin(svg_dir, output_path, canvas_format)
    return output_path


async def _export_builtin(
    svg_dir: Path,
    output_path: Path,
    canvas_format: str,
) -> Path:
    """Built-in fallback: embed SVG content as images in python-pptx."""
    from pptx import Presentation
    from pptx.util import Emu

    def _build():
        prs = Presentation()
        w, h = _CANVAS_SIZES.get(canvas_format, _CANVAS_SIZES["ppt169"])
        prs.slide_width = Emu(w)
        prs.slide_height = Emu(h)

        blank_layout = prs.slide_layouts[6]  # blank slide

        svg_files = sorted(svg_dir.glob("*.svg"))
        if not svg_files:
            slide = prs.slides.add_slide(blank_layout)
            from pptx.util import Pt
            from pptx.util import Inches
            txBox = slide.shapes.add_textbox(Inches(1), Inches(1), Inches(8), Inches(2))
            txBox.text_frame.text = "No SVG content was generated"

        for svg_file in svg_files:
            slide = prs.slides.add_slide(blank_layout)

            try:
                import cairosvg
                png_path = svg_file.with_suffix(".png")
                cairosvg.svg2png(
                    url=str(svg_file),
                    write_to=str(png_path),
                    output_width=1280,
                    output_height=720,
                )
                slide.shapes.add_picture(str(png_path), Emu(0), Emu(0), Emu(w), Emu(h))
            except ImportError:
                from pptx.util import Inches, Pt
                txBox = slide.shapes.add_textbox(Inches(0.5), Inches(0.5), Inches(9), Inches(6))
                svg_text = svg_file.read_text(encoding="utf-8")
                title_start = svg_text.find("<text")
                if title_start > 0:
                    title_end = svg_text.find("</text>", title_start)
                    if title_end > 0:
                        inner = svg_text[title_start:title_end]
                        inner = inner[inner.find(">") + 1:]
                        txBox.text_frame.text = inner
                    else:
                        txBox.text_frame.text = svg_file.stem
                else:
                    txBox.text_frame.text = svg_file.stem

        prs.save(str(output_path))

    await asyncio.to_thread(_build)
    return output_path
