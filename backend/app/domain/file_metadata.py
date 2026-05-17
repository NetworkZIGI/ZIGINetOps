from datetime import UTC, datetime
from pathlib import Path
from uuid import uuid4

from pydantic import BaseModel, Field


class FileMetadata(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    filename: str
    stored_filename: str
    description: str = ""
    size_bytes: int = 0
    uploaded_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    is_obfuscated: bool = False
    source_file_id: str | None = None
    mapping_group_id: str | None = None

    @property
    def path_name(self) -> str:
        return Path(self.stored_filename).name
