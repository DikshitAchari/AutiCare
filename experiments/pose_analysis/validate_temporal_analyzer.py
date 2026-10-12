#!/usr/bin/env python3
"""Validation harness for the experimental temporal movement analyzer.

This script is intentionally kept separate from production code and focuses on
engineering validation using existing real trajectories and synthetic trajectories.
"""

from __future__ import annotations

import argparse
import json
import math
import time
from pathlib import Path
from typing import Any, Dict, Iterable, List, Sequence, Tuple

from temporal_movement_analysis import analyze_trajectory_json


PERSON_TEMPLATE = {
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
    "left_knee": {"x": 0.64, "y": 0.82, "z": 0.0, "visibility": 1.0, "presence": 1.0},
    "right_knee": {"x": 0.36, "y": 0.82, "z": 0.0, "visibility": 1.0, "presence": 1.0},
    "left_ankle": {"x": 0.66, "y": 0.9, "z": 0.0, "visibility": 1.0, "presence": 1.0},
    "right_ankle": {"x": 0.34, "y": 0.9, "z": 0.0, "visibility": 1.0, "presence": 1.0},
}

SCENARIOS = [
    "static",
    "periodic_wrist",
    "periodic_trunk",
    "periodic_vertical_body",
    "periodic_head",
    "periodic_leg",
    "low_visibility_leg",
    "global_translation",
    "short_signal",
]


def deep_copy_person():
    return {key: dict(value) for key, value in PERSON_TEMPLATE.items()}


def make_frame(index: int, landmarks: Dict[str, Dict[str, float]]):
    return {
        "frame_index": index,
        "timestamp_ms": index * 33,
        "pose_detected": True,
        "landmarks": landmarks,
    }


def generate_static_signal(length: int = 80):
    frames = []
    for i in range(length):
        landmarks = deep_copy_person()
        frames.append(make_frame(i, landmarks))
    return {"frames": frames}


def generate_periodic_wrist_signal(frequency_hz: float = 1.0, length: int = 80):
    frames = []
    for i in range(length):
        landmarks = deep_copy_person()
        phase = 2.0 * math.pi * frequency_hz * (i / 30.0)
        amp = 0.09 * math.sin(phase)
        landmarks["left_wrist"]["y"] = 0.70 + amp
        landmarks["right_wrist"]["y"] = 0.70 - amp
        landmarks["left_elbow"]["y"] = 0.55 + amp * 0.5
        landmarks["right_elbow"]["y"] = 0.55 - amp * 0.5
        frames.append(make_frame(i, landmarks))
    return {"frames": frames}


def generate_periodic_trunk_signal(frequency_hz: float = 1.0, length: int = 80):
    frames = []
    base_left_shoulder = {"x": 0.58, "y": 0.38}
    base_right_shoulder = {"x": 0.42, "y": 0.38}
    base_left_hip = {"x": 0.62, "y": 0.72}
    base_right_hip = {"x": 0.38, "y": 0.72}
    left_rel_offsets = {"left_elbow": {"x": 0.10, "y": 0.17}, "left_wrist": {"x": 0.14, "y": 0.32}, "nose": {"x": -0.10, "y": -0.18}, "left_ear": {"x": -0.06, "y": -0.20}}
    right_rel_offsets = {"right_elbow": {"x": -0.10, "y": 0.17}, "right_wrist": {"x": -0.14, "y": 0.32}, "right_ear": {"x": 0.06, "y": -0.20}}
    for i in range(length):
        landmarks = deep_copy_person()
        phase = 2.0 * math.pi * frequency_hz * (i / 30.0)
        shoulder_shift_y = 0.06 * math.sin(phase)
        hip_shift_y = -0.06 * math.sin(phase)
        shoulder_shift_x = 0.04 * math.sin(phase + math.pi / 2.0)
        hip_shift_x = -0.04 * math.sin(phase + math.pi / 2.0)
        left_shoulder = {
            "x": base_left_shoulder["x"] + shoulder_shift_x,
            "y": base_left_shoulder["y"] + shoulder_shift_y,
            "z": 0.0,
            "visibility": 1.0,
            "presence": 1.0,
        }
        right_shoulder = {
            "x": base_right_shoulder["x"] + shoulder_shift_x,
            "y": base_right_shoulder["y"] + shoulder_shift_y,
            "z": 0.0,
            "visibility": 1.0,
            "presence": 1.0,
        }
        left_hip = {"x": base_left_hip["x"] + hip_shift_x, "y": base_left_hip["y"] + hip_shift_y, "z": 0.0, "visibility": 1.0, "presence": 1.0}
        right_hip = {"x": base_right_hip["x"] + hip_shift_x, "y": base_right_hip["y"] + hip_shift_y, "z": 0.0, "visibility": 1.0, "presence": 1.0}
        landmarks["left_shoulder"] = left_shoulder
        landmarks["right_shoulder"] = right_shoulder
        landmarks["left_hip"] = left_hip
        landmarks["right_hip"] = right_hip
        for name, offset in left_rel_offsets.items():
            landmarks[name]["x"] = left_shoulder["x"] + offset["x"]
            landmarks[name]["y"] = left_shoulder["y"] + offset["y"]
        for name, offset in right_rel_offsets.items():
            landmarks[name]["x"] = right_shoulder["x"] + offset["x"]
            landmarks[name]["y"] = right_shoulder["y"] + offset["y"]
        landmarks["nose"]["x"] = (left_shoulder["x"] + right_shoulder["x"]) / 2.0
        landmarks["nose"]["y"] = (left_shoulder["y"] + right_shoulder["y"]) / 2.0 - 0.18
        landmarks["left_ear"]["x"] = left_shoulder["x"] - 0.06
        landmarks["left_ear"]["y"] = left_shoulder["y"] - 0.20
        landmarks["right_ear"]["x"] = right_shoulder["x"] + 0.06
        landmarks["right_ear"]["y"] = right_shoulder["y"] - 0.20
        for name in ["left_knee", "left_ankle", "right_knee", "right_ankle"]:
            base_shift = {"left_knee": {"x": 0.02, "y": 0.10}, "left_ankle": {"x": 0.04, "y": 0.18}, "right_knee": {"x": -0.02, "y": 0.10}, "right_ankle": {"x": -0.04, "y": 0.18}}[name]
            if name.startswith("left"):
                landmarks[name]["x"] = left_hip["x"] + base_shift["x"]
                landmarks[name]["y"] = left_hip["y"] + base_shift["y"]
            else:
                landmarks[name]["x"] = right_hip["x"] + base_shift["x"]
                landmarks[name]["y"] = right_hip["y"] + base_shift["y"]
        frames.append(make_frame(i, landmarks))
    return {"frames": frames}


def generate_vertical_body_signal(frequency_hz: float = 1.5, length: int = 80):
    frames = []
    for i in range(length):
        landmarks = deep_copy_person()
        amp = 0.08 * math.sin(2.0 * math.pi * frequency_hz * (i / 30.0))
        for name in landmarks:
            landmarks[name]["y"] += amp
        frames.append(make_frame(i, landmarks))
    return {"frames": frames}


def generate_periodic_head_signal(frequency_hz: float = 1.3, length: int = 80):
    frames = []
    for i in range(length):
        landmarks = deep_copy_person()
        amp = 0.08 * math.sin(2.0 * math.pi * frequency_hz * (i / 30.0))
        landmarks["nose"]["y"] = 0.20 + amp
        landmarks["nose"]["x"] = 0.50 + 0.03 * math.sin(2.0 * math.pi * frequency_hz * (i / 30.0))
        landmarks["left_ear"]["y"] = 0.18 + amp * 0.7
        landmarks["right_ear"]["y"] = 0.18 + amp * 0.7
        frames.append(make_frame(i, landmarks))
    return {"frames": frames}


def generate_periodic_leg_signal(frequency_hz: float = 1.0, length: int = 80):
    frames = []
    for i in range(length):
        landmarks = deep_copy_person()
        amp = 0.09 * math.sin(2.0 * math.pi * frequency_hz * (i / 30.0))
        landmarks["left_knee"]["y"] = 0.82 + amp
        landmarks["right_knee"]["y"] = 0.82 - amp
        landmarks["left_ankle"]["y"] = 0.90 + amp
        landmarks["right_ankle"]["y"] = 0.90 - amp
        frames.append(make_frame(i, landmarks))
    return {"frames": frames}


def generate_low_visibility_leg_signal(frequency_hz: float = 1.0, length: int = 80):
    trajectory = generate_periodic_leg_signal(frequency_hz, length)
    for frame in trajectory["frames"]:
        for name in ["left_knee", "right_knee", "left_ankle", "right_ankle"]:
            frame["landmarks"][name]["visibility"] = 0.10
            frame["landmarks"][name]["presence"] = 0.20
    return trajectory


def generate_global_translation_signal(frequency_hz: float = 0.8, length: int = 80):
    frames = []
    for i in range(length):
        landmarks = deep_copy_person()
        shift = 0.12 * math.sin(2.0 * math.pi * frequency_hz * (i / 30.0))
        for name in landmarks:
            landmarks[name]["x"] += shift
        frames.append(make_frame(i, landmarks))
    return {"frames": frames}


def generate_short_signal(length: int = 4):
    frames = []
    for i in range(length):
        frames.append(make_frame(i, deep_copy_person()))
    return {"frames": frames}


def summarize_result(result: Dict[str, Any]) -> Dict[str, Any]:
    channels = result.get("channels", {})
    channel_scores = {}
    for name, payload in channels.items():
        channel_scores[name] = float(payload.get("periodicity_score", 0.0))
    primary_channel = max(channel_scores.items(), key=lambda item: item[1], default=(None, 0.0))[0]
    return {
        "primary_channel": primary_channel,
        "scores": channel_scores,
        "status": result.get("status", "unknown"),
        "channel_quality": {name: payload.get("quality_status") for name, payload in channels.items()},
    }


def evaluate_static(summary: Dict[str, Any]) -> bool:
    return max(summary["scores"].values()) < 0.15


def evaluate_wrist(summary: Dict[str, Any]) -> bool:
    return summary["scores"].get("left_wrist_motion", 0.0) >= 0.25 and summary["scores"].get("trunk_motion", 0.0) < 0.2


def evaluate_trunk(summary: Dict[str, Any]) -> bool:
    return summary["scores"].get("trunk_motion", 0.0) >= 0.25 and summary["scores"].get("head_motion", 0.0) < summary["scores"].get("trunk_motion", 0.0) * 0.8


def evaluate_vertical(summary: Dict[str, Any]) -> bool:
    return summary["scores"].get("vertical_body_motion", 0.0) >= 0.25 and summary["scores"].get("trunk_motion", 0.0) < summary["scores"].get("vertical_body_motion", 0.0) * 0.8


def evaluate_head(summary: Dict[str, Any]) -> bool:
    return summary["scores"].get("head_motion", 0.0) >= 0.25 and summary["scores"].get("trunk_motion", 0.0) < 0.2


def evaluate_leg(summary: Dict[str, Any]) -> bool:
    leg_best = max(summary["scores"].get("left_leg_motion", 0.0), summary["scores"].get("right_leg_motion", 0.0))
    return leg_best >= 0.20


def evaluate_low_visibility_leg(summary: Dict[str, Any]) -> bool:
    return summary["channel_quality"].get("left_leg_motion") == "INSUFFICIENT" and summary["channel_quality"].get("right_leg_motion") == "INSUFFICIENT"


def evaluate_translation(summary: Dict[str, Any]) -> bool:
    return summary["scores"].get("body_translation", 0.0) >= 0.25 and summary["scores"].get("left_wrist_motion", 0.0) < 0.25 and summary["scores"].get("head_motion", 0.0) < 0.25


def evaluate_short(summary: Dict[str, Any]) -> bool:
    return summary["channel_quality"].get("trunk_motion") in {"LIMITED", "INSUFFICIENT"}


def compare_frequency(result: Dict[str, Any], expected_hz: float) -> float:
    channels = result.get("channels", {})
    for channel_name in ["left_wrist_motion", "trunk_motion", "vertical_body_motion", "head_motion", "left_leg_motion", "right_leg_motion"]:
        payload = channels.get(channel_name)
        if payload and payload.get("dominant_frequency_hz") is not None:
            observed = float(payload["dominant_frequency_hz"])
            return abs(observed - expected_hz)
    return float("inf")


def run_synthetic_validation() -> List[Dict[str, Any]]:
    cases = [
        ("static", generate_static_signal, evaluate_static, None),
        ("periodic_wrist", generate_periodic_wrist_signal, evaluate_wrist, 1.0),
        ("periodic_trunk", generate_periodic_trunk_signal, evaluate_trunk, 1.0),
        ("periodic_vertical_body", generate_vertical_body_signal, evaluate_vertical, 1.5),
        ("periodic_head", generate_periodic_head_signal, evaluate_head, 1.3),
        ("periodic_leg", generate_periodic_leg_signal, evaluate_leg, 1.0),
        ("low_visibility_leg", generate_low_visibility_leg_signal, evaluate_low_visibility_leg, None),
        ("global_translation", generate_global_translation_signal, evaluate_translation, None),
        ("short_signal", generate_short_signal, evaluate_short, None),
    ]
    results = []
    for name, generator, validator, expected_hz in cases:
        trajectory = generator() if expected_hz is None else generator(expected_hz)
        result = analyze_trajectory_json(trajectory)
        summary = summarize_result(result)
        passed = validator(summary)
        frequency_error = None
        if expected_hz is not None:
            frequency_error = compare_frequency(result, expected_hz)
        results.append({
            "scenario": name,
            "passed": passed,
            "primary_channel": summary["primary_channel"],
            "scores": summary["scores"],
            "channel_quality": summary["channel_quality"],
            "frequency_error_hz": frequency_error,
        })
    return results


def run_real_trajectory_validation(path: str) -> Dict[str, Any]:
    trajectory = json.loads(Path(path).read_text(encoding="utf-8"))
    result = analyze_trajectory_json(trajectory)
    return summarize_result(result)


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate the experimental temporal motion analyzer.")
    parser.add_argument("--trajectory", default=None, help="Optional real Stage 4 trajectory JSON path to validate.")
    parser.add_argument("--scenario", choices=SCENARIOS + ["all"], default="all")
    args = parser.parse_args()

    started = time.perf_counter()
    if args.scenario == "all":
        synthetic_results = run_synthetic_validation()
        summary = {"synthetic_results": synthetic_results}
        if all(item["passed"] for item in synthetic_results):
            summary["decision"] = "VALIDATION_PASSED_FOR_EXPERIMENTAL_INTEGRATION"
        else:
            summary["decision"] = "VALIDATION_PARTIALLY_PASSED_NEEDS_REFINEMENT"
        if args.trajectory:
            summary["real_trajectory"] = run_real_trajectory_validation(args.trajectory)
        print(json.dumps(summary, indent=2))
    else:
        generator_map = {
            "static": generate_static_signal,
            "periodic_wrist": generate_periodic_wrist_signal,
            "periodic_trunk": generate_periodic_trunk_signal,
            "periodic_vertical_body": generate_vertical_body_signal,
            "periodic_head": generate_periodic_head_signal,
            "periodic_leg": generate_periodic_leg_signal,
            "low_visibility_leg": generate_low_visibility_leg_signal,
            "global_translation": generate_global_translation_signal,
            "short_signal": generate_short_signal,
        }
        obj = generator_map[args.scenario]()
        result = analyze_trajectory_json(obj)
        print(json.dumps(summarize_result(result), indent=2))

    elapsed = time.perf_counter() - started
    print(json.dumps({"validation_runtime_seconds": round(elapsed, 4)}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
