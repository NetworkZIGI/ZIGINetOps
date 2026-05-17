from app.domain.chat_session import ChatMessage, ChatSession
from app.integrations.bedrock_client import LLMClientProtocol
from app.repositories.base import ChatRepository


NETWORK_SYSTEM_PROMPT = (
    "You are a senior network AIOps assistant. Analyze packet summaries and tcpdump data "
    "for network operators. Highlight likely causes, evidence, risk, and next actions. "
    "Avoid exposing sensitive data beyond the supplied context."
)


class ChatService:
    def __init__(self, repository: ChatRepository, llm_client: LLMClientProtocol) -> None:
        self.repository = repository
        self.llm_client = llm_client

    def start_analysis(self, mode: str, context: str) -> tuple[str, str, list[ChatMessage]]:
        session = self.repository.create_session(ChatSession(mode=mode))
        user = self.repository.append_message(
            ChatMessage(session_id=session.id, role="user", content=context)
        )
        answer = self.llm_client.analyze(NETWORK_SYSTEM_PROMPT, context)
        assistant = self.repository.append_message(
            ChatMessage(session_id=session.id, role="assistant", content=answer)
        )
        return session.id, answer, [user, assistant]

    def follow_up(self, session_id: str, message: str) -> tuple[str, list[ChatMessage]]:
        history = self.repository.list_messages(session_id)
        prompt = self._build_follow_up_prompt(history, message)
        user = self.repository.append_message(
            ChatMessage(session_id=session_id, role="user", content=message)
        )
        answer = self.llm_client.analyze(NETWORK_SYSTEM_PROMPT, prompt)
        assistant = self.repository.append_message(
            ChatMessage(session_id=session_id, role="assistant", content=answer)
        )
        return answer, [*history, user, assistant]

    def list_messages(self, session_id: str) -> list[ChatMessage]:
        return self.repository.list_messages(session_id)

    def _build_follow_up_prompt(self, history: list[ChatMessage], message: str) -> str:
        transcript = "\n".join(f"{item.role}: {item.content}" for item in history[-12:])
        return f"Conversation so far:\n{transcript}\n\nFollow-up question:\n{message}"
