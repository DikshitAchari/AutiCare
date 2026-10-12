import secrets
import smtplib
import logging
from datetime import datetime, timedelta, timezone
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import get_password_hash
from app.models.user import User

logger = logging.getLogger(__name__)


class PasswordResetService:
    settings = get_settings()

    @staticmethod
    def generate_otp() -> str:
        """Generate a 6-digit OTP."""
        return "".join(str(secrets.randbelow(10)) for _ in range(6))

    @staticmethod
    def send_otp_email(email: str, otp: str, user_name: str) -> bool:
        """Send OTP to user's email address."""
        if not PasswordResetService.settings.smtp_username or not PasswordResetService.settings.smtp_password:
            settings = PasswordResetService.settings
            if (
                settings.allow_dev_otp_logging
                and settings.debug
                and settings.app_env.strip().lower() in {"dev", "development", "test"}
            ):
                logger.warning("Development-only password reset OTP: %s", otp)
            return False

        try:
            subject = "AutiCare - Password Reset OTP"
            body = f"""
            <html>
                <body style="font-family: Arial, sans-serif;">
                    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                        <h2 style="color: #6366f1;">Password Reset Request</h2>
                        <p>Hi {user_name},</p>
                        <p>We received a request to reset your password. Please use the OTP below to proceed:</p>
                        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
                            <h1 style="color: #6366f1; letter-spacing: 2px; margin: 0;">{otp}</h1>
                        </div>
                        <p style="color: #666;">This OTP will expire in 10 minutes.</p>
                        <p style="color: #999; font-size: 12px;">If you didn't request this, please ignore this email.</p>
                        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                        <p style="color: #999; font-size: 12px;">© 2024 AutiCare. All rights reserved.</p>
                    </div>
                </body>
            </html>
            """

            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = PasswordResetService.settings.smtp_from_email
            msg["To"] = email

            msg.attach(MIMEText(body, "html"))

            with smtplib.SMTP(
                PasswordResetService.settings.smtp_host,
                PasswordResetService.settings.smtp_port,
            ) as server:
                server.starttls()
                server.login(
                    PasswordResetService.settings.smtp_username,
                    PasswordResetService.settings.smtp_password,
                )
                server.send_message(msg)

            return True
        except Exception:
            logger.error("Failed to send password reset email.")
            return False

    @staticmethod
    def initiate_password_reset(db: Session, email: str) -> bool:
        """Initiate password reset by generating OTP and sending email."""
        user = db.query(User).filter(User.email == email.lower()).first()
        if not user:
            # Don't reveal if email exists or not (security best practice)
            return True

        otp = PasswordResetService.generate_otp()
        expires_at = datetime.now(timezone.utc) + timedelta(
            minutes=PasswordResetService.settings.otp_expire_minutes
        )

        user.otp = otp
        user.otp_expires_at = expires_at
        user.otp_attempts = 0

        db.commit()

        # Send OTP to email
        success = PasswordResetService.send_otp_email(user.email, otp, user.name)
        return success

    @staticmethod
    def verify_otp(db: Session, email: str, otp: str) -> bool:
        """Verify OTP and check if it's valid."""
        user = db.query(User).filter(User.email == email.lower()).first()
        if not user:
            raise ValueError("User not found")

        if not user.otp:
            raise ValueError("No OTP requested")

        if user.otp_attempts >= PasswordResetService.settings.max_otp_attempts:
            raise ValueError("Maximum OTP attempts exceeded")

        if user.otp_expires_at and datetime.now(timezone.utc) > user.otp_expires_at:
            raise ValueError("OTP has expired")

        user.otp_attempts += 1
        db.commit()

        if user.otp != otp:
            raise ValueError("Invalid OTP")

        return True

    @staticmethod
    def reset_password(db: Session, email: str, new_password: str) -> bool:
        """Reset user password."""
        user = db.query(User).filter(User.email == email.lower()).first()
        if not user:
            raise ValueError("User not found")

        if not user.otp:
            raise ValueError("No OTP verified")

        # Password is already verified in the endpoint, just update it here
        user.password_hash = get_password_hash(new_password)
        user.otp = None
        user.otp_expires_at = None
        user.otp_attempts = 0

        db.commit()
        return True
