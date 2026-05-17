from datetime import datetime
from pathlib import Path

from app.domain.obfuscation_mapping import ObfuscationMapping
from app.repositories.base import ObfuscationRepository
from app.repositories.csv_store import CsvStore


FIELDS = ["id", "group_id", "original_ip", "obfuscated_ip", "ip_version", "created_at"]


class CsvObfuscationRepository(ObfuscationRepository):
    def __init__(self, csv_dir: Path) -> None:
        self.store = CsvStore(csv_dir / "obfuscation_mappings.csv", FIELDS)

    def save_many(self, mappings: list[ObfuscationMapping]) -> list[ObfuscationMapping]:
        existing = self.store.read_rows()
        seen = {(row["group_id"], row["original_ip"]) for row in existing}
        for mapping in mappings:
            key = (mapping.group_id, mapping.original_ip)
            if key in seen:
                continue
            existing.append(self._to_row(mapping))
            seen.add(key)
        self.store.write_rows(existing)
        return mappings

    def list_by_group(self, group_id: str) -> list[ObfuscationMapping]:
        return [self._from_row(row) for row in self.store.read_rows() if row["group_id"] == group_id]

    def find_by_original_ip(self, original_ip: str) -> ObfuscationMapping | None:
        for row in self.store.read_rows():
            if row["original_ip"] == original_ip:
                return self._from_row(row)
        return None

    def _from_row(self, row: dict[str, str]) -> ObfuscationMapping:
        return ObfuscationMapping(
            id=row["id"],
            group_id=row["group_id"],
            original_ip=row["original_ip"],
            obfuscated_ip=row["obfuscated_ip"],
            ip_version=int(row["ip_version"]),
            created_at=datetime.fromisoformat(row["created_at"]),
        )

    def _to_row(self, mapping: ObfuscationMapping) -> dict[str, str]:
        return {
            "id": mapping.id,
            "group_id": mapping.group_id,
            "original_ip": mapping.original_ip,
            "obfuscated_ip": mapping.obfuscated_ip,
            "ip_version": str(mapping.ip_version),
            "created_at": mapping.created_at.isoformat(),
        }
