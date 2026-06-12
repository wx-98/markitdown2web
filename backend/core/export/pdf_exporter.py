from __future__ import annotations

from pathlib import Path

import markdown

from backend.core.export.base import BaseExporter

_HTML_TEMPLATE = """<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
body {{ font-family: "Microsoft YaHei", "Noto Sans SC", sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; line-height: 1.8; color: #333; }}
h1 {{ border-bottom: 2px solid #4f46e5; padding-bottom: 8px; }}
h2 {{ border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; }}
code {{ background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-size: 0.9em; }}
pre {{ background: #1e1e1e; color: #d4d4d4; padding: 16px; border-radius: 8px; overflow-x: auto; }}
blockquote {{ border-left: 4px solid #4f46e5; margin-left: 0; padding-left: 16px; color: #6b7280; }}
table {{ border-collapse: collapse; width: 100%; }}
th, td {{ border: 1px solid #d1d5db; padding: 8px 12px; text-align: left; }}
th {{ background: #f9fafb; }}
</style></head><body>{body}</body></html>"""


class PdfExporter(BaseExporter):
    def export(self, content: str, output_path: Path) -> Path:
        html_body = markdown.markdown(content, extensions=["extra", "codehilite", "toc"])
        html = _HTML_TEMPLATE.format(body=html_body)

        try:
            from weasyprint import HTML
            HTML(string=html).write_pdf(str(output_path))
        except Exception:
            html_path = output_path.with_suffix(".html")
            html_path.write_text(html, encoding="utf-8")
            return html_path

        return output_path
