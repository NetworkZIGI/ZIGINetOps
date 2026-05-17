from functools import lru_cache

from app.core.config import Settings, get_settings
from app.integrations.bedrock_client import BedrockClient, LocalEchoLLMClient
from app.repositories.csv_chat_repository import CsvChatRepository
from app.repositories.csv_file_repository import CsvFileRepository
from app.repositories.csv_obfuscation_repository import CsvObfuscationRepository
from app.services.chat_service import ChatService
from app.services.dump_analysis_service import DumpAnalysisService
from app.services.ip_obfuscation_service import IpObfuscationService
from app.services.pcap_analysis_service import PcapAnalysisService
from app.services.pcap_upload_service import PcapUploadService


@lru_cache
def get_file_repository() -> CsvFileRepository:
    return CsvFileRepository(get_settings().csv_dir)


@lru_cache
def get_chat_repository() -> CsvChatRepository:
    return CsvChatRepository(get_settings().csv_dir)


@lru_cache
def get_obfuscation_repository() -> CsvObfuscationRepository:
    return CsvObfuscationRepository(get_settings().csv_dir)


def get_upload_service() -> PcapUploadService:
    settings = get_settings()
    return PcapUploadService(get_file_repository(), settings.pcap_dir, settings.max_upload_bytes)


def get_obfuscation_service() -> IpObfuscationService:
    settings = get_settings()
    return IpObfuscationService(
        get_file_repository(),
        get_obfuscation_repository(),
        settings.pcap_dir,
        settings.ipv4_obfuscation_network,
        settings.ipv6_obfuscation_network,
    )


def get_pcap_analysis_service() -> PcapAnalysisService:
    settings = get_settings()
    return PcapAnalysisService(get_file_repository(), settings.pcap_dir)


def get_dump_analysis_service() -> DumpAnalysisService:
    return DumpAnalysisService()


def get_chat_service(settings: Settings | None = None) -> ChatService:
    active_settings = settings or get_settings()
    llm_client = LocalEchoLLMClient() if active_settings.app_env == "local" else BedrockClient(active_settings)
    return ChatService(get_chat_repository(), llm_client)
