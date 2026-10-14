from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import get_current_user_token
from app.database.connection import get_db
from app.schemas.appointment import (
    AppointmentCreate,
    AppointmentOut,
    AppointmentStatusUpdate,
)
from app.services.appointment_service import AppointmentService

router = APIRouter(prefix="/api/appointments", tags=["appointments"])


@router.post("", response_model=AppointmentOut, status_code=status.HTTP_201_CREATED)
def book_appointment(
    payload: AppointmentCreate,
    token_payload: dict = Depends(get_current_user_token),
    db: Session = Depends(get_db),
):
    current_user_id = int(token_payload.get("sub"))
    current_user_role = str(token_payload.get("role", "PARENT")).upper()

    try:
        return AppointmentService.book_appointment(
            db, payload, current_user_id, current_user_role
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc


@router.get("", response_model=List[AppointmentOut])
def list_appointments(
    token_payload: dict = Depends(get_current_user_token),
    db: Session = Depends(get_db),
):
    current_user_id = int(token_payload.get("sub"))
    current_user_role = str(token_payload.get("role", "PARENT")).upper()

    return AppointmentService.list_appointments(db, current_user_id, current_user_role)


@router.patch("/{appointment_id}/status", response_model=AppointmentOut)
def update_appointment_status(
    appointment_id: int,
    payload: AppointmentStatusUpdate,
    token_payload: dict = Depends(get_current_user_token),
    db: Session = Depends(get_db),
):
    current_user_id = int(token_payload.get("sub"))
    current_user_role = str(token_payload.get("role", "")).upper()

    try:
        return AppointmentService.update_status(
            db, appointment_id, payload.status, current_user_id, current_user_role
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc


@router.post("/{appointment_id}/cancel", response_model=AppointmentOut)
def cancel_appointment(
    appointment_id: int,
    token_payload: dict = Depends(get_current_user_token),
    db: Session = Depends(get_db),
):
    current_user_id = int(token_payload.get("sub"))
    current_user_role = str(token_payload.get("role", "")).upper()

    try:
        return AppointmentService.cancel_appointment(
            db, appointment_id, current_user_id, current_user_role
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc
