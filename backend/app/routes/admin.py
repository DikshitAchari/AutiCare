from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import get_current_user_token
from app.database.connection import get_db
from app.schemas.admin import AdminDashboardStats, AdminParentOut
from app.services.admin_service import AdminService

router = APIRouter(prefix="/api/admin", tags=["admin"])


def require_admin(token_payload: dict = Depends(get_current_user_token)) -> dict:
    role = str(token_payload.get("role", "")).upper()
    if role != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted to platform administrators.",
        )
    return token_payload


@router.get("/dashboard", response_model=AdminDashboardStats)
def get_admin_dashboard(
    token_payload: dict = Depends(require_admin),
    db: Session = Depends(get_db),
):
    return AdminService.get_dashboard_stats(db)


@router.get("/parents", response_model=List[AdminParentOut])
def list_admin_parents(
    token_payload: dict = Depends(require_admin),
    db: Session = Depends(get_db),
):
    return AdminService.list_parents(db)
