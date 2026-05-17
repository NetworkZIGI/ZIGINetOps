from datetime import UTC, datetime
from uuid import uuid4

from pydantic import BaseModel, Field


class ObfuscationMapping(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    group_id: str
    original_ip: str
    obfuscated_ip: str
    ip_version: int
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
