from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.core.security import get_current_user_token
from app.schemas.user import (
    TokenResponse,
    UserCreate,
    UserLogin,
    UserOut,
    ForgotPasswordRequest,
    VerifyOTPRequest,
    ResetPasswordRequest,
    PasswordResetResponse,
)
from app.services.auth_service import AuthService
from app.services.password_reset_service import PasswordResetService

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


@router.post("/forgot-password", response_model=PasswordResetResponse)
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Initiate password reset by sending OTP to user's email."""
    try:
        success = PasswordResetService.initiate_password_reset(db, payload.email)
        if success:
            return PasswordResetResponse(
                message="If this email is registered, you will receive an OTP shortly.",
                success=True,
            )
        else:
            # Still return success to avoid email enumeration
            return PasswordResetResponse(
                message="If this email is registered, you will receive an OTP shortly.",
                success=True,
            )
    except Exception as exc:
        # Don't reveal specific errors to prevent email enumeration
        return PasswordResetResponse(
            message="If this email is registered, you will receive an OTP shortly.",
            success=True,
        )


@router.post("/verify-reset-otp", response_model=PasswordResetResponse)
def verify_reset_otp(payload: VerifyOTPRequest, db: Session = Depends(get_db)):
    """Verify OTP for password reset."""
    try:
        PasswordResetService.verify_otp(db, payload.email, payload.otp)
        return PasswordResetResponse(
            message="OTP verified successfully.",
            success=True,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.post("/reset-password", response_model=PasswordResetResponse)
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Reset user password after OTP verification."""
    try:
        PasswordResetService.reset_password(db, payload.email, payload.new_password)
        return PasswordResetResponse(
            message="Password reset successfully.",
            success=True,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
