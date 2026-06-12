from fastapi import APIRouter

from backend.schemas.common import ApiResponse

router = APIRouter()


@router.get("/health")
async def health_check():
    return ApiResponse(data={"status": "ok"})
