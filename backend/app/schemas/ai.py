import uuid
from datetime import datetime

from pydantic import BaseModel


class ChatMessage(BaseModel):
    role: str  # user|assistant
    content: str
    timestamp: datetime | None = None


class ChatRequest(BaseModel):
    message: str
    session_id: uuid.UUID | None = None


class ChatResponse(BaseModel):
    session_id: uuid.UUID
    response: str
    suggested_questions: list[str] = []


class ExplainFoodRequest(BaseModel):
    food_id: uuid.UUID


class ExplainFoodResponse(BaseModel):
    food_name: str
    explanation: str
    reason_tags: list[str]
