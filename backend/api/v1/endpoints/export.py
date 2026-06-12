from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from backend.api.deps import get_db
from backend.schemas.export import ExportRequest
from backend.services.export_service import do_export, get_conversion_result

router = APIRouter()


@router.post("/{result_id}")
async def export_result(
    result_id: str,
    body: ExportRequest,
    db: AsyncSession = Depends(get_db),
):
    return await do_export(db, result_id, body.format)


@router.get("/result/{result_id}")
async def get_result(result_id: str, db: AsyncSession = Depends(get_db)):
    return await get_conversion_result(db, result_id)
