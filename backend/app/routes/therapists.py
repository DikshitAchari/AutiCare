from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.security import get_current_user_token
from app.database.connection import get_db
from app.schemas.therapist import (
    AvailabilitySlotOut,
    TherapistProfileOut,
    TherapistRecommendationOut,
    TherapistStatusUpdate,
)
from app.services.recommendation_engine import RecommendationEngine
from app.services.therapist_service import TherapistService

router = APIRouter(prefix="/api/therapists", tags=["therapists"])


@router.get("", response_model=List[TherapistProfileOut])
def list_therapists(
    status_filter: Optional[str] = Query(None, alias="status"),
    token_payload: dict = Depends(get_current_user_token),
    db: Session = Depends(get_db),
):
    role = str(token_payload.get("role", "PARENT")).upper()
    # Parents can only see approved therapists
    if role == "PARENT":
        effective_status = "APPROVED"
    else:
        effective_status = status_filter if status_filter and status_filter != "ALL" else None

    return TherapistService.list_therapists(db, status_filter=effective_status)


@router.get("/recommendation/{child_id}", response_model=List[TherapistRecommendationOut])
def get_recommendations_for_child(
    child_id: int,
    token_payload: dict = Depends(get_current_user_token),
    db: Session = Depends(get_db),
):
    try:
        return RecommendationEngine.recommend_for_child(db, child_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.get("/{therapist_id}", response_model=TherapistProfileOut)
def get_therapist_profile(
    therapist_id: int,
    token_payload: dict = Depends(get_current_user_token),
    db: Session = Depends(get_db),
):
    profile = TherapistService.get_therapist_by_id(db, therapist_id)
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Therapist not found")
    return profile


@router.patch("/{therapist_id}/status", response_model=TherapistProfileOut)
def update_therapist_status(
    therapist_id: int,
    payload: TherapistStatusUpdate,
    token_payload: dict = Depends(get_current_user_token),
    db: Session = Depends(get_db),
):
    role = str(token_payload.get("role", "")).upper()
    if role != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can update therapist verification status.",
        )

    try:
        return TherapistService.update_therapist_status(db, therapist_id, payload.status)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.get("/{therapist_id}/availability", response_model=List[AvailabilitySlotOut])
def get_therapist_availability(
    therapist_id: int,
    token_payload: dict = Depends(get_current_user_token),
    db: Session = Depends(get_db),
):
    return TherapistService.get_availability(db, therapist_id)
