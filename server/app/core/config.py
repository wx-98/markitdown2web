from pathlib import Path

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "MarkItDown Web"
    API_V1_PREFIX: str = "/api/v1"
    MAX_UPLOAD_SIZE_MB: int = 50
    UPLOAD_DIR: Path = Path("/tmp/markitdown_uploads")

    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]

    model_config = {"env_prefix": "MARKITDOWN_"}


settings = Settings()
settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
