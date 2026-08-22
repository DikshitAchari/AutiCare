from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.core.security import get_current_user_token
from app.schemas.user import TokenResponse, UserCreate, UserLogin, UserOut
from app.services.auth_service import AuthService

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register_user(user_in: UserCreate, db: Session = Depends(get_db)):
    try:
        user = AuthService.create_user(db, user_in)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    access_token = AuthService.issue_token(user)
    return TokenResponse(access_token=access_token, user=AuthService.convert_user(user))


@router.post("/login", response_model=TokenResponse)
def login_user(payload: UserLogin, db: Session = Depends(get_db)):
    try:
        user = AuthService.authenticate_user(db, payload.email, payload.password, payload.role)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc

    access_token = AuthService.issue_token(user)
    return TokenResponse(access_token=access_token, user=AuthService.convert_user(user))


@router.get("/me", response_model=UserOut)
def get_me(token_payload: dict = Depends(get_current_user_token), db: Session = Depends(get_db)):
    from app.models.user import User

    user_id = token_payload.get("sub")
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return AuthService.convert_user(user)
