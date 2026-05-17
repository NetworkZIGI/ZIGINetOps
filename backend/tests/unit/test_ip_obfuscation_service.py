from pathlib import Path

from app.domain.obfuscation_mapping import ObfuscationMapping
from app.repositories.base import FileRepository, ObfuscationRepository
from app.services.ip_obfuscation_service import IpObfuscationService


class EmptyFileRepository(FileRepository):
    def list(self):
        return []

    def get(self, file_id: str):
        return None

    def save(self, metadata):
        return metadata

    def update_description(self, file_id: str, description: str):
        raise NotImplementedError

    def delete(self, file_id: str):
        raise NotImplementedError


class MemoryObfuscationRepository(ObfuscationRepository):
    def __init__(self):
        self.rows: list[ObfuscationMapping] = []

    def save_many(self, mappings):
        self.rows.extend(mappings)
        return mappings

    def list_by_group(self, group_id: str):
        return [row for row in self.rows if row.group_id == group_id]

    def find_by_original_ip(self, original_ip: str):
        return next((row for row in self.rows if row.original_ip == original_ip), None)


def make_service() -> IpObfuscationService:
    return IpObfuscationService(
        EmptyFileRepository(),
        MemoryObfuscationRepository(),
        Path("/tmp"),
        "10.0.0.0/8",
        "fd00::/8",
    )


def test_ipv4_obfuscation_is_deterministic_and_preserves_subnet_bucket():
    service = make_service()

    first = service.obfuscate_ip("192.168.10.10")
    second = service.obfuscate_ip("192.168.10.10")
    same_subnet_peer = service.obfuscate_ip("192.168.10.20")

    assert first == second
    assert first.startswith("10.")
    assert ".".join(first.split(".")[:3]) == ".".join(same_subnet_peer.split(".")[:3])


def test_ipv6_obfuscation_is_valid_and_deterministic():
    service = make_service()

    first = service.obfuscate_ip("2001:db8:abcd::1")
    second = service.obfuscate_ip("2001:db8:abcd::1")

    assert first == second
    assert first.startswith("fd")
