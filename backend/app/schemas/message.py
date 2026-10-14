from typing import Optional
from pydantic import BaseModel, Field


class DirectMessageSend(BaseModel):
    recipientId: str
    text: str = Field(..., min_length=1, max_length=5000)
    threadId: Optional[str] = None


class DirectMessageOut(BaseModel):
    id: str
    threadId: str
    senderId: str
    senderName: str
    senderRole: str
    recipientId: str
    text: str
    timestamp: str
    read: bool

    model_config = {"from_attributes": True}


class ChatThreadOut(BaseModel):
    id: str
    parentId: str
    parentName: str
    parentAvatar: Optional[str] = None
    therapistId: str
    therapistName: str
    therapistAvatar: Optional[str] = None
    childName: Optional[str] = None
    lastMessageText: str
    lastMessageTimestamp: str
    unreadCount: int = 0

    model_config = {"from_attributes": True}
