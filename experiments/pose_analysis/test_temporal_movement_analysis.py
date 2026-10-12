import json
import math
from pathlib import Path

import pytest

from temporal_movement_analysis import analyze_trajectory_json


PERSON_LANDMARKS = {
    "nose": {"x": 0.5, "y": 0.2, "z": 0.0, "visibility": 1.0, "presence": 1.0},
    "left_ear": {"x": 0.52, "y": 0.18, "z": 0.0, "visibility": 1.0, "presence": 1.0},
    "right_ear": {"x": 0.48, "y": 0.18, "z": 0.0, "visibility": 1.0, "presence": 1.0},
    "left_shoulder": {"x": 0.58, "y": 0.38, "z": 0.0, "visibility": 1.0, "presence": 1.0},
    "right_shoulder": {"x": 0.42, "y": 0.38, "z": 0.0, "visibility": 1.0, "presence": 1.0},
    "left_elbow": {"x": 0.68, "y": 0.55, "z": 0.0, "visibility": 1.0, "presence": 1.0},
    "right_elbow": {"x": 0.32, "y": 0.55, "z": 0.0, "visibility": 1.0, "presence": 1.0},
    "left_wrist": {"x": 0.72, "y": 0.7, "z": 0.0, "visibility": 1.0, "presence": 1.0},
    "right_wrist": {"x": 0.28, "y": 0.7, "z": 0.0, "visibility": 1.0, "presence": 1.0},
    "left_hip": {"x": 0.62, "y": 0.72, "z": 0.0, "visibility": 1.0, "presence": 1.0},
    "right_hip": {"x": 0.38, "y": 0.72, "z": 0.0, "visibility": 1.0, "presence": 1.0},
    "left_knee": {"x": 0.64, "y": 0.82, "z": 0.0, "visibility": 0.8, "presence": 0.9},
    "right_knee": {"x": 0.36, "y": 0.82, "z": 0.0, "visibility": 0.8, "presence": 0.9},
    "left_ankle": {"x": 0.66, "y": 0.9, "z": 0.0, "visibility": 0.7, "presence": 0.9},
    "right_ankle": {"x": 0.34, "y": 0.9, "z": 0.0, "visibility": 0.7, "presence": 0.9},
}


def _make_frame(frame_index, timestamp_ms, override=None):
    landmarks = json.loads(json.dumps(PERSON_LANDMARKS))
    if override:
        for name, values in override.items():
            landmarks[name] = values
    return {
        "frame_index": frame_index,
        "timestamp_ms": timestamp_ms,
        "pose_detected": True,
        "landmarks": landmarks,
    }


def test_valid_trajectory_json():
    frames = [_make_frame(i, i * 33) for i in range(32)]
    result = analyze_trajectory_json({"frames": frames})
    assert result["status"] == "success"
    assert "channels" in result
    assert result["channels"]["head_motion"]["quality_status"] in {"GOOD", "LIMITED"}


def test_missing_landmarks_are_treated_as_insufficient():
    frames = [_make_frame(i, i * 33, override={"left_wrist": None, "right_wrist": None}) for i in range(20)]
    result = analyze_trajectory_json({"frames": frames})
    assert result["channels"]["left_wrist_motion"]["quality_status"] == "INSUFFICIENT"


def test_low_visibility_is_filtered_out():
    frames = []
    for i in range(30):
        landmarks = json.loads(json.dumps(PERSON_LANDMARKS))
        landmarks["left_wrist"]["visibility"] = 0.10
        landmarks["left_wrist"]["presence"] = 0.20
        frames.append(_make_frame(i, i * 33, override={"left_wrist": landmarks["left_wrist"]}))
    result = analyze_trajectory_json({"frames": frames}, min_visibility=0.35, min_presence=0.45)
    assert result["channels"]["left_wrist_motion"]["quality_status"] == "INSUFFICIENT"


def test_no_pose_frames_is_insufficient():
    frames = [{"frame_index": i, "timestamp_ms": i * 33, "pose_detected": False, "landmarks": {}} for i in range(20)]
    result = analyze_trajectory_json({"frames": frames})
    assert result["channels"]["trunk_motion"]["quality_status"] == "INSUFFICIENT"


def test_short_signal_is_insufficient():
    frames = [_make_frame(i, i * 33) for i in range(4)]
    result = analyze_trajectory_json({"frames": frames})
    assert result["channels"]["trunk_motion"]["quality_status"] == "INSUFFICIENT"


def test_static_pose_is_not_a_positive_repetition_result():
    frames = [_make_frame(i, i * 33) for i in range(40)]
    result = analyze_trajectory_json({"frames": frames})
    assert result["channels"]["trunk_motion"]["interpretation"] in {"no strong repetitive pattern measured", "insufficient pose data"}


def test_synthetic_periodic_signal_is_detected_as_periodic():
    frames = []
    for i in range(80):
        phase = i / 80.0 * 2.0 * 3.14159 * 3.0
        oscillation = 0.08 * __import__("math").sin(phase)
        left_wrist = {"x": 0.74, "y": 0.70 + oscillation, "z": 0.0, "visibility": 0.9, "presence": 0.95}
        right_wrist = {"x": 0.26, "y": 0.70 - oscillation, "z": 0.0, "visibility": 0.9, "presence": 0.95}
        left_elbow = {"x": 0.67, "y": 0.56 + oscillation * 0.6, "z": 0.0, "visibility": 0.9, "presence": 0.95}
        right_elbow = {"x": 0.33, "y": 0.56 - oscillation * 0.6, "z": 0.0, "visibility": 0.9, "presence": 0.95}
        frames.append(
            _make_frame(
                i,
                i * 33,
                override={
                    "left_wrist": left_wrist,
                    "right_wrist": right_wrist,
                    "left_elbow": left_elbow,
                    "right_elbow": right_elbow,
                },
            )
        )
    result = analyze_trajectory_json({"frames": frames})
    assert result["channels"]["left_wrist_motion"]["periodicity_score"] > 0.0


def test_frequency_estimation_is_roughly_correct_for_wrist_signal():
    frames = []
    for i in range(80):
        phase = 2.0 * __import__("math").pi * 1.0 * i / 30.0
        amplitude = 0.08 * __import__("math").sin(phase)
        left_wrist = {"x": 0.72, "y": 0.70 + amplitude, "z": 0.0, "visibility": 0.95, "presence": 0.95}
        right_wrist = {"x": 0.28, "y": 0.70 - amplitude, "z": 0.0, "visibility": 0.95, "presence": 0.95}
        left_elbow = {"x": 0.68, "y": 0.55 + amplitude * 0.5, "z": 0.0, "visibility": 0.95, "presence": 0.95}
        right_elbow = {"x": 0.32, "y": 0.55 - amplitude * 0.5, "z": 0.0, "visibility": 0.95, "presence": 0.95}
        frames.append(_make_frame(i, i * 33, override={"left_wrist": left_wrist, "right_wrist": right_wrist, "left_elbow": left_elbow, "right_elbow": right_elbow}))
    result = analyze_trajectory_json({"frames": frames})
    observed = result["channels"]["left_wrist_motion"]["dominant_frequency_hz"]
    assert observed is not None
    assert abs(observed - 1.0) < 0.5


def test_global_translation_is_not_reported_as_local_repetitive_motion():
    frames = []
    for i in range(80):
        shift = 0.12 * __import__("math").sin(2.0 * __import__("math").pi * 0.8 * i / 30.0)
        landmarks = json.loads(json.dumps(PERSON_LANDMARKS))
        for name in landmarks:
            landmarks[name]["x"] += shift
        frames.append(_make_frame(i, i * 33, override={"left_shoulder": landmarks["left_shoulder"], "right_shoulder": landmarks["right_shoulder"], "left_hip": landmarks["left_hip"], "right_hip": landmarks["right_hip"], "nose": landmarks["nose"]}))
    result = analyze_trajectory_json({"frames": frames})
    assert result["channels"]["body_translation"]["periodicity_score"] > 0.0
    assert result["channels"]["trunk_motion"]["periodicity_score"] < 0.2


def test_common_translation_keeps_relative_channels_stable():
    base_frames = []
    for i in range(80):
        phase = 2.0 * math.pi * 1.0 * i / 30.0
        shoulder_shift_y = 0.06 * math.sin(phase)
        hip_shift_y = -0.06 * math.sin(phase)
        shoulder_shift_x = 0.04 * math.sin(phase + math.pi / 2.0)
        hip_shift_x = -0.04 * math.sin(phase + math.pi / 2.0)
        landmarks = json.loads(json.dumps(PERSON_LANDMARKS))
        landmarks["left_shoulder"] = {"x": 0.58 + shoulder_shift_x, "y": 0.38 + shoulder_shift_y, "z": 0.0, "visibility": 1.0, "presence": 1.0}
        landmarks["right_shoulder"] = {"x": 0.42 + shoulder_shift_x, "y": 0.38 + shoulder_shift_y, "z": 0.0, "visibility": 1.0, "presence": 1.0}
        landmarks["left_hip"] = {"x": 0.62 + hip_shift_x, "y": 0.72 + hip_shift_y, "z": 0.0, "visibility": 1.0, "presence": 1.0}
        landmarks["right_hip"] = {"x": 0.38 + hip_shift_x, "y": 0.72 + hip_shift_y, "z": 0.0, "visibility": 1.0, "presence": 1.0}
        for name, offset in {"left_elbow": (0.10, 0.17), "left_wrist": (0.14, 0.32), "left_knee": (0.02, 0.10), "left_ankle": (0.04, 0.18)}.items():
            landmarks[name] = {"x": landmarks["left_shoulder"]["x"] + offset[0], "y": landmarks["left_shoulder"]["y"] + offset[1], "z": 0.0, "visibility": 1.0, "presence": 1.0}
        for name, offset in {"right_elbow": (-0.10, 0.17), "right_wrist": (-0.14, 0.32), "right_knee": (-0.02, 0.10), "right_ankle": (-0.04, 0.18)}.items():
            landmarks[name] = {"x": landmarks["right_shoulder"]["x"] + offset[0], "y": landmarks["right_shoulder"]["y"] + offset[1], "z": 0.0, "visibility": 1.0, "presence": 1.0}
        landmarks["nose"] = {"x": (landmarks["left_shoulder"]["x"] + landmarks["right_shoulder"]["x"]) / 2.0, "y": (landmarks["left_shoulder"]["y"] + landmarks["right_shoulder"]["y"]) / 2.0 - 0.18, "z": 0.0, "visibility": 1.0, "presence": 1.0}
        landmarks["left_ear"] = {"x": landmarks["left_shoulder"]["x"] - 0.06, "y": landmarks["left_shoulder"]["y"] - 0.20, "z": 0.0, "visibility": 1.0, "presence": 1.0}
        landmarks["right_ear"] = {"x": landmarks["right_shoulder"]["x"] + 0.06, "y": landmarks["right_shoulder"]["y"] - 0.20, "z": 0.0, "visibility": 1.0, "presence": 1.0}
        base_frames.append(_make_frame(i, i * 33, override={**landmarks}))

    baseline = analyze_trajectory_json({"frames": base_frames})
    translated_frames = []
    for frame in base_frames:
        translated = {"frame_index": frame["frame_index"], "timestamp_ms": frame["timestamp_ms"], "pose_detected": frame["pose_detected"], "landmarks": {}}
        for name, point in frame["landmarks"].items():
            tx = 0.13 * math.sin(2.0 * math.pi * 1.0 * frame["frame_index"] / 30.0)
            ty = -0.05 * math.sin(2.0 * math.pi * 1.0 * frame["frame_index"] / 30.0)
            translated["landmarks"][name] = {**point, "x": point["x"] + tx, "y": point["y"] + ty}
        translated_frames.append(translated)
    translated_result = analyze_trajectory_json({"frames": translated_frames})

    assert abs(baseline["channels"]["trunk_motion"]["periodicity_score"] - translated_result["channels"]["trunk_motion"]["periodicity_score"]) < 0.15
    assert abs(baseline["channels"]["left_wrist_motion"]["periodicity_score"] - translated_result["channels"]["left_wrist_motion"]["periodicity_score"]) < 0.15
    assert abs(baseline["channels"]["head_motion"]["periodicity_score"] - translated_result["channels"]["head_motion"]["periodicity_score"]) < 0.15
    assert abs(baseline["channels"]["left_leg_motion"]["periodicity_score"] - translated_result["channels"]["left_leg_motion"]["periodicity_score"]) < 0.15
    assert translated_result["channels"]["body_translation"]["periodicity_score"] > 0.25


def test_malformed_json_raises_value_error():
    with pytest.raises(ValueError):
        analyze_trajectory_json({"frames": "not-a-list"})
