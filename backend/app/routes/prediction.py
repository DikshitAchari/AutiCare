import os
import tempfile
from pathlib import Path
from typing import List

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session
from starlette.concurrency import run_in_threadpool

from app.core.security import get_current_user_token
from app.core.config import get_settings
from app.database.connection import get_db
from app.models.user import PredictionAnalysis
from app.schemas.user import PredictionHistoryItem, PredictionRequest, PredictionResponse
from app.services.prediction_service import (
    BEHAVIOR_DISCLAIMER,
    BEHAVIOR_NAMES,
    ModelConfigurationError,
    ModelInferenceError,
    PredictionService,
)

router = APIRouter(prefix="/api", tags=["prediction"])
settings = get_settings()

VIDEO_UPLOAD_DIRECTORY = Path(__file__).resolve().parents[2] / "runtime" / "uploads"
ALLOWED_VIDEO_TYPES = {
    ".mp4": {"video/mp4"},
    ".avi": {"video/avi", "video/x-msvideo"},
    ".mov": {"video/quicktime", "video/mov"},
}


def validate_video_upload(
    filename: str | None,
    content_type: str | None,
    size: int,
    max_bytes: int,
) -> str:
    suffix = Path(filename or "").suffix.lower()
    if suffix not in ALLOWED_VIDEO_TYPES or content_type not in ALLOWED_VIDEO_TYPES[suffix]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid video type. Upload an MP4, AVI, or MOV file.",
        )
    if size <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded video file is empty.",
        )
    if size > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Video is too large. Maximum allowed size is {max_bytes // (1024 * 1024)} MB.",
        )
    return suffix


def to_prediction_response(record: PredictionAnalysis) -> PredictionResponse:
    raw_output = record.raw_output if isinstance(record.raw_output, dict) else {}
    return PredictionResponse(
        id=record.id,
        child_id=record.child_id,
        support_indicator=record.support_indicator,
        confidence_score=record.confidence_score,
        percentage=record.percentage,
        summary=record.summary,
        recommendations=record.recommendations or [],
        disclaimer=record.disclaimer,
        source=record.source,
        created_at=record.created_at.isoformat() if record.created_at else None,
        behavior_analysis=raw_output.get("behavior_analysis"),
        pose_analysis=raw_output.get("pose_analysis"),
    )


@router.post("/prediction", response_model=PredictionResponse, status_code=status.HTTP_201_CREATED)
def get_prediction(
    payload: PredictionRequest,
    token_payload: dict = Depends(get_current_user_token),
    db: Session = Depends(get_db),
):
    user_id = int(token_payload.get("sub"))
    try:
        result = PredictionService.predict(payload.answers)
        record = PredictionService.save_result(
            db,
            child_id=payload.child_id,
            user_id=user_id,
            source="questionnaire",
            result=result,
            raw_output={"answers": payload.answers},
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Prediction failed") from exc

    return to_prediction_response(record)


@router.get("/prediction/results", response_model=List[PredictionHistoryItem])
def list_prediction_results(
    token_payload: dict = Depends(get_current_user_token),
    db: Session = Depends(get_db),
):
    user_id = int(token_payload.get("sub"))
    records = (
        db.query(PredictionAnalysis)
        .filter(PredictionAnalysis.user_id == user_id)
        .order_by(PredictionAnalysis.created_at.desc())
        .all()
    )
    return [to_prediction_response(record) for record in records]


@router.get("/prediction/results/{prediction_id}", response_model=PredictionResponse)
def get_prediction_result(
    prediction_id: int,
    token_payload: dict = Depends(get_current_user_token),
    db: Session = Depends(get_db),
):
    user_id = int(token_payload.get("sub"))
    record = (
        db.query(PredictionAnalysis)
        .filter(PredictionAnalysis.id == prediction_id, PredictionAnalysis.user_id == user_id)
        .first()
    )
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prediction analysis result not found")
    return to_prediction_response(record)


@router.post("/prediction/analyze", response_model=PredictionResponse, status_code=status.HTTP_201_CREATED)
async def analyze_video(
    child_id: int = Form(...),
    file: UploadFile = File(...),
    token_payload: dict = Depends(get_current_user_token),
    db: Session = Depends(get_db),
):
    user_id = int(token_payload.get("sub"))
    max_bytes = settings.max_video_upload_mb * 1024 * 1024
    temp_path = None

    try:
        PredictionService.validate_child_access(db, child_id=child_id, user_id=user_id)
        suffix = validate_video_upload(file.filename, file.content_type, 1, max_bytes)
        VIDEO_UPLOAD_DIRECTORY.mkdir(parents=True, exist_ok=True)
        with tempfile.NamedTemporaryFile(
            delete=False,
            dir=VIDEO_UPLOAD_DIRECTORY,
            prefix="video-",
            suffix=suffix,
        ) as temp_file:
            temp_path = temp_file.name
            total = 0
            while True:
                chunk = await file.read(1024 * 1024)
                if not chunk:
                    break
                total += len(chunk)
                if total > max_bytes:
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail=f"Video is too large. Maximum allowed size is {settings.max_video_upload_mb} MB.",
                    )
                temp_file.write(chunk)

        validate_video_upload(file.filename, file.content_type, total, max_bytes)

        # Human/Pose presence validation gate before expensive pbr4RRB inference:
        presence = await run_in_threadpool(PredictionService.validate_human_presence, temp_path)
        if not presence.get("has_human", False):
            not_analyzable_result = {
                "status": "not_analyzable",
                "reason": "no_person_detected",
                "support_indicator": "NOT_ASSESSED",
                "confidence_score": None,
                "percentage": None,
                "summary": (
                    "No analyzable person was detected in this video. "
                    "Please upload a video where the person's body is clearly visible."
                ),
                "recommendations": [
                    "Please upload a clear video with the person's body visible for behavioral analysis."
                ],
                "disclaimer": BEHAVIOR_DISCLAIMER,
                "behavior_analysis": {
                    "analysis_type": "RRB_behavior_analysis",
                    "status": "not_analyzable",
                    "reason": "no_person_detected",
                    "behaviors": [
                        {
                            "name": name,
                            "status": "not_analyzed",
                            "confidence": None,
                            "model": None,
                            "segments": [],
                        }
                        for name in BEHAVIOR_NAMES
                    ],
                    "additional_observations": [],
                    "supported_behavior_count": 0,
                    "analyzed_behavior_count": 0,
                    "detected_behavior_count": 0,
                    "repetitive_behavior_detected": False,
                    "disclaimer": BEHAVIOR_DISCLAIMER,
                },
                "pose_analysis": {
                    "status": "not_analyzable",
                    "reason": "no_person_detected",
                    "has_human": False,
                    "presence_details": presence,
                },
                "model_output": {
                    "status": "not_analyzable",
                    "reason": "no_person_detected",
                },
            }
            record = PredictionService.save_result(
                db,
                child_id=child_id,
                user_id=user_id,
                source="video",
                result=not_analyzable_result,
                model_name="AI4ASD-pbr4RRB",
                raw_output=not_analyzable_result,
            )
            return to_prediction_response(record)

        result = await run_in_threadpool(PredictionService.analyze_video, temp_path)
        pose_analysis = PredictionService.analyze_pose_temporally(temp_path)
        record = PredictionService.save_result(
            db,
            child_id=child_id,
            user_id=user_id,
            source="video",
            result={**result, "pose_analysis": pose_analysis},
            model_name="AI4ASD-pbr4RRB",
            raw_output={
                "model_output": result["model_output"],
                "behavior_analysis": result["behavior_analysis"],
                "pose_analysis": pose_analysis,
            },
        )
        return to_prediction_response(record)
    except HTTPException:
        raise
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc
    except ModelConfigurationError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc
    except ModelInferenceError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Video analysis failed: {exc}") from exc
    except SQLAlchemyError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to verify the child profile or save the video analysis result.",
        ) from exc
    except OSError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to store or clean up the uploaded video.",
        ) from exc
    finally:
        await file.close()
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)
