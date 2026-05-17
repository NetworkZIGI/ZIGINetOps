import hashlib
import ipaddress
from pathlib import Path
from uuid import uuid4

from scapy.all import IP, IPv6, PcapReader, PcapWriter  # type: ignore[import-untyped]

from app.domain.file_metadata import FileMetadata
from app.domain.obfuscation_mapping import ObfuscationMapping
from app.repositories.base import FileRepository, ObfuscationRepository


class IpObfuscationService:
    def __init__(
        self,
        file_repository: FileRepository,
        obfuscation_repository: ObfuscationRepository,
        pcap_dir: Path,
        ipv4_network: str,
        ipv6_network: str,
    ) -> None:
        self.file_repository = file_repository
        self.obfuscation_repository = obfuscation_repository
        self.pcap_dir = pcap_dir
        self.ipv4_network = ipaddress.ip_network(ipv4_network)
        self.ipv6_network = ipaddress.ip_network(ipv6_network)

    def obfuscate_files(self, file_ids: list[str]) -> list[FileMetadata]:
        generated: list[FileMetadata] = []
        for file_id in file_ids:
            metadata = self.file_repository.get(file_id)
            if metadata is None:
                continue
            group_id = str(uuid4())
            source_path = self.pcap_dir / metadata.stored_filename
            generated_filename = f"modi_{metadata.filename}"
            stored_filename = f"{uuid4()}_{generated_filename}"
            target_path = self.pcap_dir / stored_filename
            mappings = self._rewrite_pcap(source_path, target_path, group_id)
            self.obfuscation_repository.save_many(mappings)
            generated.append(
                self.file_repository.save(
                    FileMetadata(
                        filename=generated_filename,
                        stored_filename=stored_filename,
                        size_bytes=target_path.stat().st_size,
                        is_obfuscated=True,
                        source_file_id=metadata.id,
                        mapping_group_id=group_id,
                    )
                )
            )
        return generated

    def list_mapping(self, file_id: str) -> list[ObfuscationMapping]:
        metadata = self.file_repository.get(file_id)
        if metadata is None or not metadata.mapping_group_id:
            return []
        return self.obfuscation_repository.list_by_group(metadata.mapping_group_id)

    def obfuscate_ip(self, original_ip: str) -> str:
        normalized = str(ipaddress.ip_address(original_ip))
        existing = self.obfuscation_repository.find_by_original_ip(normalized)
        if existing is not None:
            return existing.obfuscated_ip
        return self._deterministic_obfuscated_ip(normalized)

    def _rewrite_pcap(
        self,
        source_path: Path,
        target_path: Path,
        group_id: str,
    ) -> list[ObfuscationMapping]:
        discovered: dict[str, ObfuscationMapping] = {}
        with PcapReader(str(source_path)) as reader, PcapWriter(str(target_path), sync=True) as writer:
            for packet in reader:
                if IP in packet:
                    layer = packet[IP]
                    layer.src = self._map_ip(layer.src, group_id, discovered)
                    layer.dst = self._map_ip(layer.dst, group_id, discovered)
                    self._reset_checksums(layer)
                if IPv6 in packet:
                    layer6 = packet[IPv6]
                    layer6.src = self._map_ip(layer6.src, group_id, discovered)
                    layer6.dst = self._map_ip(layer6.dst, group_id, discovered)
                    self._reset_checksums(layer6)
                writer.write(packet)
        return list(discovered.values())

    def _map_ip(
        self,
        original_ip: str,
        group_id: str,
        discovered: dict[str, ObfuscationMapping],
    ) -> str:
        normalized = str(ipaddress.ip_address(original_ip))
        if normalized in discovered:
            return discovered[normalized].obfuscated_ip
        existing = self.obfuscation_repository.find_by_original_ip(normalized)
        obfuscated = existing.obfuscated_ip if existing else self._deterministic_obfuscated_ip(normalized)
        mapping = ObfuscationMapping(
            group_id=group_id,
            original_ip=normalized,
            obfuscated_ip=obfuscated,
            ip_version=ipaddress.ip_address(normalized).version,
        )
        discovered[normalized] = mapping
        return obfuscated

    def _deterministic_obfuscated_ip(self, original_ip: str) -> str:
        ip_obj = ipaddress.ip_address(original_ip)
        digest = hashlib.sha256(original_ip.encode("utf-8")).digest()
        if ip_obj.version == 4:
            octets = original_ip.split(".")
            prefix_key = ".".join(octets[:3])
            prefix_digest = hashlib.sha256(prefix_key.encode("utf-8")).digest()
            second = prefix_digest[0]
            third = prefix_digest[1]
            host = max(1, digest[0])
            return str(ipaddress.IPv4Address(int(self.ipv4_network.network_address) + (second << 16) + (third << 8) + host))

        network_prefix = int(self.ipv6_network.network_address)
        source_network = ipaddress.ip_network(f"{original_ip}/64", strict=False)
        prefix_digest = hashlib.sha256(str(source_network.network_address).encode("utf-8")).digest()
        host_digest = hashlib.sha256(original_ip.encode("utf-8")).digest()
        subnet_bits = int.from_bytes(prefix_digest[:7], "big") << 64
        host_bits = int.from_bytes(host_digest[:8], "big")
        return str(ipaddress.IPv6Address(network_prefix + subnet_bits + host_bits))

    def _reset_checksums(self, layer) -> None:
        for field_name in ("chksum", "len", "plen"):
            if hasattr(layer, field_name):
                try:
                    delattr(layer, field_name)
                except AttributeError:
                    pass
