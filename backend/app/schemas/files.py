from datetime import datetime

from pydantic import BaseModel


class FileMetadataResponse(BaseModel):
    id: str
    filename: str
    description: str
    size_bytes: int
    uploaded_at: datetime
    is_obfuscated: bool
    source_file_id: str | None = None
    mapping_group_id: str | None = None


class FileDescriptionUpdate(BaseModel):
    description: str


class BulkFileActionRequest(BaseModel):
    file_ids: list[str]


class ObfuscationMappingResponse(BaseModel):
    original_ip: str
    obfuscated_ip: str
    ip_version: int
