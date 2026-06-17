from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.config import settings
from backend.db import engine
from backend.models import Base


@asynccontextmanager
async def lifespan(_app: FastAPI):
    Path("data").mkdir(exist_ok=True)
    settings.storage_dir
    settings.export_dir
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from backend.middleware.tracking_middleware import TrackingMiddleware  # noqa: E402

app.add_middleware(TrackingMiddleware)

from backend.api.v1.router import api_router  # noqa: E402

app.include_router(api_router, prefix="/api/v1")

app.mount("/exports", StaticFiles(directory=str(settings.export_dir)), name="exports")
