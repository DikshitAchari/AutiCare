import os
import tempfile
from typing import List

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.core.security import get_current_user_token
from app.core.config import get_settings
from app.database.connection import get_db
from app.models.user import PredictionAnalysis
from app.schemas.user import PredictionHistoryItem, PredictionRequest, PredictionResponse
from app.services.prediction_service import ModelConfigurationError, ModelInferenceError, PredictionService

router = APIRouter(prefix="/api", tags=["prediction"])
settings = get_settings()

ALLOWED_VIDEO_TYPES = {
    "video/mp4",
    "video/avi",
    "video/x-msvideo",
    "video/quicktime",
    "video/mov",
}


def to_prediction_response(record: PredictionAnalysis) -> PredictionResponse:
    return PredictionResponse(
        id=record.id,
        child_id=record.child_id,
        support_indicator=record.support_indicator,
        confidence_score=record.confidence_score or 0,
        percentage=record.percentage or 0,
        summary=record.summary,
        recommendations=record.recommendations or [],
        disclaimer=record.disclaimer,
        source=record.source,
        created_at=record.created_at.isoformat() if record.created_at else None,
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


@router.post("/prediction/analyze", response_model=PredictionResponse, status_code=status.HTTP_201_CREATED)
async def analyze_video(
    child_id: int = Form(...),
    file: UploadFile = File(...),
    token_payload: dict = Depends(get_current_user_token),
    db: Session = Depends(get_db),
):
    if file.content_type not in ALLOWED_VIDEO_TYPES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid video type. Upload MP4, AVI, or MOV.")

    user_id = int(token_payload.get("sub"))
    max_bytes = settings.max_video_upload_mb * 1024 * 1024
    temp_path = None

    try:
        suffix = os.path.splitext(file.filename or "")[1] or ".mp4"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
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

        result = PredictionService.analyze_video(temp_path)
        record = PredictionService.save_result(
            db,
            child_id=child_id,
            user_id=user_id,
            source="video",
            result=result,
            model_name=settings.ai_video_model_command,
            raw_output=result,
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
    finally:
        await file.close()
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)
