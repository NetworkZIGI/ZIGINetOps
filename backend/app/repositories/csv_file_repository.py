from datetime import datetime
from pathlib import Path

from app.core.errors import NotFoundError
from app.domain.file_metadata import FileMetadata
from app.repositories.base import FileRepository
from app.repositories.csv_store import CsvStore


FIELDS = [
    "id",
    "filename",
    "stored_filename",
    "description",
    "size_bytes",
    "uploaded_at",
    "is_obfuscated",
    "source_file_id",
    "mapping_group_id",
]


class CsvFileRepository(FileRepository):
    def __init__(self, csv_dir: Path) -> None:
        self.store = CsvStore(csv_dir / "files.csv", FIELDS)

    def list(self) -> list[FileMetadata]:
        return [self._from_row(row) for row in self.store.read_rows()]

    def get(self, file_id: str) -> FileMetadata | None:
        return next((item for item in self.list() if item.id == file_id), None)

    def save(self, metadata: FileMetadata) -> FileMetadata:
        rows = [self._to_row(item) for item in self.list()]
        rows.append(self._to_row(metadata))
        self.store.write_rows(rows)
        return metadata

    def update_description(self, file_id: str, description: str) -> FileMetadata:
        items = self.list()
        target: FileMetadata | None = None
        for item in items:
            if item.id == file_id:
                item.description = description
                target = item
                break
        if target is None:
            raise NotFoundError("File metadata was not found.")
        self.store.write_rows(self._to_row(item) for item in items)
        return target

    def delete(self, file_id: str) -> FileMetadata:
        items = self.list()
        target = next((item for item in items if item.id == file_id), None)
        if target is None:
            raise NotFoundError("File metadata was not found.")
        self.store.write_rows(self._to_row(item) for item in items if item.id != file_id)
        return target

    def _from_row(self, row: dict[str, str]) -> FileMetadata:
        return FileMetadata(
            id=row["id"],
            filename=row["filename"],
            stored_filename=row["stored_filename"],
            description=row.get("description", ""),
            size_bytes=int(row.get("size_bytes") or 0),
            uploaded_at=datetime.fromisoformat(row["uploaded_at"]),
            is_obfuscated=(row.get("is_obfuscated") or "").lower() == "true",
            source_file_id=row.get("source_file_id") or None,
            mapping_group_id=row.get("mapping_group_id") or None,
        )

    def _to_row(self, metadata: FileMetadata) -> dict[str, str]:
        return {
            "id": metadata.id,
            "filename": metadata.filename,
            "stored_filename": metadata.stored_filename,
            "description": metadata.description,
            "size_bytes": str(metadata.size_bytes),
            "uploaded_at": metadata.uploaded_at.isoformat(),
            "is_obfuscated": str(metadata.is_obfuscated),
            "source_file_id": metadata.source_file_id or "",
            "mapping_group_id": metadata.mapping_group_id or "",
        }
