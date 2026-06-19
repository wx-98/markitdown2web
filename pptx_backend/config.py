"""PPTX module configuration — inherits from main backend settings."""

from __future__ import annotations

from pathlib import Path

from backend.config import settings


PPTX_PROJECTS_DIR = Path("data/pptx_projects")
PPTX_PROJECTS_DIR.mkdir(parents=True, exist_ok=True)

PPT_MASTER_ROOT = Path("ppt-master/skills/ppt-master")
PPT_MASTER_SCRIPTS = PPT_MASTER_ROOT / "scripts"
PPT_MASTER_TEMPLATES = PPT_MASTER_ROOT / "templates"
PPT_MASTER_REFERENCES = PPT_MASTER_ROOT / "references"

DEFAULT_CANVAS_FORMAT = "ppt169"
DEFAULT_PAGE_COUNT = 10
DEFAULT_STYLE = "professional"

LLM_MODEL = settings.LLM_MODEL
OPENAI_API_KEY = settings.OPENAI_API_KEY
OPENAI_BASE_URL = settings.OPENAI_BASE_URL
