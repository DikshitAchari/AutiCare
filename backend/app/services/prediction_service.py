import json
import logging
import os
import shlex
import subprocess
from typing import Dict, Optional

logger = logging.getLogger(__name__)

from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.user import ChildProfile, PredictionAnalysis


class ModelConfigurationError(RuntimeError):
    pass


class ModelInferenceError(RuntimeError):
    pass


class PredictionService:
    @staticmethod
    def predict(answers: Dict[str, int]) -> dict:
        total_score = sum(answers.values())
        max_score = len(answers) * 3 if answers else 0
        percentage = round((total_score / max_score) * 100) if max_score else 0

        if percentage > 65:
            support_indicator = "HIGH"
            summary = "The current screening indicates a higher probability of developmental support needs based on the questionnaire responses."
            recommendations = [
                "Consult a pediatric developmental specialist and consider early intervention planning.",
                "Review sensory processing and communication support strategies with a therapist.",
                "Use structured routines and social-practice activities at home.",
            ]
            confidence_score = 87
        elif percentage > 35:
            support_indicator = "MODERATE"
            summary = "The current screening suggests moderate developmental indicators that may warrant targeted observation and professional support."
            recommendations = [
                "Monitor milestones consistently and schedule a follow-up review.",
                "Consider speech or occupational therapy consultation if concerns persist.",
                "Maintain a structured learning and play routine.",
            ]
            confidence_score = 74
        else:
            support_indicator = "LOW"
            summary = "The current screening suggests low indicators based on the provided responses; periodic monitoring remains appropriate."
            recommendations = [
                "Continue routine developmental monitoring.",
                "Encourage social interaction and play-based learning activities.",
                "Reassess in time if new concerns arise.",
            ]
            confidence_score = 68

        disclaimer = (
            "This preliminary screening result is intended for research and educational support only. "
            "It does not constitute a medical diagnosis of autism spectrum disorder."
        )

        return {
            "support_indicator": support_indicator,
            "confidence_score": confidence_score,
            "percentage": percentage,
            "summary": summary,
            "recommendations": recommendations,
            "disclaimer": disclaimer,
        }

    @staticmethod
    def save_result(
        db: Session,
        *,
        child_id: int,
        user_id: int,
        source: str,
        result: dict,
        model_name: Optional[str] = None,
        model_version: Optional[str] = None,
        raw_output: Optional[dict] = None,
    ) -> PredictionAnalysis:
        child = db.query(ChildProfile).filter(ChildProfile.id == child_id).first()
        if not child:
            raise ValueError("Child profile not found")
        if child.parent_id != user_id:
            raise PermissionError("You do not have access to this child profile")

        record = PredictionAnalysis(
            child_id=child_id,
            user_id=user_id,
            source=source,
            support_indicator=result["support_indicator"],
            confidence_score=result.get("confidence_score"),
            percentage=result.get("percentage"),
            summary=result["summary"],
            recommendations=result.get("recommendations", []),
            disclaimer=result["disclaimer"],
            model_name=model_name,
            model_version=model_version,
            raw_output=raw_output,
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        return record

    @staticmethod
    def analyze_video(
        video_path: str,
        questionnaire_score: Optional[int] = None,
        questionnaire_max: Optional[int] = None,
        child_info: Optional[dict] = None,
    ) -> dict:
        from app.services.ai.pipeline import BehavioralAnalysisPipeline
        from app.services.ai.preprocessing.video_preprocessor import VideoPreprocessingError
        from app.services.ai.pbr4ai.provider import PBR4AIProviderError

        try:
            return BehavioralAnalysisPipeline.analyze_video(
                video_path=video_path,
                questionnaire_score=questionnaire_score,
                questionnaire_max=questionnaire_max,
                child_info=child_info,
            )
        except VideoPreprocessingError as exc:
            raise ModelConfigurationError(str(exc)) from exc
        except PBR4AIProviderError as exc:
            raise ModelInferenceError(str(exc)) from exc
        except Exception as exc:
            logger.error(f"[PREDICTION SERVICE ERROR] {exc}")
            raise ModelInferenceError(f"Video analysis pipeline failed: {exc}") from exc
