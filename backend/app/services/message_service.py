from datetime import datetime, timezone
from typing import Dict, List, Optional
from sqlalchemy.orm import Session

from app.models.user import DirectMessage, User
from app.schemas.message import ChatThreadOut, DirectMessageOut, DirectMessageSend


def make_thread_id(user_a_id: int, user_b_id: int) -> str:
    """Consistent deterministic thread id between two users."""
    first, second = sorted([user_a_id, user_b_id])
    return f"thread_{first}_{second}"


class MessageService:
    @staticmethod
    def to_message_out(msg: DirectMessage) -> DirectMessageOut:
        created_at_iso = (
            msg.created_at.isoformat()
            if msg.created_at
            else datetime.now(timezone.utc).isoformat()
        )
        return DirectMessageOut(
            id=str(msg.id),
            threadId=msg.thread_id,
            senderId=str(msg.sender_id),
            senderName=msg.sender_name,
            senderRole=msg.sender_role,
            recipientId=str(msg.recipient_id),
            text=msg.text,
            timestamp=created_at_iso,
            read=msg.is_read,
        )

    @staticmethod
    def send_message(
        db: Session,
        payload: DirectMessageSend,
        current_user_id: int,
        current_user_role: str,
    ) -> DirectMessageOut:
        recipient_id = int(payload.recipientId)
        recipient = db.query(User).filter(User.id == recipient_id).first()
        if not recipient:
            raise ValueError("Recipient not found")

        current_user = db.query(User).filter(User.id == current_user_id).first()
        sender_name = current_user.name if current_user else "User"

        thread_id = payload.threadId or make_thread_id(current_user_id, recipient_id)

        msg = DirectMessage(
            thread_id=thread_id,
            sender_id=current_user_id,
            recipient_id=recipient_id,
            sender_name=sender_name,
            sender_role=current_user_role,
            text=payload.text.strip(),
            is_read=False,
            created_at=datetime.now(timezone.utc),
        )
        db.add(msg)
        db.commit()
        db.refresh(msg)

        return MessageService.to_message_out(msg)

    @staticmethod
    def list_threads(
        db: Session,
        current_user_id: int,
    ) -> List[ChatThreadOut]:
        # Fetch all messages where current_user is sender or recipient
        messages = (
            db.query(DirectMessage)
            .filter(
                (DirectMessage.sender_id == current_user_id)
                | (DirectMessage.recipient_id == current_user_id)
            )
            .order_by(DirectMessage.created_at.asc())
            .all()
        )

        threads_map: Dict[str, List[DirectMessage]] = {}
        for m in messages:
            threads_map.setdefault(m.thread_id, []).append(m)

        thread_outs: List[ChatThreadOut] = []
        for tid, msgs in threads_map.items():
            last_msg = msgs[-1]
            unread = sum(
                1 for m in msgs if m.recipient_id == current_user_id and not m.is_read
            )

            # Determine other party
            other_id = (
                last_msg.recipient_id
                if last_msg.sender_id == current_user_id
                else last_msg.sender_id
            )
            other_user = db.query(User).filter(User.id == other_id).first()
            other_name = other_user.name if other_user else f"User {other_id}"

            # Distinguish parent and therapist roles
            current_user = db.query(User).filter(User.id == current_user_id).first()
            if current_user and current_user.role == "PARENT":
                parent_id = str(current_user_id)
                parent_name = current_user.name
                therapist_id = str(other_id)
                therapist_name = other_name
            else:
                parent_id = str(other_id)
                parent_name = other_name
                therapist_id = str(current_user_id)
                therapist_name = current_user.name if current_user else "Therapist"

            last_timestamp = (
                last_msg.created_at.isoformat()
                if last_msg.created_at
                else datetime.now(timezone.utc).isoformat()
            )

            thread_outs.append(
                ChatThreadOut(
                    id=tid,
                    parentId=parent_id,
                    parentName=parent_name,
                    parentAvatar=None,
                    therapistId=therapist_id,
                    therapistName=therapist_name,
                    therapistAvatar=None,
                    lastMessageText=last_msg.text,
                    lastMessageTimestamp=last_timestamp,
                    unreadCount=unread,
                )
            )

        thread_outs.sort(key=lambda t: t.lastMessageTimestamp, reverse=True)
        return thread_outs

    @staticmethod
    def list_messages(
        db: Session,
        thread_id: str,
        current_user_id: int,
    ) -> List[DirectMessageOut]:
        messages = (
            db.query(DirectMessage)
            .filter(DirectMessage.thread_id == thread_id)
            .order_by(DirectMessage.created_at.asc())
            .all()
        )

        # Check authorization: current user must be sender or recipient of at least one message in thread,
        # or thread_id must contain user's ID
        if messages:
            is_participant = any(
                m.sender_id == current_user_id or m.recipient_id == current_user_id
                for m in messages
            )
            if not is_participant:
                raise PermissionError("Unauthorized to access this conversation thread.")

            # Mark messages received by current user as read
            for m in messages:
                if m.recipient_id == current_user_id and not m.is_read:
                    m.is_read = True
            db.commit()

        return [MessageService.to_message_out(m) for m in messages]
