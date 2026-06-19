"""Workspace management for PPTX generation jobs."""

from __future__ import annotations

import shutil
from pathlib import Path

from pptx_backend.config import PPTX_PROJECTS_DIR


def create_workspace(job_id: str) -> Path:
    workspace = PPTX_PROJECTS_DIR / job_id
    workspace.mkdir(parents=True, exist_ok=True)
    return workspace


def get_workspace(job_id: str) -> Path:
    return PPTX_PROJECTS_DIR / job_id


def cleanup_workspace(job_id: str) -> None:
    workspace = PPTX_PROJECTS_DIR / job_id
    if workspace.exists():
        shutil.rmtree(workspace)
