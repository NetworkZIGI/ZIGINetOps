from datetime import datetime

from pydantic import BaseModel


class ChatMessageResponse(BaseModel):
    id: str
    session_id: str
    role: str
    content: str
    created_at: datetime


class FollowUpRequest(BaseModel):
    message: str


class AnalysisResponse(BaseModel):
    session_id: str
    answer: str
    messages: list[ChatMessageResponse]
