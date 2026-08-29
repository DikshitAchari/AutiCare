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


import logging
import cv2

logger = logging.getLogger(__name__)


def to_prediction_response(record: PredictionAnalysis) -> PredictionResponse:
    domain_breakdown = None
    if isinstance(record.raw_output, dict) and "domain_breakdown" in record.raw_output:
        domain_breakdown = record.raw_output["domain_breakdown"]

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
        domain_breakdown=domain_breakdown,
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

        # Inspect and log uploaded video properties
        cap = cv2.VideoCapture(temp_path)
        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        fps = float(cap.get(cv2.CAP_PROP_FPS)) or 0.0
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        duration = frame_count / fps if fps > 0 else 0.0
        cap.release()
        file_size = os.path.getsize(temp_path)

        logger.info(
            f"[VIDEO UPLOAD VERIFIED]\n"
            f"  - filename: {file.filename}\n"
            f"  - file size: {file_size} bytes\n"
            f"  - MIME type: {file.content_type}\n"
            f"  - temporary path: {temp_path}\n"
            f"  - duration: {duration:.2f}s\n"
            f"  - width: {width}\n"
            f"  - height: {height}\n"
            f"  - FPS: {fps:.2f}\n"
            f"  - frame count: {frame_count}"
        )

        print(f"UPLOAD FILE: {file.filename}")
        print(f"TEMP FILE: {temp_path}")
        print(f"MODEL CHECKPOINT: {settings.ai_video_model_path}")

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
        logger.info(
            f"[POSTGRESQL RECORD SAVED] Prediction ID={record.id}, child_id={child_id}, "
            f"user_id={user_id}, support={record.support_indicator}, percentage={record.percentage}"
        )
        response = to_prediction_response(record)
        print(f"DATABASE PREDICTION ID: {record.id}")
        print(f"FINAL API RESPONSE: {response.model_dump_json()}")
        return response
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


from fastapi.responses import StreamingResponse
from app.services.report_service import generate_prediction_pdf
from app.models.user import ChildProfile


@router.get("/prediction/results/{prediction_id}/report")
def download_prediction_report(
    prediction_id: int,
    token_payload: dict = Depends(get_current_user_token),
    db: Session = Depends(get_db),
):
    user_id = int(token_payload.get("sub"))
    user_role = token_payload.get("role", "").upper()

    record = db.query(PredictionAnalysis).filter(PredictionAnalysis.id == prediction_id).first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prediction analysis result not found")

    if user_role == "PARENT" and record.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to download this report")

    child = db.query(ChildProfile).filter(ChildProfile.id == record.child_id).first()
    pdf_buffer = generate_prediction_pdf(record, child)

    filename = f"AutiCare_Clinical_Report_{prediction_id}.pdf"
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )
