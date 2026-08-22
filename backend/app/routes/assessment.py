from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.core.security import get_current_user_token
from app.models.user import AssessmentAnswer, AssessmentRecord, ChildProfile
from app.schemas.user import AssessmentResultOut, AssessmentSubmit, ChildCreate, ChildOut
from app.services.assessment_service import AssessmentService

router = APIRouter(prefix="/api", tags=["assessment"])


@router.post("/children", response_model=ChildOut, status_code=status.HTTP_201_CREATED)
def create_child(child_in: ChildCreate, token_payload: dict = Depends(get_current_user_token), db: Session = Depends(get_db)):
    user_id = int(token_payload.get("sub"))
    child = ChildProfile(
        parent_id=user_id,
        name=child_in.name,
        dob=child_in.dob,
        age=2026 - int(child_in.dob[:4]) if child_in.dob and len(child_in.dob) >= 4 else 0,
        gender=child_in.gender,
        school=child_in.school,
        grade=child_in.grade,
        parent_notes=child_in.parent_notes,
    )
    db.add(child)
    db.commit()
    db.refresh(child)
    return ChildOut(
        id=child.id,
        parent_id=child.parent_id,
        name=child.name,
        dob=child.dob,
        age=child.age,
        gender=child.gender,
        school=child.school,
        grade=child.grade,
        parent_notes=child.parent_notes,
        support_indicator=child.support_indicator,
        therapy_status=child.therapy_status,
        assessment_status=child.assessment_status,
        last_assessment_date=child.last_assessment_date,
    )


@router.get("/children", response_model=List[ChildOut])
def list_children(token_payload: dict = Depends(get_current_user_token), db: Session = Depends(get_db)):
    user_id = int(token_payload.get("sub"))
    children = db.query(ChildProfile).filter(ChildProfile.parent_id == user_id).all()
    return [
        ChildOut(
            id=child.id,
            parent_id=child.parent_id,
            name=child.name,
            dob=child.dob,
            age=child.age,
            gender=child.gender,
            school=child.school,
            grade=child.grade,
            parent_notes=child.parent_notes,
            support_indicator=child.support_indicator,
            therapy_status=child.therapy_status,
            assessment_status=child.assessment_status,
            last_assessment_date=child.last_assessment_date,
        )
        for child in children
    ]


@router.post("/assessment", response_model=AssessmentResultOut, status_code=status.HTTP_201_CREATED)
def submit_assessment(payload: AssessmentSubmit, token_payload: dict = Depends(get_current_user_token), db: Session = Depends(get_db)):
    try:
        record = AssessmentService.submit_assessment(db, payload.child_id, payload.answers)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    result = AssessmentService.calculate_result(payload.answers)
    return AssessmentResultOut(
        id=record.id,
        child_id=record.child_id,
        total_score=record.total_score,
        max_score=record.max_score,
        percentage=record.percentage,
        support_indicator=record.support_indicator,
        summary=record.summary,
        recommendations=result["recommendations"],
        disclaimer=record.disclaimer,
        completed_at=record.completed_at.isoformat() if record.completed_at else None,
        domain_scores=result["domain_scores"],
    )


@router.get("/assessment", response_model=List[AssessmentResultOut])
def list_assessments(token_payload: dict = Depends(get_current_user_token), db: Session = Depends(get_db)):
    results = db.query(AssessmentRecord).all()
    output = []
    for record in results:
        output.append(
            AssessmentResultOut(
                id=record.id,
                child_id=record.child_id,
                total_score=record.total_score,
                max_score=record.max_score,
                percentage=record.percentage,
                support_indicator=record.support_indicator,
                summary=record.summary,
                recommendations=record.recommendations.split("|") if record.recommendations else [],
                disclaimer=record.disclaimer,
                completed_at=record.completed_at.isoformat() if record.completed_at else None,
                domain_scores=[],
            )
        )
    return output
