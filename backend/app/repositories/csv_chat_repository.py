from datetime import datetime
from pathlib import Path

from app.domain.chat_session import ChatMessage, ChatSession
from app.repositories.base import ChatRepository
from app.repositories.csv_store import CsvStore


SESSION_FIELDS = ["id", "mode", "created_at"]
MESSAGE_FIELDS = ["id", "session_id", "role", "content", "created_at"]


class CsvChatRepository(ChatRepository):
    def __init__(self, csv_dir: Path) -> None:
        self.sessions = CsvStore(csv_dir / "chat_sessions.csv", SESSION_FIELDS)
        self.messages = CsvStore(csv_dir / "chat_messages.csv", MESSAGE_FIELDS)

    def create_session(self, session: ChatSession) -> ChatSession:
        rows = self.sessions.read_rows()
        rows.append(
            {"id": session.id, "mode": session.mode, "created_at": session.created_at.isoformat()}
        )
        self.sessions.write_rows(rows)
        return session

    def append_message(self, message: ChatMessage) -> ChatMessage:
        rows = self.messages.read_rows()
        rows.append(
            {
                "id": message.id,
                "session_id": message.session_id,
                "role": message.role,
                "content": message.content,
                "created_at": message.created_at.isoformat(),
            }
        )
        self.messages.write_rows(rows)
        return message

    def list_messages(self, session_id: str) -> list[ChatMessage]:
        return [
            ChatMessage(
                id=row["id"],
                session_id=row["session_id"],
                role=row["role"],
                content=row["content"],
                created_at=datetime.fromisoformat(row["created_at"]),
            )
            for row in self.messages.read_rows()
            if row["session_id"] == session_id
        ]
