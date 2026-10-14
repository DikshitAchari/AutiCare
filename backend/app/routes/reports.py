from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.security import get_current_user_token
from app.database.connection import get_db
from app.schemas.report import (
    BehaviorObservationCreate,
    BehaviorObservationOut,
    ClinicalReportCreate,
    ClinicalReportOut,
)
from app.services.report_service import ReportService

router = APIRouter(prefix="/api", tags=["reports"])


@router.post("/reports", response_model=ClinicalReportOut, status_code=status.HTTP_201_CREATED)
def create_report(
    payload: ClinicalReportCreate,
    token_payload: dict = Depends(get_current_user_token),
    db: Session = Depends(get_db),
):
    current_user_id = int(token_payload.get("sub"))
    current_user_role = str(token_payload.get("role", "")).upper()

    try:
        return ReportService.create_report(
            db, payload, current_user_id, current_user_role
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc


@router.get("/reports", response_model=List[ClinicalReportOut])
def list_reports(
    child_id: Optional[int] = Query(None, alias="childId"),
    token_payload: dict = Depends(get_current_user_token),
    db: Session = Depends(get_db),
):
    current_user_id = int(token_payload.get("sub"))
    current_user_role = str(token_payload.get("role", "PARENT")).upper()

    return ReportService.list_reports(
        db, current_user_id, current_user_role, child_id=child_id
    )


@router.get("/reports/{report_id}", response_model=ClinicalReportOut)
def get_report(
    report_id: int,
    token_payload: dict = Depends(get_current_user_token),
    db: Session = Depends(get_db),
):
    current_user_id = int(token_payload.get("sub"))
    current_user_role = str(token_payload.get("role", "PARENT")).upper()

    try:
        return ReportService.get_report_by_id(
            db, report_id, current_user_id, current_user_role
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc


@router.post("/behaviors", response_model=BehaviorObservationOut, status_code=status.HTTP_201_CREATED)
def create_behavior_observation(
    payload: BehaviorObservationCreate,
    token_payload: dict = Depends(get_current_user_token),
    db: Session = Depends(get_db),
):
    current_user_id = int(token_payload.get("sub"))
    current_user_role = str(token_payload.get("role", "")).upper()

    try:
        return ReportService.create_behavior_observation(
            db, payload, current_user_id, current_user_role
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc


@router.get("/behaviors", response_model=List[BehaviorObservationOut])
def list_behavior_observations(
    child_id: int = Query(..., alias="childId"),
    token_payload: dict = Depends(get_current_user_token),
    db: Session = Depends(get_db),
):
    return ReportService.list_behavior_observations(db, child_id=child_id)

