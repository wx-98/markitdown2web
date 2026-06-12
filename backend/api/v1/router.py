from fastapi import APIRouter

from backend.api.v1.endpoints import document, export, files, health, tasks, url, video

api_router = APIRouter()

api_router.include_router(health.router, tags=["health"])
api_router.include_router(video.router, prefix="/video", tags=["video"])
api_router.include_router(url.router, prefix="/url", tags=["url"])
api_router.include_router(document.router, prefix="/document", tags=["document"])
api_router.include_router(export.router, prefix="/export", tags=["export"])
api_router.include_router(tasks.router, prefix="/tasks", tags=["tasks"])
api_router.include_router(files.router, prefix="/files", tags=["files"])
