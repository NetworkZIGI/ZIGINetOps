from datetime import UTC, datetime
from uuid import uuid4

from pydantic import BaseModel, Field


class ChatSession(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    mode: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


class ChatMessage(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    session_id: str
    role: str
    content: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
