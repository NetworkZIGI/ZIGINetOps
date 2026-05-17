from abc import ABC, abstractmethod

from app.domain.chat_session import ChatMessage, ChatSession
from app.domain.file_metadata import FileMetadata
from app.domain.obfuscation_mapping import ObfuscationMapping


class FileRepository(ABC):
    @abstractmethod
    def list(self) -> list[FileMetadata]:
        raise NotImplementedError

    @abstractmethod
    def get(self, file_id: str) -> FileMetadata | None:
        raise NotImplementedError

    @abstractmethod
    def save(self, metadata: FileMetadata) -> FileMetadata:
        raise NotImplementedError

    @abstractmethod
    def update_description(self, file_id: str, description: str) -> FileMetadata:
        raise NotImplementedError

    @abstractmethod
    def delete(self, file_id: str) -> FileMetadata:
        raise NotImplementedError


class ChatRepository(ABC):
    @abstractmethod
    def create_session(self, session: ChatSession) -> ChatSession:
        raise NotImplementedError

    @abstractmethod
    def append_message(self, message: ChatMessage) -> ChatMessage:
        raise NotImplementedError

    @abstractmethod
    def list_messages(self, session_id: str) -> list[ChatMessage]:
        raise NotImplementedError


class ObfuscationRepository(ABC):
    @abstractmethod
    def save_many(self, mappings: list[ObfuscationMapping]) -> list[ObfuscationMapping]:
        raise NotImplementedError

    @abstractmethod
    def list_by_group(self, group_id: str) -> list[ObfuscationMapping]:
        raise NotImplementedError

    @abstractmethod
    def find_by_original_ip(self, original_ip: str) -> ObfuscationMapping | None:
        raise NotImplementedError
