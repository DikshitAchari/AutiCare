import json
import math
import os
import platform
import shlex
import subprocess
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional

from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.user import ChildProfile, PredictionAnalysis


class ModelConfigurationError(RuntimeError):
    pass


class ModelInferenceError(RuntimeError):
    pass


BEHAVIOR_NAMES = (
    "Hand Flapping",
    "Body Rocking",
    "Hand/Finger Stereotypies",
    "Repeated Jumping",
    "Pacing",
    "Repeated Turning/Twirling",
    "Repetitive Object Manipulation",
    "Repeated Hand Movements",
    "Self-Hitting / Repetitive Self-Injurious Movement",
    "Face Touching",
    "Repetitive Head Movement",
    "Repetitive Leg Movement",
)
TARGET_CLASS_MAPPING = {
    "ArmFlapping": "Hand Flapping",
    "Spinning": "Repeated Turning/Twirling",
}
ADDITIONAL_MODEL_CLASSES = {"HeadBanging": "Head Banging"}
PBR4RRB_MODEL_NAME = "AI4ASD-pbr4RRB"
BEHAVIOR_DISCLAIMER = (
    "This behavioral screening result is not a clinical diagnosis. "
    "Please consult a qualified healthcare professional for a complete evaluation."
)


def _validated_probability(value, field_name: str) -> float:
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise ModelInferenceError(f"Video model JSON has an invalid {field_name}.")
    probability = float(value)
    if not math.isfinite(probability) or not 0 <= probability <= 1:
        raise ModelInferenceError(f"Video model JSON has an invalid {field_name}.")
    return probability


def parse_model_command(command_value: Optional[str]) -> List[str]:
    if not command_value or not command_value.strip():
        raise ModelConfigurationError(
            "AI_VIDEO_MODEL_COMMAND is not configured. Set it to a JSON array of executable arguments."
        )

    command_value = command_value.strip()
    try:
        command = json.loads(command_value)
    except json.JSONDecodeError:
        try:
            command = shlex.split(
                command_value,
                posix=platform.system() != "Windows",
            )
        except ValueError as exc:
            raise ModelConfigurationError(
                "AI_VIDEO_MODEL_COMMAND could not be parsed."
            ) from exc
        if platform.system() == "Windows":
            command = [
                value[1:-1]
                if len(value) >= 2 and value[0] == value[-1] and value[0] in {"'", '"'}
                else value
                for value in command
            ]

    if (
        not isinstance(command, list)
        or not command
        or any(not isinstance(argument, str) or not argument for argument in command)
    ):
        raise ModelConfigurationError(
            "AI_VIDEO_MODEL_COMMAND must be a non-empty JSON array of non-empty strings."
        )
    return command


def build_behavior_analysis(model_output: dict) -> dict:
    if not isinstance(model_output, dict) or model_output.get("status") != "success":
        raise ModelInferenceError("Video model JSON must report a successful inference.")
    if model_output.get("model") != PBR4RRB_MODEL_NAME:
        raise ModelInferenceError("Video model JSON does not identify the expected pbr4RRB model.")

    repetitive_detected = model_output.get("repetitive_behavior_detected")
    if not isinstance(repetitive_detected, bool):
        raise ModelInferenceError("Video model JSON has an invalid repetitive_behavior_detected value.")

    behavior = model_output.get("behavior")
    confidence = model_output.get("confidence")
    if behavior is not None and behavior not in (*TARGET_CLASS_MAPPING, *ADDITIONAL_MODEL_CLASSES):
        raise ModelInferenceError("Video model JSON contains an unsupported behavior class.")
    if behavior is None:
        if confidence is not None:
            raise ModelInferenceError("Video model JSON has confidence without a classified behavior.")
        aggregate_confidence = None
    else:
        aggregate_confidence = _validated_probability(confidence, "confidence")

    raw_segments = model_output.get("segments")
    if not isinstance(raw_segments, list):
        raise ModelInferenceError("Video model JSON has an invalid segments value.")
    segments: List[dict] = []
    for segment in raw_segments:
        if not isinstance(segment, dict):
            raise ModelInferenceError("Video model JSON contains an invalid segment.")
        start_frame = segment.get("start_frame")
        end_frame = segment.get("end_frame")
        segment_behavior = segment.get("behavior")
        if (
            isinstance(start_frame, bool)
            or not isinstance(start_frame, int)
            or isinstance(end_frame, bool)
            or not isinstance(end_frame, int)
            or start_frame < 0
            or end_frame <= start_frame
            or segment_behavior not in (*TARGET_CLASS_MAPPING, *ADDITIONAL_MODEL_CLASSES)
        ):
            raise ModelInferenceError("Video model JSON contains an invalid segment.")
        segments.append(
            {
                "start_frame": start_frame,
                "end_frame": end_frame,
                "behavior": segment_behavior,
                "classification_confidence": _validated_probability(
                    segment.get("classification_confidence"),
                    "segment classification_confidence",
                ),
                "proposal_confidence": _validated_probability(
                    segment.get("proposal_confidence"), "segment proposal_confidence"
                ),
            }
        )

    if repetitive_detected != bool(segments):
        raise ModelInferenceError(
            "Video model JSON has inconsistent repetitive behavior and segment results."
        )
    if not repetitive_detected and behavior is not None:
        raise ModelInferenceError("Video model JSON has a behavior without a repetitive segment.")
    if repetitive_detected and behavior is None:
        raise ModelInferenceError("Video model JSON has segments without a video-level behavior.")

    def finding(name: str, class_name: str) -> dict:
        matched_segments = [item for item in segments if item["behavior"] == class_name]
        if behavior == class_name:
            finding_confidence = aggregate_confidence
        elif matched_segments:
            finding_confidence = max(
                item["classification_confidence"] for item in matched_segments
            )
        else:
            return {
                "name": name,
                "status": "not_analyzed",
                "confidence": None,
                "model": None,
                "segments": [],
            }
        return {
            "name": name,
            "status": "detected",
            "confidence": finding_confidence,
            "model": PBR4RRB_MODEL_NAME,
            "segments": matched_segments,
        }

    mapped_findings = {
        name: finding(name, class_name)
        for class_name, name in TARGET_CLASS_MAPPING.items()
    }
    behaviors = [
        mapped_findings.get(
            name,
            {
                "name": name,
                "status": "not_analyzed",
                "confidence": None,
                "model": None,
                "segments": [],
            },
        )
        for name in BEHAVIOR_NAMES
    ]
    additional_observations = [
        finding(name, class_name)
        for class_name, name in ADDITIONAL_MODEL_CLASSES.items()
    ]
    analyzed_count = sum(
        item["status"] != "not_analyzed" for item in behaviors
    )
    detected_count = sum(item["status"] == "detected" for item in behaviors)

    return {
        "analysis_type": "RRB_behavior_analysis",
        "behaviors": behaviors,
        "additional_observations": additional_observations,
        "supported_behavior_count": len(TARGET_CLASS_MAPPING),
        "analyzed_behavior_count": analyzed_count,
        "detected_behavior_count": detected_count,
        "repetitive_behavior_detected": repetitive_detected,
        "disclaimer": BEHAVIOR_DISCLAIMER,
    }


class PredictionService:
    @staticmethod
    def analyze_pose_temporally(video_path: str) -> Optional[dict]:
        project_root = Path(__file__).resolve().parents[3]
        if str(project_root) not in sys.path:
            sys.path.insert(0, str(project_root))
        experiment_dir = project_root / "experiments" / "pose_analysis"
        script_path = experiment_dir / "pose_video_test.py"
        if not script_path.exists():
            return None

        try:
            completed = subprocess.run(
                [sys.executable, str(script_path), video_path, "--sample-every", "1"],
                check=False,
                capture_output=True,
                text=True,
                timeout=120,
            )
        except (OSError, subprocess.TimeoutExpired):
            return None

        if completed.returncode != 0:
            return None

        try:
            probe = json.loads(completed.stdout)
        except json.JSONDecodeError:
            return None

        trajectory_json = probe.get("trajectory_json")
        if not trajectory_json or not os.path.exists(trajectory_json):
            return None

        try:
            with open(trajectory_json, "r", encoding="utf-8") as handle:
                trajectory = json.load(handle)
        except (OSError, json.JSONDecodeError):
            return None

        try:
            from experiments.pose_analysis.temporal_movement_analysis import analyze_trajectory_json
        except ImportError:
            return {
                "status": "available",
                "trajectory_json": trajectory_json,
                "channels": {},
                "limitations": ["Experimental analyzer is not available in the current Python environment."],
            }

        movement = analyze_trajectory_json(trajectory)
        if not isinstance(movement, dict):
            return None

        dominant_channels = []
        for channel_name, channel in movement.get("channels", {}).items():
            if not isinstance(channel, dict):
                continue
            dominant_channels.append(
                {
                    "name": channel_name,
                    "periodicity_score": float(channel.get("periodicity_score", 0.0)),
                    "dominant_frequency_hz": channel.get("dominant_frequency_hz"),
                    "interpretation": channel.get("interpretation"),
                }
            )
        dominant_channels.sort(key=lambda item: item["periodicity_score"], reverse=True)
        return {
            "status": "success",
            "engine": "AutiCare Experimental Pose Temporal Analyzer",
            "trajectory_json": trajectory_json,
            "video_summary": probe.get("video", {}),
            "channels": movement.get("channels", {}),
            "dominant_channels": dominant_channels[:5],
            "limitations": movement.get("limitations", []),
        }

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
        PredictionService.validate_child_access(db, child_id=child_id, user_id=user_id)

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
        try:
            db.commit()
            db.refresh(record)
        except SQLAlchemyError:
            db.rollback()
            raise
        return record

    @staticmethod
    def validate_child_access(db: Session, *, child_id: int, user_id: int) -> None:
        child = db.query(ChildProfile).filter(ChildProfile.id == child_id).first()
        if not child:
            raise ValueError("Child profile not found")
        if child.parent_id != user_id:
            raise PermissionError("You do not have access to this child profile")

    @staticmethod
    def analyze_video(video_path: str) -> dict:
        settings = get_settings()
        if not settings.ai_video_model_command:
            raise ModelConfigurationError(
                "Real AI inference is not configured. Add AI_VIDEO_MODEL_COMMAND to backend/.env "
                "with the pbr4RRB infer_video.py command."
            )

        if settings.ai_video_model_path:
            if not os.path.exists(settings.ai_video_model_path):
                raise ModelConfigurationError(f"Configured model file does not exist: {settings.ai_video_model_path}")
            if os.path.getsize(settings.ai_video_model_path) == 0:
                raise ModelConfigurationError(f"Configured model file is empty: {settings.ai_video_model_path}")

        command = parse_model_command(settings.ai_video_model_command)

        env = os.environ.copy()
        if settings.ai_video_model_path:
            env["AI_VIDEO_MODEL_PATH"] = settings.ai_video_model_path

        try:
            completed = subprocess.run(
                [*command, video_path],
                check=False,
                capture_output=True,
                text=True,
                timeout=settings.ai_video_inference_timeout_seconds,
                env=env,
            )
        except OSError as exc:
            executable = command[0].lower()
            if executable == "conda" or executable.endswith("\\conda.exe"):
                raise ModelConfigurationError(
                    "Unable to start conda. Ensure conda is installed and available to the FastAPI process."
                ) from exc
            raise ModelConfigurationError(
                f"Unable to start the configured video model command: {exc}"
            ) from exc
        except subprocess.TimeoutExpired as exc:
            raise ModelInferenceError(
                "Video model inference timed out after {} seconds.".format(
                    settings.ai_video_inference_timeout_seconds
                )
            ) from exc

        if completed.returncode != 0:
            detail = completed.stderr.strip() or completed.stdout.strip()
            detail = detail[-2000:] if detail else "Model command failed without diagnostic output."
            raise ModelInferenceError(f"Video model process failed: {detail}")

        try:
            payload = json.loads(completed.stdout)
        except json.JSONDecodeError as exc:
            raise ModelInferenceError(
                "Video model command must return valid JSON on stdout. "
                "Check that diagnostics are written to stderr."
            ) from exc

        behavior_analysis = build_behavior_analysis(payload)
        return {
            "support_indicator": "NOT_ASSESSED",
            "confidence_score": None,
            "percentage": None,
            "summary": (
                "This video analysis reports only behavior classes supported by the "
                "available model. Other listed behaviors were not analyzed."
            ),
            "recommendations": [],
            "disclaimer": BEHAVIOR_DISCLAIMER,
            "behavior_analysis": behavior_analysis,
            "model_output": payload,
        }
