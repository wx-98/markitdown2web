from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from backend.config import settings

_url = settings.DATABASE_URL
if _url.startswith("sqlite:///"):
    _url = _url.replace("sqlite:///", "sqlite+aiosqlite:///", 1)

engine = create_async_engine(_url, echo=settings.DEBUG)
async_session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def get_db() -> AsyncSession:  # type: ignore[misc]
    async with async_session_factory() as session:
        yield session
