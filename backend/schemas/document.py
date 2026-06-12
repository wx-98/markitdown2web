from __future__ import annotations

from pydantic import BaseModel


class DocumentConvertRequest(BaseModel):
    generate_summary: bool = True
    note_style: str = "detailed"
    use_vlm: bool = False  # VLM 增强模式：将 PDF 页面渲染为图片，用 VLM 精确识别公式/图表
