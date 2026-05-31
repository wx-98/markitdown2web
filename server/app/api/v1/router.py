from fastapi import APIRouter

from app.api.v1.endpoints import convert

api_router = APIRouter()
api_router.include_router(convert.router)
