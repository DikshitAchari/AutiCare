from datetime import datetime
from sqlalchemy.orm import Session

from app.core.security import create_access_token, get_password_hash, verify_password
from app.models.user import ChildProfile, User
from app.schemas.user import UserCreate, UserOut


class AuthService:
    @staticmethod
    def create_user(db: Session, user_in: UserCreate) -> User:
        existing = db.query(User).filter(User.email == user_in.email.lower()).first()
        if existing:
            raise ValueError("User with this email already exists")

        role_upper = user_in.role.upper()
        if role_upper == "PARENT" and not user_in.child:
            raise ValueError("Child details are required for parent registration")

        try:
            user = User(
                email=user_in.email.lower(),
                password_hash=get_password_hash(user_in.password),
                name=user_in.name.strip(),
                role=role_upper,
                phone=user_in.phone,
                status="ACTIVE",
            )
            db.add(user)
            db.flush()

            if role_upper == "PARENT" and user_in.child:
                child_in = user_in.child
                if not child_in.name or not child_in.name.strip():
                    raise ValueError("Child name is required")

                current_year = datetime.now().year
                birth_year = (
                    int(child_in.dob[:4])
                    if child_in.dob and len(child_in.dob) >= 4 and child_in.dob[:4].isdigit()
                    else current_year
                )
                calculated_age = max(0, current_year - birth_year)

                child = ChildProfile(
                    parent_id=user.id,
                    name=child_in.name.strip(),
                    dob=child_in.dob,
                    age=calculated_age,
                    gender=child_in.gender or "Male",
                    school=child_in.school,
                    grade=child_in.grade,
                    parent_notes=child_in.parent_notes,
                    support_indicator="NOT_ASSESSED",
                    therapy_status="NOT_STARTED",
                    assessment_status="PENDING",
                )
                db.add(child)

            db.commit()
            db.refresh(user)
            return user
        except Exception as exc:
            db.rollback()
            raise exc

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
