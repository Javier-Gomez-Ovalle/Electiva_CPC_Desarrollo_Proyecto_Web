import os
from dataclasses import dataclass


@dataclass
class Settings:
    PROJECT_NAME: str = "HeraUEBA Clinical SOC API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql://heraueba:heraueba_secret_2026@postgres:5432/heraueba",
    )
    POSTGRES_HOST: str = os.getenv("POSTGRES_HOST", "postgres")
    POSTGRES_PORT: int = int(os.getenv("POSTGRES_PORT", "5432"))
    POSTGRES_USER: str = os.getenv("POSTGRES_USER", "heraueba")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "heraueba_secret_2026")
    POSTGRES_DB: str = os.getenv("POSTGRES_DB", "heraueba")
    JWT_SECRET: str = os.getenv("JWT_SECRET", "heraueba-clinical-soc-secret-key-2026-hipaa-1581")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 720  # 12-hour shift
    AUTO_BLOCK_THRESHOLD: float = 0.98  # BR-001 strict threshold
    CRITICAL_UNITS: tuple = ("UCI", "Quirófano", "Urgencias")  # BR-002 strict exemption


settings = Settings()
