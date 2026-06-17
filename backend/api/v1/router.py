from fastapi import APIRouter

from backend.api.v1.endpoints import (
    admin,
    auth,
    document,
    export,
    files,
    health,
    payment,
    tasks,
    tracking,
    url,
    video,
)

api_router = APIRouter()

api_router.include_router(health.router, tags=["health"])
api_router.include_router(auth.router)
api_router.include_router(payment.router)
api_router.include_router(tracking.router)
api_router.include_router(admin.router)
api_router.include_router(video.router, prefix="/video", tags=["video"])
api_router.include_router(url.router, prefix="/url", tags=["url"])
api_router.include_router(document.router, prefix="/document", tags=["document"])
api_router.include_router(export.router, prefix="/export", tags=["export"])
api_router.include_router(tasks.router, prefix="/tasks", tags=["tasks"])
api_router.include_router(files.router, prefix="/files", tags=["files"])
