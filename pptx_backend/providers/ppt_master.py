"""ppt-master based PPTX provider implementation."""

from __future__ import annotations

import logging
from pathlib import Path

from pptx_backend.providers.base import PptxProvider
from pptx_backend.services.strategist import generate_design_spec
from pptx_backend.services.executor import generate_svgs
from pptx_backend.services.exporter import export_pptx
from pptx_backend.utils.workspace import create_workspace

logger = logging.getLogger(__name__)


class PptMasterProvider(PptxProvider):
    """Generate PPTX using LLM + SVG pipeline inspired by ppt-master."""

    async def generate(self, content: str, options: dict) -> Path:
        canvas_format = options.get("canvas_format", "ppt169")
        page_count = options.get("page_count", 10)
        style = options.get("style", "professional")
        job_id = options.get("job_id", "standalone")

        workspace = create_workspace(job_id)

        design_spec = await generate_design_spec(
            content=content,
            canvas_format=canvas_format,
            page_count=page_count,
            style=style,
        )

        svg_dir = await generate_svgs(
            design_spec=design_spec,
            workspace=workspace,
            canvas_format=canvas_format,
        )

        output_path = await export_pptx(
            svg_dir=svg_dir,
            workspace=workspace,
            canvas_format=canvas_format,
        )

        logger.info("PptMasterProvider generated: %s", output_path)
        return output_path
