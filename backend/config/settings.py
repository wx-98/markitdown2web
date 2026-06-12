from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # ---- 应用 ----
    APP_NAME: str = "Everything2Markdown"
    DEBUG: bool = False
    SECRET_KEY: str = "change-me"

    # ---- 服务器 ----
    HOST: str = "0.0.0.0"
    PORT: int = 8001

    # ---- 数据库 ----
    DATABASE_URL: str = "sqlite:///./data/e2m.db"

    # ---- 文件存储 ----
    STORAGE_PATH: str = "./data/storage"
    EXPORT_PATH: str = "./data/exports"

    # ---- API 共享开关 ----
    USE_SHARED_API_CONFIG: bool = True

    # ---- LLM (文本生成) ----
    OPENAI_API_KEY: str = ""
    OPENAI_BASE_URL: str = "https://api.openai.com/v1"
    LLM_MODEL: str = "gpt-4o"

    # ---- VLM (视觉语言模型) ----
    VLM_API_KEY: str = ""
    VLM_BASE_URL: str = "https://api.openai.com/v1"
    VLM_MODEL: str = "gpt-4o"

    # ---- ASR (语音识别) ----
    ASR_API_KEY: str = ""
    ASR_BASE_URL: str = "https://api.openai.com/v1"
    ASR_MODEL: str = "whisper-1"

    # ---- 视频处理 ----
    MAX_VIDEO_DURATION: int = 3600
    MAX_VIDEO_SIZE_MB: int = 500
    FRAME_INTERVAL_SECONDS: int = 10

    # ---- 文档处理 ----
    MAX_FILE_SIZE_MB: int = 50

    # ---- 计算属性 ----

    @property
    def storage_dir(self) -> Path:
        p = Path(self.STORAGE_PATH)
        p.mkdir(parents=True, exist_ok=True)
        return p

    @property
    def export_dir(self) -> Path:
        p = Path(self.EXPORT_PATH)
        p.mkdir(parents=True, exist_ok=True)
        return p

    @property
    def vlm_api_key(self) -> str:
        if self.USE_SHARED_API_CONFIG or not self.VLM_API_KEY:
            return self.OPENAI_API_KEY
        return self.VLM_API_KEY

    @property
    def vlm_base_url(self) -> str:
        if self.USE_SHARED_API_CONFIG or not self.VLM_BASE_URL:
            return self.OPENAI_BASE_URL
        return self.VLM_BASE_URL

    @property
    def asr_api_key(self) -> str:
        if self.USE_SHARED_API_CONFIG or not self.ASR_API_KEY:
            return self.OPENAI_API_KEY
        return self.ASR_API_KEY

    @property
    def asr_base_url(self) -> str:
        if self.USE_SHARED_API_CONFIG or not self.ASR_BASE_URL:
            return self.OPENAI_BASE_URL
        return self.ASR_BASE_URL


settings = Settings()
