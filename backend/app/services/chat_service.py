from sqlalchemy.orm import Session

from app.models.user import ChatMessage

CHAT_DISCLAIMER = (
    "AutiCare chat provides general educational support only and does not diagnose autism spectrum disorder "
    "or replace advice from a qualified clinician."
)


class ChatService:
    @staticmethod
    def create_response(message: str) -> str:
        normalized = message.lower()
        if any(term in normalized for term in ["diagnose", "diagnosis", "autism?", "asd?"]):
            return (
                "I cannot diagnose a child. If you are noticing developmental differences, document specific "
                "examples and discuss them with a developmental pediatrician, pediatric neurologist, or clinical psychologist."
            )
        if any(term in normalized for term in ["speech", "language", "talk", "communication"]):
            return (
                "For communication concerns, track what the child understands, how they request help, gestures they use, "
                "and any changes over time. A speech-language evaluation can help identify practical next supports."
            )
        if any(term in normalized for term in ["sensory", "noise", "texture", "light", "meltdown"]):
            return (
                "Sensory patterns are worth tracking by trigger, setting, duration, and what helped the child recover. "
                "An occupational therapist can suggest individualized regulation strategies."
            )
        if any(term in normalized for term in ["routine", "sleep", "food", "eating"]):
            return (
                "Consistent routines, visual cues, and small predictable transitions can be helpful. If sleep or eating "
                "concerns are persistent, bring concrete logs to your child's clinician."
            )
        return (
            "I can help you think through observations, questions for a clinician, and supportive home strategies. "
            "Share what you noticed, when it happens, and what usually helps your child feel regulated."
        )

    @staticmethod
    def save_message(db: Session, user_id: int, role: str, message: str) -> ChatMessage:
        record = ChatMessage(user_id=user_id, role=role, message=message)
        db.add(record)
        db.commit()
        db.refresh(record)
        return record
