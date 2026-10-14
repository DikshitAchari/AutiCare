from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import get_current_user_token
from app.database.connection import get_db
from app.schemas.message import ChatThreadOut, DirectMessageOut, DirectMessageSend
from app.services.message_service import MessageService

router = APIRouter(prefix="/api/messages", tags=["messages"])


@router.get("/threads", response_model=List[ChatThreadOut])
def list_threads(
    token_payload: dict = Depends(get_current_user_token),
    db: Session = Depends(get_db),
):
    current_user_id = int(token_payload.get("sub"))
    return MessageService.list_threads(db, current_user_id)


@router.get("/thread/{thread_id}", response_model=List[DirectMessageOut])
def list_thread_messages(
    thread_id: str,
    token_payload: dict = Depends(get_current_user_token),
    db: Session = Depends(get_db),
):
    current_user_id = int(token_payload.get("sub"))
    try:
        return MessageService.list_messages(db, thread_id, current_user_id)
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc


@router.post("", response_model=DirectMessageOut, status_code=status.HTTP_201_CREATED)
def send_message(
    payload: DirectMessageSend,
    token_payload: dict = Depends(get_current_user_token),
    db: Session = Depends(get_db),
):
    current_user_id = int(token_payload.get("sub"))
    current_user_role = str(token_payload.get("role", "PARENT")).upper()

    try:
        return MessageService.send_message(
            db, payload, current_user_id, current_user_role
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
