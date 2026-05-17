from collections import Counter
from pathlib import Path

from scapy.all import IP, IPv6, TCP, UDP, PcapReader  # type: ignore[import-untyped]

from app.core.errors import NotFoundError
from app.repositories.base import FileRepository


class PcapAnalysisService:
    def __init__(self, repository: FileRepository, pcap_dir: Path) -> None:
        self.repository = repository
        self.pcap_dir = pcap_dir

    def build_context(
        self,
        file_ids: list[str],
        source_ip: str | None,
        destination_ip: str | None,
        extra_message: str | None,
    ) -> str:
        summaries = [
            self._summarize_file(file_id, source_ip=source_ip, destination_ip=destination_ip)
            for file_id in file_ids
        ]
        extra = f"\nOperator notes:\n{extra_message}\n" if extra_message else ""
        return "\n\n".join(summaries) + extra

    def _summarize_file(self, file_id: str, source_ip: str | None, destination_ip: str | None) -> str:
        metadata = self.repository.get(file_id)
        if metadata is None:
            raise NotFoundError("Analysis target file was not found.")

        path = self.pcap_dir / metadata.stored_filename
        if not path.exists():
            raise NotFoundError("Analysis target pcap was not found.")

        protocols: Counter[str] = Counter()
        sources: Counter[str] = Counter()
        destinations: Counter[str] = Counter()
        ports: Counter[str] = Counter()
        matched_packets = 0
        total_packets = 0

        with PcapReader(str(path)) as reader:
            for packet in reader:
                total_packets += 1
                src, dst = self._extract_ips(packet)
                if src:
                    sources[src] += 1
                if dst:
                    destinations[dst] += 1
                if TCP in packet:
                    protocols["tcp"] += 1
                    ports[f"tcp/{packet[TCP].dport}"] += 1
                elif UDP in packet:
                    protocols["udp"] += 1
                    ports[f"udp/{packet[UDP].dport}"] += 1
                elif src or dst:
                    protocols["ip-other"] += 1
                else:
                    protocols["non-ip"] += 1
                if self._matches(src, dst, source_ip, destination_ip):
                    matched_packets += 1

        return "\n".join(
            [
                f"File: {metadata.filename}",
                f"Total packets: {total_packets}",
                f"Packets matching requested IP filters: {matched_packets}",
                f"Protocol distribution: {dict(protocols.most_common(10))}",
                f"Top source IPs: {dict(sources.most_common(10))}",
                f"Top destination IPs: {dict(destinations.most_common(10))}",
                f"Top destination ports: {dict(ports.most_common(10))}",
            ]
        )

    def _extract_ips(self, packet) -> tuple[str | None, str | None]:
        if IP in packet:
            return packet[IP].src, packet[IP].dst
        if IPv6 in packet:
            return packet[IPv6].src, packet[IPv6].dst
        return None, None

    def _matches(
        self,
        src: str | None,
        dst: str | None,
        source_ip: str | None,
        destination_ip: str | None,
    ) -> bool:
        if source_ip and src != source_ip:
            return False
        if destination_ip and dst != destination_ip:
            return False
        return bool(source_ip or destination_ip)
