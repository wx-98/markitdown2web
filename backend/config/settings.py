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
    FRONTEND_URL: str = "http://localhost:3000"

    # ---- 数据库 (MySQL) ----
    DATABASE_URL: str = "mysql+asyncmy://root:root@localhost:3306/e2m"

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
    ASR_ENABLED: bool = True
    ASR_API_KEY: str = ""
    ASR_BASE_URL: str = "https://api.openai.com/v1"
    ASR_MODEL: str = "whisper-1"

    # ---- 视频处理 ----
    MAX_VIDEO_DURATION: int = 3600
    MAX_VIDEO_SIZE_MB: int = 500
    FRAME_INTERVAL_SECONDS: int = 10

    # ---- 文档处理 ----
    MAX_FILE_SIZE_MB: int = 50

    # ---- JWT ----
    JWT_SECRET_KEY: str = "change-me-jwt-secret"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 1440

    # ---- Google OAuth ----
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = "http://localhost:3000/auth/google/callback"

    # ---- Email SMTP ----
    SMTP_GMAIL_HOST: str = "smtp.gmail.com"
    SMTP_GMAIL_PORT: int = 587
    SMTP_GMAIL_USERNAME: str = ""
    SMTP_GMAIL_PASSWORD: str = ""
    SMTP_QQ_HOST: str = "smtp.qq.com"
    SMTP_QQ_PORT: int = 587
    SMTP_QQ_USERNAME: str = ""
    SMTP_QQ_PASSWORD: str = ""

    # ---- SMS ----
    SMS_PROVIDER: str = "aliyun"
    ALIYUN_ACCESS_KEY_ID: str = ""
    ALIYUN_ACCESS_KEY_SECRET: str = ""
    ALIYUN_SMS_SIGN_NAME: str = ""
    ALIYUN_SMS_TEMPLATE_CODE: str = ""
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_PHONE_NUMBER: str = ""

    # ---- Stripe ----
    STRIPE_SECRET_KEY: str = ""
    STRIPE_PUBLISHABLE_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""
    STRIPE_PRICE_ID_MONTHLY: str = ""

    # ---- WeChat Pay ----
    WECHAT_APP_ID: str = ""
    WECHAT_MCH_ID: str = ""
    WECHAT_API_KEY: str = ""
    WECHAT_NOTIFY_URL: str = ""

    # ---- Alipay ----
    ALIPAY_APP_ID: str = ""
    ALIPAY_PRIVATE_KEY: str = ""
    ALIPAY_PUBLIC_KEY: str = ""
    ALIPAY_NOTIFY_URL: str = ""

    # ---- Pricing ----
    MONTHLY_PRICE_CNY: int = 2900
    MONTHLY_PRICE_USD: int = 999

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
