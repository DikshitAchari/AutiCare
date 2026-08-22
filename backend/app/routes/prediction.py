from fastapi import APIRouter, Depends, HTTPException, status

from app.core.security import get_current_user_token
from app.schemas.user import PredictionRequest, PredictionResponse
from app.services.prediction_service import PredictionService

router = APIRouter(prefix="/api", tags=["prediction"])


@router.post("/prediction", response_model=PredictionResponse, status_code=status.HTTP_201_CREATED)
def get_prediction(payload: PredictionRequest, token_payload: dict = Depends(get_current_user_token)):
    try:
        result = PredictionService.predict(payload.answers)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Prediction failed") from exc

    return PredictionResponse(
        child_id=payload.child_id,
        support_indicator=result["support_indicator"],
        confidence_score=result["confidence_score"],
        percentage=result["percentage"],
        summary=result["summary"],
        recommendations=result["recommendations"],
        disclaimer=result["disclaimer"],
    )
