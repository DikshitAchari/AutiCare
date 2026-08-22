from sqlalchemy.orm import Session

from app.core.security import get_password_hash, verify_password, create_access_token
from app.models.user import User
from app.schemas.user import UserCreate, UserOut


class AuthService:
    @staticmethod
    def create_user(db: Session, user_in: UserCreate) -> User:
        existing = db.query(User).filter(User.email == user_in.email.lower()).first()
        if existing:
            raise ValueError("User with this email already exists")

        user = User(
            email=user_in.email.lower(),
            password_hash=get_password_hash(user_in.password),
            name=user_in.name,
            role=user_in.role.upper(),
            phone=user_in.phone,
            status="ACTIVE",
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def authenticate_user(db: Session, email: str, password: str, role: str | None = None) -> User:
        user = db.query(User).filter(User.email == email.lower()).first()
        if not user:
            raise ValueError("Invalid email or password")
        if role and user.role.upper() != role.upper():
            raise ValueError("Role mismatch for this account")
        if not verify_password(password, user.password_hash):
            raise ValueError("Invalid email or password")
        return user

    @staticmethod
    def issue_token(user: User) -> str:
        return create_access_token(
            subject=str(user.id),
            extra_claims={"role": user.role, "email": user.email, "name": user.name},
        )

    @staticmethod
    def convert_user(user: User) -> UserOut:
        return UserOut(
            id=user.id,
            email=user.email,
            name=user.name,
            role=user.role,
            phone=user.phone,
            status=user.status,
        )
