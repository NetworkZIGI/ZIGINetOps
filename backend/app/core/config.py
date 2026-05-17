from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "ZIGINetOps AIOps Portal"
    app_env: str = "local"
    api_prefix: str = "/api"
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    cors_origin_regex: str = (
        r"https?://(localhost|127\.0\.0\.1|0\.0\.0\.0|"
        r"192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?"
    )
    storage_dir: Path = Path("app/storage")
    max_upload_bytes: int = 100 * 1024 * 1024

    aws_region: str = "ap-northeast-2"
    bedrock_model_id: str = "anthropic.claude-3-sonnet-20240229-v1:0"
    bedrock_timeout_seconds: int = 60
    bedrock_max_tokens: int = 2048
    bedrock_temperature: float = 0.2

    ipv4_obfuscation_network: str = Field(default="10.0.0.0/8")
    ipv6_obfuscation_network: str = Field(default="fd00::/8")

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def pcap_dir(self) -> Path:
        return self.storage_dir / "pcap_file"

    @property
    def csv_dir(self) -> Path:
        return self.storage_dir / "csv"


@lru_cache
def get_settings() -> Settings:
    return Settings()
