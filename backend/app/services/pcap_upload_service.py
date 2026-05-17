import shutil
from pathlib import Path
from uuid import uuid4

from fastapi import UploadFile

from app.core.errors import NotFoundError, ValidationAppError
from app.domain.file_metadata import FileMetadata
from app.repositories.base import FileRepository


class PcapUploadService:
    def __init__(self, repository: FileRepository, pcap_dir: Path, max_upload_bytes: int) -> None:
        self.repository = repository
        self.pcap_dir = pcap_dir
        self.max_upload_bytes = max_upload_bytes
        self.pcap_dir.mkdir(parents=True, exist_ok=True)

    def list_files(self) -> list[FileMetadata]:
        return sorted(self.repository.list(), key=lambda item: item.uploaded_at, reverse=True)

    async def save_uploads(self, uploads: list[UploadFile]) -> list[FileMetadata]:
        saved: list[FileMetadata] = []
        for upload in uploads:
            filename = Path(upload.filename or "").name
            if not filename.lower().endswith((".pcap", ".pcapng")):
                raise ValidationAppError("Only .pcap and .pcapng files can be uploaded.")
            stored_filename = f"{uuid4()}_{filename}"
            target_path = self.pcap_dir / stored_filename
            size = 0
            with target_path.open("wb") as handle:
                while chunk := await upload.read(1024 * 1024):
                    size += len(chunk)
                    if size > self.max_upload_bytes:
                        target_path.unlink(missing_ok=True)
                        raise ValidationAppError("Uploaded file exceeds the configured size limit.")
                    handle.write(chunk)
            metadata = FileMetadata(
                filename=filename,
                stored_filename=stored_filename,
                size_bytes=size,
            )
            saved.append(self.repository.save(metadata))
        return saved

    def update_description(self, file_id: str, description: str) -> FileMetadata:
        return self.repository.update_description(file_id, description)

    def get_file_path(self, file_id: str) -> tuple[FileMetadata, Path]:
        metadata = self.repository.get(file_id)
        if metadata is None:
            raise NotFoundError("File was not found.")
        path = self.pcap_dir / metadata.stored_filename
        if not path.exists():
            raise NotFoundError("Stored pcap file was not found.")
        return metadata, path

    def delete_files(self, file_ids: list[str]) -> list[FileMetadata]:
        deleted: list[FileMetadata] = []
        for file_id in file_ids:
            metadata = self.repository.delete(file_id)
            (self.pcap_dir / metadata.stored_filename).unlink(missing_ok=True)
            deleted.append(metadata)
        return deleted

    def copy_generated_file(self, source: Path, metadata: FileMetadata) -> FileMetadata:
        target = self.pcap_dir / metadata.stored_filename
        shutil.copyfile(source, target)
        metadata.size_bytes = target.stat().st_size
        return self.repository.save(metadata)
