from typing import List

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.security import get_current_user_token
from app.database.connection import get_db
from app.models.user import ChatMessage
from app.schemas.user import ChatMessageOut, ChatRequest, ChatResponse
from app.services.chat_service import CHAT_DISCLAIMER, ChatService

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.post("", response_model=ChatResponse, status_code=status.HTTP_201_CREATED)
def send_chat_message(
    payload: ChatRequest,
    token_payload: dict = Depends(get_current_user_token),
    db: Session = Depends(get_db),
):
    user_id = int(token_payload.get("sub"))
    ChatService.save_message(db, user_id, "user", payload.message)
    response = ChatService.create_response(payload.message)
    ChatService.save_message(db, user_id, "assistant", response)
    return ChatResponse(response=response, disclaimer=CHAT_DISCLAIMER)


@router.get("/history", response_model=List[ChatMessageOut])
def list_chat_history(
    token_payload: dict = Depends(get_current_user_token),
    db: Session = Depends(get_db),
):
    user_id = int(token_payload.get("sub"))
    records = (
        db.query(ChatMessage)
        .filter(ChatMessage.user_id == user_id)
        .order_by(ChatMessage.created_at.asc())
        .all()
    )
    return [
        ChatMessageOut(
            id=record.id,
            role=record.role,
            message=record.message,
            created_at=record.created_at.isoformat() if record.created_at else None,
        )
        for record in records
    ]
