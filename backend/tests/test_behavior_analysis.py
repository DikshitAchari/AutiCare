from copy import deepcopy
from datetime import datetime, timezone
import json
from types import SimpleNamespace
from unittest.mock import Mock

import pytest
from sqlalchemy.exc import SQLAlchemyError

import app.services.prediction_service as prediction_service
from app.routes.prediction import to_prediction_response, validate_video_upload
from app.core.config import (
    DEFAULT_AI_VIDEO_INFERENCE_TIMEOUT_SECONDS,
    Settings,
)
from app.schemas.user import PredictionResponse
from app.services.prediction_service import (
    BEHAVIOR_DISCLAIMER,
    BEHAVIOR_NAMES,
    ModelConfigurationError,
    ModelInferenceError,
    PredictionService,
    build_behavior_analysis,
    parse_model_command,
)


def pbr_output(**overrides):
    output = {
        "status": "success",
        "model": "AI4ASD-pbr4RRB",
        "behavior": "ArmFlapping",
        "confidence": 0.91,
        "repetitive_behavior_detected": True,
        "segments": [
            {
                "start_frame": 24,
                "end_frame": 74,
                "behavior": "ArmFlapping",
                "classification_confidence": 0.91,
                "proposal_confidence": 0.82,
            }
        ],
    }
    output.update(overrides)
    return output


def test_supported_behavior_maps_with_real_model_confidence():
    analysis = build_behavior_analysis(pbr_output())
    findings = {item["name"]: item for item in analysis["behaviors"]}

    assert len(analysis["behaviors"]) == 12
    assert findings["Hand Flapping"]["status"] == "detected"
    assert findings["Hand Flapping"]["confidence"] == 0.91
    assert findings["Hand Flapping"]["model"] == "AI4ASD-pbr4RRB"
    assert findings["Hand Flapping"]["segments"][0]["start_frame"] == 24
    assert findings["Repeated Turning/Twirling"]["status"] == "not_analyzed"
    assert findings["Repeated Turning/Twirling"]["confidence"] is None
    assert findings["Repeated Turning/Twirling"]["model"] is None


def test_spinning_maps_to_repeated_turning_without_relabeling_other_classes():
    output = pbr_output(
        behavior="Spinning",
        confidence=0.84,
        segments=[
            {
                "start_frame": 35,
                "end_frame": 90,
                "behavior": "Spinning",
                "classification_confidence": 0.84,
                "proposal_confidence": 0.79,
            }
        ],
    )

    analysis = build_behavior_analysis(output)
    findings = {item["name"]: item for item in analysis["behaviors"]}

    assert findings["Repeated Turning/Twirling"]["status"] == "detected"
    assert findings["Repeated Turning/Twirling"]["confidence"] == 0.84
    assert findings["Repeated Turning/Twirling"]["segments"][0]["behavior"] == "Spinning"
    assert findings["Hand Flapping"]["status"] == "not_analyzed"


def test_unsupported_behaviors_have_no_fabricated_confidence():
    analysis = build_behavior_analysis(pbr_output())
    findings = {item["name"]: item for item in analysis["behaviors"]}

    for name in BEHAVIOR_NAMES:
        if name not in ("Hand Flapping", "Repeated Turning/Twirling"):
            assert findings[name]["status"] == "not_analyzed"
            assert findings[name]["confidence"] is None
            assert findings[name]["model"] is None

    assert "autism_percentage" not in analysis
    assert "autism_probability" not in analysis
    assert "autism_confidence" not in analysis


def test_head_banging_remains_a_separate_observation():
    output = pbr_output(
        behavior="HeadBanging",
        confidence=0.77,
        segments=[
            {
                "start_frame": 5,
                "end_frame": 40,
                "behavior": "HeadBanging",
                "classification_confidence": 0.77,
                "proposal_confidence": 0.8,
            }
        ],
    )

    analysis = build_behavior_analysis(output)
    findings = {item["name"]: item for item in analysis["behaviors"]}
    head_banging = analysis["additional_observations"][0]

    assert findings["Self-Hitting / Repetitive Self-Injurious Movement"]["status"] == "not_analyzed"
    assert head_banging["name"] == "Head Banging"
    assert head_banging["status"] == "detected"
    assert head_banging["confidence"] == 0.77


def test_exclusive_classifier_does_not_mark_other_classes_not_detected():
    analysis = build_behavior_analysis(pbr_output())
    findings = {item["name"]: item for item in analysis["behaviors"]}

    assert findings["Hand Flapping"]["status"] == "detected"
    assert findings["Repeated Turning/Twirling"]["status"] == "not_analyzed"


def test_no_repetitive_segment_returns_safe_empty_analysis():
    output = pbr_output(
        behavior=None,
        confidence=None,
        repetitive_behavior_detected=False,
        segments=[],
    )
    analysis = build_behavior_analysis(output)

    assert analysis["repetitive_behavior_detected"] is False
    assert analysis["analyzed_behavior_count"] == 0
    assert analysis["detected_behavior_count"] == 0
    assert all(item["status"] == "not_analyzed" for item in analysis["behaviors"])
    assert all(item["confidence"] is None for item in analysis["behaviors"])


def test_pbr_output_is_not_mutated_and_video_response_has_no_screening_score():
    output = pbr_output()
    original_output = deepcopy(output)
    analysis = build_behavior_analysis(output)
    response = PredictionResponse(
        child_id=1,
        support_indicator="NOT_ASSESSED",
        confidence_score=None,
        percentage=None,
        summary="Behavior analysis",
        recommendations=[],
        disclaimer=analysis["disclaimer"],
        source="video",
        behavior_analysis=analysis,
    )

    assert output == original_output
    response_data = response.model_dump()
    assert response_data["behavior_analysis"]["analysis_type"] == "RRB_behavior_analysis"
    assert response_data["percentage"] is None
    assert response_data["confidence_score"] is None
    assert "autism_percentage" not in response_data
    assert "autism_probability" not in response_data


def test_existing_questionnaire_prediction_response_contract_remains_valid():
    response = PredictionResponse.model_validate(
        {
            "id": 10,
            "child_id": 1,
            "support_indicator": "MODERATE",
            "confidence_score": 74,
            "percentage": 45,
            "summary": "Questionnaire summary",
            "recommendations": [],
            "disclaimer": "Questionnaire disclaimer",
            "source": "questionnaire",
        }
    )

    assert response.percentage == 45
    assert response.confidence_score == 74
    assert response.behavior_analysis is None


def test_prediction_route_serializes_persisted_behavior_analysis():
    analysis = build_behavior_analysis(pbr_output())
    record = SimpleNamespace(
        id=8,
        child_id=1,
        support_indicator="NOT_ASSESSED",
        confidence_score=None,
        percentage=None,
        summary="Video behavior analysis",
        recommendations=[],
        disclaimer=analysis["disclaimer"],
        source="video",
        created_at=datetime(2026, 10, 11, tzinfo=timezone.utc),
        raw_output={
            "model_output": pbr_output(),
            "behavior_analysis": analysis,
        },
    )

    response = to_prediction_response(record)

    assert response.behavior_analysis is not None
    assert len(response.behavior_analysis.behaviors) == 12
    assert response.behavior_analysis.behaviors[0].status == "detected"
    assert response.percentage is None
    assert response.confidence_score is None


def test_prediction_route_includes_pose_analysis_when_available():
    analysis = build_behavior_analysis(pbr_output())
    record = SimpleNamespace(
        id=9,
        child_id=1,
        support_indicator="NOT_ASSESSED",
        confidence_score=None,
        percentage=None,
        summary="Video behavior analysis",
        recommendations=[],
        disclaimer=analysis["disclaimer"],
        source="video",
        created_at=datetime(2026, 10, 11, tzinfo=timezone.utc),
        raw_output={
            "model_output": pbr_output(),
            "behavior_analysis": analysis,
            "pose_analysis": {"status": "success", "channels": {"trunk_motion": {"periodicity_score": 0.75}}},
        },
    )

    response = to_prediction_response(record)

    assert response.pose_analysis is not None
    assert response.pose_analysis["status"] == "success"
    assert response.pose_analysis["channels"]["trunk_motion"]["periodicity_score"] == 0.75


@pytest.mark.parametrize(
    ("filename", "content_type", "size", "expected_suffix"),
    [
        ("child.mp4", "video/mp4", 100, ".mp4"),
        ("folder\\child.avi", "video/x-msvideo", 100, ".avi"),
        ("child.mov", "video/quicktime", 100, ".mov"),
    ],
)
def test_video_upload_validation_accepts_supported_file_types(
    filename, content_type, size, expected_suffix
):
    assert validate_video_upload(filename, content_type, size, 1000) == expected_suffix


@pytest.mark.parametrize(
    ("filename", "content_type", "size", "max_bytes", "status_code"),
    [
        ("child.mp4", "video/mp4", 0, 1000, 400),
        ("child.exe", "application/octet-stream", 100, 1000, 400),
        ("child.mp4", "video/quicktime", 100, 1000, 400),
        ("child.mp4", "video/mp4", 1001, 1000, 413),
    ],
)
def test_video_upload_validation_rejects_invalid_metadata(
    filename, content_type, size, max_bytes, status_code
):
    from fastapi import HTTPException

    with pytest.raises(HTTPException) as error:
        validate_video_upload(filename, content_type, size, max_bytes)

    assert error.value.status_code == status_code


def test_missing_video_model_command_is_a_configuration_error(monkeypatch):
    monkeypatch.setattr(
        prediction_service,
        "get_settings",
        lambda: SimpleNamespace(ai_video_model_command=None),
    )

    with pytest.raises(ModelConfigurationError, match="AI_VIDEO_MODEL_COMMAND"):
        PredictionService.analyze_video("C:\\runtime\\video.mp4")


def test_json_command_preserves_windows_paths_with_spaces():
    script_path = r"C:\AI Projects\pbr4RRB\infer_video.py"
    configured = json.dumps(
        ["conda", "run", "-n", "pbr4rrb", "python", script_path]
    )

    assert parse_model_command(configured) == [
        "conda",
        "run",
        "-n",
        "pbr4rrb",
        "python",
        script_path,
    ]


def test_legacy_windows_command_strips_quotes_from_paths_with_spaces(monkeypatch):
    monkeypatch.setattr(prediction_service.platform, "system", lambda: "Windows")

    command = parse_model_command(
        'conda run -n pbr4rrb python "C:\\AI Projects\\pbr4RRB\\infer_video.py"'
    )

    assert command[-1] == r"C:\AI Projects\pbr4RRB\infer_video.py"


def test_successful_subprocess_uses_json_stdout_and_ignores_stderr_warning(monkeypatch):
    output = pbr_output()
    run_process = Mock(
        return_value=SimpleNamespace(
            returncode=0,
            stdout=json.dumps(output),
            stderr="apex is not installed",
        )
    )
    monkeypatch.setattr(
        prediction_service,
        "get_settings",
        lambda: SimpleNamespace(
            ai_video_model_command='["conda","run","-n","pbr4rrb","python","C:\\\\AI Projects\\\\infer_video.py"]',
            ai_video_model_path=None,
            ai_video_inference_timeout_seconds=1800,
        ),
    )
    monkeypatch.setattr(prediction_service.subprocess, "run", run_process)

    result = PredictionService.analyze_video(r"C:\runtime videos\video-unique.mp4")

    assert result["model_output"] == output
    assert result["behavior_analysis"]["behaviors"][0]["status"] == "detected"
    assert result["percentage"] is None
    arguments = run_process.call_args.args[0]
    assert arguments[-1] == r"C:\runtime videos\video-unique.mp4"
    assert arguments[-2] == r"C:\AI Projects\infer_video.py"
    assert run_process.call_args.kwargs.get("shell", False) is False
    assert run_process.call_args.kwargs["timeout"] == 1800


def test_invalid_model_stdout_is_an_inference_error(monkeypatch):
    monkeypatch.setattr(
        prediction_service,
        "get_settings",
        lambda: SimpleNamespace(
            ai_video_model_command='["conda","run"]',
            ai_video_model_path=None,
            ai_video_inference_timeout_seconds=1200,
        ),
    )
    monkeypatch.setattr(
        prediction_service.subprocess,
        "run",
        Mock(return_value=SimpleNamespace(returncode=0, stdout="not json", stderr="warning")),
    )

    with pytest.raises(ModelInferenceError, match="valid JSON"):
        PredictionService.analyze_video("video.mp4")


def test_failed_model_process_returns_diagnostic_error(monkeypatch):
    monkeypatch.setattr(
        prediction_service,
        "get_settings",
        lambda: SimpleNamespace(
            ai_video_model_command='["conda","run"]',
            ai_video_model_path=None,
            ai_video_inference_timeout_seconds=1200,
        ),
    )
    monkeypatch.setattr(
        prediction_service.subprocess,
        "run",
        Mock(return_value=SimpleNamespace(returncode=1, stdout="", stderr="checkpoint missing")),
    )

    with pytest.raises(ModelInferenceError, match="checkpoint missing"):
        PredictionService.analyze_video("video.mp4")


def test_unavailable_conda_is_a_configuration_error(monkeypatch):
    monkeypatch.setattr(
        prediction_service,
        "get_settings",
        lambda: SimpleNamespace(
            ai_video_model_command='["conda","run"]',
            ai_video_model_path=None,
            ai_video_inference_timeout_seconds=1200,
        ),
    )
    monkeypatch.setattr(
        prediction_service.subprocess,
        "run",
        Mock(side_effect=FileNotFoundError("conda")),
    )

    with pytest.raises(ModelConfigurationError, match="Ensure conda is installed"):
        PredictionService.analyze_video("video.mp4")


def test_model_timeout_is_reported_as_inference_error(monkeypatch):
    monkeypatch.setattr(
        prediction_service,
        "get_settings",
        lambda: SimpleNamespace(
            ai_video_model_command='["conda","run"]',
            ai_video_model_path=None,
            ai_video_inference_timeout_seconds=1500,
        ),
    )
    monkeypatch.setattr(
        prediction_service.subprocess,
        "run",
        Mock(side_effect=prediction_service.subprocess.TimeoutExpired("conda", 1500)),
    )

    with pytest.raises(ModelInferenceError, match="timed out after 1500 seconds"):
        PredictionService.analyze_video("video.mp4")


def test_database_failure_rolls_back_without_returning_a_prediction():
    child = SimpleNamespace(parent_id=5)

    class FakeQuery:
        def filter(self, *_args):
            return self

        def first(self):
            return child

    class FakeDatabase:
        rolled_back = False

        def query(self, *_args):
            return FakeQuery()

        def add(self, _record):
            pass

        def commit(self):
            raise SQLAlchemyError("database unavailable")

        def rollback(self):
            self.rolled_back = True

    db = FakeDatabase()
    result = {
        "support_indicator": "NOT_ASSESSED",
        "confidence_score": None,
        "percentage": None,
        "summary": "Behavior result",
        "recommendations": [],
        "disclaimer": BEHAVIOR_DISCLAIMER,
    }

    with pytest.raises(SQLAlchemyError):
        PredictionService.save_result(
            db,
            child_id=1,
            user_id=5,
            source="video",
            result=result,
            raw_output={},
        )

    assert db.rolled_back


def test_video_inference_timeout_has_cpu_friendly_default():
    settings = Settings(_env_file=None)

    assert settings.ai_video_inference_timeout_seconds == 1200


@pytest.mark.parametrize("invalid_timeout", ["0", "-20", "invalid", "1.5", True, None])
def test_invalid_video_inference_timeout_uses_default(invalid_timeout):
    settings = Settings(
        _env_file=None,
        ai_video_inference_timeout_seconds=invalid_timeout,
    )

    assert (
        settings.ai_video_inference_timeout_seconds
        == DEFAULT_AI_VIDEO_INFERENCE_TIMEOUT_SECONDS
    )


def test_valid_video_inference_timeout_is_loaded():
    settings = Settings(
        _env_file=None,
        ai_video_inference_timeout_seconds="1500",
    )

    assert settings.ai_video_inference_timeout_seconds == 1500
