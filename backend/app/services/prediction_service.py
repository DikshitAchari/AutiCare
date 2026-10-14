import json
import math
import os
import platform
import shlex
import subprocess
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

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


# General confidence acceptance threshold for behavioral detection.
# In a 3-class temporal action model with baseline chance of 33.3%,
# predictions below 0.60 represent ambiguous or weak evidence and must not
# be accepted as positive clinical behavioral detections.
CONFIDENCE_ACCEPTANCE_THRESHOLD = 0.60


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
        if not matched_segments and behavior != class_name:
            return {
                "name": name,
                "status": "not_analyzed",
                "confidence": None,
                "model": None,
                "segments": [],
            }

        accepted_segments = [
            item for item in matched_segments
            if item.get("classification_confidence", 0) >= CONFIDENCE_ACCEPTANCE_THRESHOLD
        ]

        if behavior == class_name and aggregate_confidence is not None:
            if aggregate_confidence >= CONFIDENCE_ACCEPTANCE_THRESHOLD:
                finding_confidence = aggregate_confidence
                valid_segments = accepted_segments if accepted_segments else matched_segments
                return {
                    "name": name,
                    "status": "detected",
                    "confidence": finding_confidence,
                    "model": PBR4RRB_MODEL_NAME,
                    "segments": valid_segments,
                }
            else:
                return {
                    "name": name,
                    "status": "not_detected",
                    "confidence": None,
                    "model": PBR4RRB_MODEL_NAME,
                    "segments": [],
                }
        elif accepted_segments:
            finding_confidence = max(
                item["classification_confidence"] for item in accepted_segments
            )
            return {
                "name": name,
                "status": "detected",
                "confidence": finding_confidence,
                "model": PBR4RRB_MODEL_NAME,
                "segments": accepted_segments,
            }
        else:
            return {
                "name": name,
                "status": "not_detected",
                "confidence": None,
                "model": PBR4RRB_MODEL_NAME,
                "segments": [],
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

    has_confidently_detected = any(
        item["status"] == "detected" for item in behaviors + additional_observations
    )
    status = "success" if has_confidently_detected else "no_supported_behavior_detected"
    reason = "behavior_detected" if has_confidently_detected else "insufficient_confidence"

    detected_behaviors = [
        {
            "behavior": item["name"],
            "confidence": item["confidence"],
            "segments": item.get("segments", []),
        }
        for item in behaviors + additional_observations
        if item.get("status") == "detected"
    ]

    return {
        "analysis_type": "RRB_behavior_analysis",
        "status": status,
        "reason": reason,
        "behaviors": behaviors,
        "additional_observations": additional_observations,
        "detected_behaviors": detected_behaviors,
        "supported_behavior_count": len(TARGET_CLASS_MAPPING),
        "analyzed_behavior_count": analyzed_count,
        "detected_behavior_count": detected_count,
        "repetitive_behavior_detected": has_confidently_detected,
        "disclaimer": BEHAVIOR_DISCLAIMER,
    }


def aggregate_temporal_windows(
    window_results: List[dict],
    window_metadata: Optional[List[dict]] = None,
) -> dict:
    """
    Aggregate results from multiple temporal windows.
    - Preserves model name and status.
    - Aggregates accepted segments (classification_confidence >= 0.60).
    - Deduplicates repeated classes.
    - Calculates peak confidence per detected class.
    - Sets video-level behavior to the highest-confidence detected action.
    """
    if not window_results:
        return {
            "status": "success",
            "model": PBR4RRB_MODEL_NAME,
            "behavior": None,
            "confidence": None,
            "repetitive_behavior_detected": False,
            "segments": [],
        }

    aggregated_segments: List[dict] = []
    class_peak_conf: Dict[str, float] = {}

    for idx, res in enumerate(window_results):
        if not isinstance(res, dict) or res.get("status") != "success":
            continue
        meta = window_metadata[idx] if window_metadata and idx < len(window_metadata) else {}
        frame_offset = int(meta.get("start_frame", 0))

        segments = res.get("segments") or []
        for seg in segments:
            conf = seg.get("classification_confidence")
            behavior = seg.get("behavior")
            if not behavior or conf is None or conf < CONFIDENCE_ACCEPTANCE_THRESHOLD:
                continue

            start_f = seg.get("start_frame", 0) + frame_offset
            end_f = seg.get("end_frame", start_f + 1) + frame_offset

            aggregated_segments.append(
                {
                    "start_frame": start_f,
                    "end_frame": end_f,
                    "behavior": behavior,
                    "classification_confidence": conf,
                    "proposal_confidence": seg.get("proposal_confidence", 0.0),
                }
            )

            if behavior not in class_peak_conf or conf > class_peak_conf[behavior]:
                class_peak_conf[behavior] = conf

        win_behavior = res.get("behavior")
        win_conf = res.get("confidence")
        if (
            win_behavior
            and win_conf is not None
            and win_conf >= CONFIDENCE_ACCEPTANCE_THRESHOLD
            and not segments
        ):
            if win_behavior not in class_peak_conf or win_conf > class_peak_conf[win_behavior]:
                class_peak_conf[win_behavior] = win_conf

    if not class_peak_conf:
        return {
            "status": "success",
            "model": PBR4RRB_MODEL_NAME,
            "behavior": None,
            "confidence": None,
            "repetitive_behavior_detected": False,
            "segments": [],
        }

    top_behavior = max(class_peak_conf.keys(), key=lambda b: class_peak_conf[b])
    top_confidence = class_peak_conf[top_behavior]

    return {
        "status": "success",
        "model": PBR4RRB_MODEL_NAME,
        "behavior": top_behavior,
        "confidence": top_confidence,
        "repetitive_behavior_detected": True,
        "segments": aggregated_segments,
    }


class PredictionService:
    aggregate_temporal_windows = staticmethod(aggregate_temporal_windows)
    @staticmethod
    def validate_human_presence(video_path: str) -> dict:
        project_root = Path(__file__).resolve().parents[3]
        script_path = project_root / "experiments" / "pose_analysis" / "validate_human_presence.py"
        if not script_path.exists():
            return {"status": "skipped", "has_human": True, "reason": "validator_missing"}

        candidates = [
            os.environ.get("AUTICARE_POSE_PYTHON"),
            str(Path(sys.prefix) / "envs" / "auticare-pose" / "python.exe"),
            str(Path.home() / "anaconda3" / "envs" / "auticare-pose" / "python.exe"),
            r"C:\Users\Vasanth.A\anaconda3\envs\auticare-pose\python.exe",
            sys.executable,
        ]
        python_exe = next((c for c in candidates if c and os.path.exists(c)), sys.executable)

        try:
            completed = subprocess.run(
                [python_exe, str(script_path), video_path],
                check=False,
                capture_output=True,
                text=True,
                timeout=45,
            )
        except (OSError, subprocess.TimeoutExpired) as exc:
            return {"status": "error", "has_human": False, "reason": "validation_timeout", "error": str(exc)}

        if completed.returncode != 0:
            return {
                "status": "error",
                "has_human": False,
                "reason": "validation_failed",
                "error": completed.stderr.strip() or completed.stdout.strip(),
            }

        try:
            lines = [line.strip() for line in completed.stdout.strip().splitlines() if line.strip()]
            return json.loads(lines[-1])
        except (json.JSONDecodeError, IndexError):
            return {"status": "error", "has_human": False, "reason": "invalid_validator_output"}

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
        is_behavior_detected = behavior_analysis["repetitive_behavior_detected"]

        if is_behavior_detected:
            summary = (
                "Video analysis identified repetitive behavior patterns supported by the model."
            )
            recommendations = [
                "Review findings with a pediatric therapist or clinical specialist.",
                "Observe if behaviors occur across different environments.",
            ]
        else:
            summary = (
                "No supported repetitive behavior was confidently detected in this video."
            )
            recommendations = [
                "For further confirmation or developmental concerns, consider consulting a qualified therapist or healthcare professional.",
            ]

        return {
            "support_indicator": "NOT_ASSESSED",
            "confidence_score": None,
            "percentage": None,
            "summary": summary,
            "recommendations": recommendations,
            "disclaimer": BEHAVIOR_DISCLAIMER,
            "behavior_analysis": behavior_analysis,
            "model_output": payload,
        }
