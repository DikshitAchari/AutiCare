import json
import os
import shlex
import subprocess
from typing import Dict, Optional

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
    def analyze_video(video_path: str) -> dict:
        get_settings.cache_clear()
        settings = get_settings()
        if not settings.ai_video_model_command:
            raise ModelConfigurationError(
                "Real AI model cannot run because the required model artifact/weights are missing. "
                "Please configure AI_VIDEO_MODEL_COMMAND or AI_VIDEO_MODEL_PATH in backend/.env pointing to the trained model weights/inference script."
            )

        if settings.ai_video_model_path:
            if not os.path.exists(settings.ai_video_model_path):
                raise ModelConfigurationError(f"Configured model file does not exist: {settings.ai_video_model_path}")
            if os.path.getsize(settings.ai_video_model_path) == 0:
                raise ModelConfigurationError(f"Configured model file is empty: {settings.ai_video_model_path}")

        command = shlex.split(settings.ai_video_model_command, posix=False)
        if not command:
            raise ModelConfigurationError("AI_VIDEO_MODEL_COMMAND is empty.")

        env = os.environ.copy()
        if settings.ai_video_model_path:
            env["AI_VIDEO_MODEL_PATH"] = settings.ai_video_model_path

        try:
            completed = subprocess.run(
                [*command, video_path],
                check=False,
                capture_output=True,
                text=True,
                timeout=300,
                env=env,
            )
        except OSError as exc:
            raise ModelConfigurationError(f"Unable to execute configured video model command: {exc}") from exc
        except subprocess.TimeoutExpired as exc:
            raise ModelInferenceError("Video model inference timed out.") from exc

        if completed.returncode != 0:
            detail = completed.stderr.strip() or completed.stdout.strip() or "Model command failed without output."
            raise ModelInferenceError(detail)

        try:
            payload = json.loads(completed.stdout)
        except json.JSONDecodeError as exc:
            raise ModelInferenceError("Video model command must return valid JSON on stdout.") from exc

        required = {"support_indicator", "confidence_score", "percentage", "summary", "recommendations"}
        missing = sorted(required - payload.keys())
        if missing:
            raise ModelInferenceError(f"Video model JSON is missing required fields: {', '.join(missing)}")

        payload.setdefault(
            "disclaimer",
            "This video analysis is a screening/support result only and does not constitute a medical diagnosis of autism spectrum disorder.",
        )
        return payload
