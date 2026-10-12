#!/usr/bin/env python3
"""Experimental temporal movement analysis for MediaPipe Pose trajectories.

This module intentionally analyzes already-extracted trajectory JSON files and
never reruns MediaPipe or any production AutiCare pipeline. It is designed to
report candidate movement measurements, not medical diagnoses.
"""

from __future__ import annotations

import argparse
import json
import math
import os
import time
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Sequence, Tuple

import numpy as np

FRAME_EXPECTED_KEYS = {"frame_index", "timestamp_ms", "pose_detected", "landmarks"}

DEFAULT_MIN_VISIBILITY = 0.35
DEFAULT_MIN_PRESENCE = 0.45
DEFAULT_MIN_SIGNAL_STD = 0.005
DEFAULT_MIN_PERIODICITY = 0.20


def _safe_float(value: Any, default: float = 0.0) -> float:
    try:
        value = float(value)
    except (TypeError, ValueError):
        return default
    if not math.isfinite(value):
        return default
    return value


def _is_valid_point(point: Optional[Dict[str, Any]]) -> bool:
    if not isinstance(point, dict):
        return False
    x = _safe_float(point.get("x"))
    y = _safe_float(point.get("y"))
    z = _safe_float(point.get("z"))
    if math.isnan(x) or math.isnan(y) or math.isnan(z):
        return False
    return True


def _landmark_quality(point: Optional[Dict[str, Any]], min_visibility: float, min_presence: float) -> bool:
    if not _is_valid_point(point):
        return False
    visibility = point.get("visibility")
    presence = point.get("presence")
    visibility_ok = True
    presence_ok = True
    if visibility is not None:
        visibility_ok = float(visibility) >= min_visibility
    if presence is not None:
        presence_ok = float(presence) >= min_presence
    return visibility_ok and presence_ok


def _quality_status(usable_frames: int, total_frames: int, mean_visibility: float, mean_presence: float) -> str:
    if total_frames <= 0:
        return "INSUFFICIENT"
    coverage = usable_frames / total_frames
    if coverage >= 0.7 and mean_visibility >= 0.60 and mean_presence >= 0.60:
        return "GOOD"
    if coverage >= 0.35 and (mean_visibility >= 0.35 or mean_presence >= 0.45):
        return "LIMITED"
    return "INSUFFICIENT"


def _weighted_mean(values: Sequence[float]) -> float:
    return float(np.mean(values)) if len(values) else 0.0


def _signal_statistics(signal: np.ndarray, timestamps_ms: np.ndarray) -> Dict[str, Any]:
    if signal.size < 3:
        return {
            "amplitude": 0.0,
            "mean": 0.0,
            "std": 0.0,
            "duration_seconds": 0.0,
            "dominant_frequency_hz": None,
            "periodicity_score": 0.0,
            "candidate_cycles": 0,
            "peaks": 0,
        }

    signal = np.asarray(signal, dtype=float)
    signal = signal - np.mean(signal)
    dt_seconds = np.median(np.diff(timestamps_ms)) / 1000.0 if timestamps_ms.size > 1 else 1.0 / 30.0
    dt_seconds = max(dt_seconds, 1.0 / 1000.0)
    smooth = np.convolve(signal, np.ones(min(5, signal.size)) / min(5, signal.size), mode="same")
    smooth_std = float(np.std(smooth))
    if smooth_std < DEFAULT_MIN_SIGNAL_STD:
        return {
            "amplitude": float(np.std(signal)),
            "mean": 0.0,
            "std": float(np.std(signal)),
            "duration_seconds": float((timestamps_ms[-1] - timestamps_ms[0]) / 1000.0) if timestamps_ms.size > 1 else 0.0,
            "dominant_frequency_hz": None,
            "periodicity_score": 0.0,
            "candidate_cycles": 0,
            "peaks": 0,
        }

    fft = np.abs(np.fft.rfft(smooth))
    freqs = np.fft.rfftfreq(smooth.size, d=dt_seconds)
    valid_mask = (freqs >= 0.25) & (freqs <= 5.0)
    if not np.any(valid_mask):
        dominant_frequency = None
        periodicity_score = 0.0
        candidate_cycles = 0
    else:
        candidate_fft = fft[valid_mask]
        candidate_freqs = freqs[valid_mask]
        dominant_index = int(np.argmax(candidate_fft))
        dominant_frequency = float(candidate_freqs[dominant_index])
        dominant_power = float(candidate_fft[dominant_index])
        total_power = float(np.sum(candidate_fft))
        periodicity_score = min(1.0, dominant_power / (total_power + 1e-9)) if total_power > 0 else 0.0
        signal_duration = float((timestamps_ms[-1] - timestamps_ms[0]) / 1000.0) if timestamps_ms.size > 1 else 0.0
        candidate_cycles = 0
        if dominant_frequency > 0 and signal_duration > 0:
            candidate_cycles = max(0, int(round(signal_duration * dominant_frequency)))

    peaks = 0
    if smooth.size >= 3:
        slopes = np.sign(np.diff(smooth))
        sign_changes = np.sum(slopes[:-1] != slopes[1:])
        peaks = max(0, sign_changes // 2)

    return {
        "amplitude": float(np.std(smooth)),
        "mean": float(np.mean(signal)),
        "std": float(np.std(smooth)),
        "duration_seconds": float((timestamps_ms[-1] - timestamps_ms[0]) / 1000.0) if timestamps_ms.size > 1 else 0.0,
        "dominant_frequency_hz": dominant_frequency,
        "periodicity_score": float(periodicity_score),
        "candidate_cycles": int(candidate_cycles),
        "peaks": int(peaks),
    }


def _extract_valid_series(
    frames: Sequence[Dict[str, Any]],
    landmark_names: Sequence[str],
    min_visibility: float,
    min_presence: float,
) -> Tuple[List[float], List[float], List[float], List[int], int, int]:
    values: List[float] = []
    timestamps: List[float] = []
    visibilities: List[float] = []
    presences: List[float] = []
    usable_frames = 0
    total_frames = 0
    for frame in frames:
        if not isinstance(frame, dict):
            continue
        total_frames += 1
        valid = True
        point_values = []
        for landmark in landmark_names:
            point = frame.get("landmarks", {}).get(landmark)
            if not _landmark_quality(point, min_visibility, min_presence):
                valid = False
                break
            point_values.append(_safe_float(point.get("x")))
            point_values.append(_safe_float(point.get("y")))
            point_values.append(_safe_float(point.get("z")))
        if not valid:
            continue
        if not point_values:
            continue
        usable_frames += 1
        values.append(float(np.mean([_safe_float(frame["landmarks"][landmark].get("y")) for landmark in landmark_names])))
        timestamps.append(float(frame.get("timestamp_ms", 0.0)))
        visibilities.extend(
            [
                float(frame["landmarks"][landmark].get("visibility", 0.0))
                for landmark in landmark_names
                if "visibility" in frame["landmarks"][landmark]
            ]
        )
        presences.extend(
            [
                float(frame["landmarks"][landmark].get("presence", 0.0))
                for landmark in landmark_names
                if "presence" in frame["landmarks"][landmark]
            ]
        )
    return values, timestamps, visibilities, presences, usable_frames, total_frames


def _series_for_signal(
    frames: Sequence[Dict[str, Any]],
    landmark_names: Sequence[str],
    min_visibility: float,
    min_presence: float,
    signal_kind: str = "y",
) -> Tuple[List[float], List[float], int, int, float, float]:
    signal_values: List[float] = []
    timestamps: List[float] = []
    usable_frames = 0
    total_frames = 0
    mean_visibility: List[float] = []
    mean_presence: List[float] = []
    for frame in frames:
        if not isinstance(frame, dict):
            continue
        total_frames += 1
        points = []
        valid = True
        for name in landmark_names:
            point = frame.get("landmarks", {}).get(name)
            if not _landmark_quality(point, min_visibility, min_presence):
                valid = False
                break
            points.append(point)
        if not valid or not points:
            continue
        usable_frames += 1
        values = [_safe_float(point.get(signal_kind)) for point in points]
        if not values or any(math.isnan(v) for v in values):
            continue
        signal_values.append(float(np.mean(values)))
        timestamps.append(float(frame.get("timestamp_ms", 0.0)))
        vis_list = [float(point.get("visibility")) for point in points if point.get("visibility") is not None]
        pre_list = [float(point.get("presence")) for point in points if point.get("presence") is not None]
        if vis_list:
            mean_visibility.append(float(np.mean(vis_list)))
        if pre_list:
            mean_presence.append(float(np.mean(pre_list)))
    return signal_values, timestamps, usable_frames, total_frames, _weighted_mean(mean_visibility), _weighted_mean(mean_presence)


def _center_point(points: Sequence[Dict[str, Any]]) -> Optional[Tuple[float, float, float]]:
    if not points:
        return None
    xs = [_safe_float(point.get("x")) for point in points]
    ys = [_safe_float(point.get("y")) for point in points]
    zs = [_safe_float(point.get("z")) for point in points]
    if any(math.isnan(v) for v in xs + ys + zs):
        return None
    return (float(np.mean(xs)), float(np.mean(ys)), float(np.mean(zs)))


def _point_distance(a: Sequence[float], b: Sequence[float]) -> float:
    return float(np.linalg.norm(np.asarray(a) - np.asarray(b)))


def _body_reference_scale(frame: Dict[str, Any]) -> float:
    landmarks = frame.get("landmarks", {})
    left_shoulder = landmarks.get("left_shoulder")
    right_shoulder = landmarks.get("right_shoulder")
    left_hip = landmarks.get("left_hip")
    right_hip = landmarks.get("right_hip")
    refs = []
    for a, b in (("left_shoulder", "right_shoulder"), ("left_hip", "right_hip"), ("left_shoulder", "left_hip"), ("right_shoulder", "right_hip")):
        pa = landmarks.get(a)
        pb = landmarks.get(b)
        if pa and pb and _is_valid_point(pa) and _is_valid_point(pb):
            refs.append(_point_distance([_safe_float(pa.get("x")), _safe_float(pa.get("y")), _safe_float(pa.get("z"))], [ _safe_float(pb.get("x")), _safe_float(pb.get("y")), _safe_float(pb.get("z"))]))
    return float(np.median(refs)) if refs else 1.0


def _relative_motion_signal(
    frames: Sequence[Dict[str, Any]],
    landmark_names: Sequence[str],
    reference_names: Sequence[str],
    min_visibility: float,
    min_presence: float,
    axis: str = "y",
) -> Tuple[List[float], List[float], int, int, float, float]:
    signal_values: List[float] = []
    timestamps: List[float] = []
    usable_frames = 0
    total_frames = 0
    vis_values: List[float] = []
    pre_values: List[float] = []
    axis_index = {"x": 0, "y": 1, "z": 2}
    baseline_local = None
    for frame in frames:
        if not isinstance(frame, dict):
            continue
        total_frames += 1
        target_points = []
        ref_points = []
        valid = True
        for name in landmark_names:
            point = frame.get("landmarks", {}).get(name)
            if not _landmark_quality(point, min_visibility, min_presence):
                valid = False
                break
            target_points.append(point)
        for name in reference_names:
            ref = frame.get("landmarks", {}).get(name)
            if not _landmark_quality(ref, min_visibility, min_presence):
                valid = False
                break
            ref_points.append(ref)
        if not valid or not target_points or not ref_points:
            continue
        target_center = _center_point(target_points)
        ref_center = _center_point(ref_points)
        if target_center is None or ref_center is None:
            continue
        scale = max(_body_reference_scale(frame), 1e-6)
        local_delta = target_center[axis_index.get(axis, 1)] - ref_center[axis_index.get(axis, 1)]
        if baseline_local is None:
            baseline_local = local_delta
        signal_values.append(float((local_delta - baseline_local) / scale))
        timestamps.append(float(frame.get("timestamp_ms", 0.0)))
        vis_values.extend(
            [float(p.get("visibility")) for p in target_points if p.get("visibility") is not None]
            + [float(p.get("visibility")) for p in ref_points if p.get("visibility") is not None]
        )
        pre_values.extend(
            [float(p.get("presence")) for p in target_points if p.get("presence") is not None]
            + [float(p.get("presence")) for p in ref_points if p.get("presence") is not None]
        )
        usable_frames += 1
    return signal_values, timestamps, usable_frames, total_frames, _weighted_mean(vis_values), _weighted_mean(pre_values)


def _trunk_configuration_signal(
    frames: Sequence[Dict[str, Any]],
    min_visibility: float,
    min_presence: float,
) -> Tuple[List[float], List[float], int, int, float, float]:
    signal_values: List[float] = []
    timestamps: List[float] = []
    usable_frames = 0
    total_frames = 0
    vis_values: List[float] = []
    pre_values: List[float] = []
    baseline_vector = None
    for frame in frames:
        if not isinstance(frame, dict):
            continue
        total_frames += 1
        left_shoulder = frame.get("landmarks", {}).get("left_shoulder")
        right_shoulder = frame.get("landmarks", {}).get("right_shoulder")
        left_hip = frame.get("landmarks", {}).get("left_hip")
        right_hip = frame.get("landmarks", {}).get("right_hip")
        if not all(
            _landmark_quality(point, min_visibility, min_presence)
            for point in (left_shoulder, right_shoulder, left_hip, right_hip)
        ):
            continue
        shoulder_center = _center_point([left_shoulder, right_shoulder])
        hip_center = _center_point([left_hip, right_hip])
        if shoulder_center is None or hip_center is None:
            continue
        torso_vector = np.asarray(shoulder_center, dtype=float) - np.asarray(hip_center, dtype=float)
        torso_magnitude = float(np.linalg.norm(torso_vector))
        if torso_magnitude < 1e-6:
            continue
        normalized_vector = torso_vector / torso_magnitude
        scale = max(_body_reference_scale(frame), 1e-6)
        if baseline_vector is None:
            baseline_vector = normalized_vector.copy()
        delta_vector = normalized_vector - baseline_vector
        signal_values.append(float(np.linalg.norm(delta_vector) / scale))
        timestamps.append(float(frame.get("timestamp_ms", 0.0)))
        vis_values.extend([
            float(left_shoulder.get("visibility", 0.0)),
            float(right_shoulder.get("visibility", 0.0)),
            float(left_hip.get("visibility", 0.0)),
            float(right_hip.get("visibility", 0.0)),
        ])
        pre_values.extend([
            float(left_shoulder.get("presence", 0.0)),
            float(right_shoulder.get("presence", 0.0)),
            float(left_hip.get("presence", 0.0)),
            float(right_hip.get("presence", 0.0)),
        ])
        usable_frames += 1
    return signal_values, timestamps, usable_frames, total_frames, _weighted_mean(vis_values), _weighted_mean(pre_values)


def _vertical_body_signal(
    frames: Sequence[Dict[str, Any]],
    min_visibility: float,
    min_presence: float,
) -> Tuple[List[float], List[float], int, int, float, float]:
    signal_values: List[float] = []
    timestamps: List[float] = []
    usable_frames = 0
    total_frames = 0
    vis_values: List[float] = []
    pre_values: List[float] = []
    baseline = None
    for frame in frames:
        if not isinstance(frame, dict):
            continue
        total_frames += 1
        body_points = [
            frame.get("landmarks", {}).get(name)
            for name in (
                "left_shoulder",
                "right_shoulder",
                "left_hip",
                "right_hip",
            )
        ]
        if not all(_landmark_quality(point, min_visibility, min_presence) for point in body_points):
            continue
        body_center = _center_point(body_points)
        if body_center is None:
            continue
        scale = max(_body_reference_scale(frame), 1e-6)
        if baseline is None:
            baseline = body_center[1]
        signal_values.append(float((body_center[1] - baseline) / scale))
        timestamps.append(float(frame.get("timestamp_ms", 0.0)))
        vis_values.extend(float(point.get("visibility")) for point in body_points if point.get("visibility") is not None)
        pre_values.extend(float(point.get("presence")) for point in body_points if point.get("presence") is not None)
        usable_frames += 1
    return signal_values, timestamps, usable_frames, total_frames, _weighted_mean(vis_values), _weighted_mean(pre_values)


def _build_channel_result(
    signal: Sequence[float],
    timestamps_ms: Sequence[float],
    usable_frames: int,
    total_frames: int,
    mean_visibility: float,
    mean_presence: float,
    interpretation: str,
    signal_label: str,
    min_periodicity: float = DEFAULT_MIN_PERIODICITY,
    force_insufficient: bool = False,
) -> Dict[str, Any]:
    if len(signal) < 5 or total_frames < 5:
        force_insufficient = True
    if signal and len(signal) >= 3 and not force_insufficient:
        signal_array = np.asarray(signal, dtype=float)
        stats = _signal_statistics(signal_array, np.asarray(timestamps_ms, dtype=float))
        periodicity_score = float(stats["periodicity_score"])
        dominant_frequency = stats["dominant_frequency_hz"]
        candidate_cycles = int(stats["candidate_cycles"])
        if periodicity_score >= min_periodicity and candidate_cycles >= 1:
            interpretation = "repetitive {} candidate".format(signal_label)
        elif periodicity_score >= min_periodicity * 0.75:
            interpretation = "no strong repetitive pattern measured"
        else:
            interpretation = "no strong repetitive pattern measured"
    else:
        periodicity_score = 0.0
        dominant_frequency = None
        candidate_cycles = 0
    quality = _quality_status(usable_frames, total_frames, mean_visibility, mean_presence)
    if force_insufficient:
        quality = "INSUFFICIENT"
    if quality == "INSUFFICIENT":
        interpretation = "insufficient pose data"
    return {
        "quality_status": quality,
        "usable_frames": usable_frames,
        "total_frames": total_frames,
        "coverage_percent": round((usable_frames / total_frames) * 100.0, 2) if total_frames else 0.0,
        "periodicity_score": round(periodicity_score, 4),
        "candidate_cycles": candidate_cycles,
        "dominant_frequency_hz": round(dominant_frequency, 4) if dominant_frequency is not None else None,
        "interpretation": interpretation,
    }


def _time_series_center(frames: Sequence[Dict[str, Any]], names: Sequence[str], min_visibility: float, min_presence: float) -> Tuple[List[float], List[float], int, int, float, float]:
    centers: List[float] = []
    timestamps: List[float] = []
    usable_frames = 0
    total_frames = 0
    vis_values: List[float] = []
    pre_values: List[float] = []
    for frame in frames:
        if not isinstance(frame, dict):
            continue
        total_frames += 1
        valid = True
        points = []
        for name in names:
            point = frame.get("landmarks", {}).get(name)
            if not _landmark_quality(point, min_visibility, min_presence):
                valid = False
                break
            points.append(point)
        if not valid:
            continue
        ref = _center_point(points)
        if ref is None:
            continue
        usable_frames += 1
        centers.append(ref[1])
        timestamps.append(float(frame.get("timestamp_ms", 0.0)))
        vis_values.extend(float(p.get("visibility")) for p in points if p.get("visibility") is not None)
        pre_values.extend(float(p.get("presence")) for p in points if p.get("presence") is not None)
    return centers, timestamps, usable_frames, total_frames, _weighted_mean(vis_values), _weighted_mean(pre_values)


def _motion_channel(
    frames: Sequence[Dict[str, Any]],
    landmark_names: Sequence[str],
    reference_names: Sequence[str],
    min_visibility: float,
    min_presence: float,
    axis: str,
    channel_name: str,
    description: str,
) -> Dict[str, Any]:
    signal, timestamps, usable_frames, total_frames, mean_visibility, mean_presence = _relative_motion_signal(
        frames, landmark_names, reference_names, min_visibility, min_presence, axis=axis
    )
    if len(signal) < 3:
        return {
            "quality_status": "INSUFFICIENT",
            "usable_frames": usable_frames,
            "total_frames": total_frames,
            "coverage_percent": round((usable_frames / total_frames) * 100.0, 2) if total_frames else 0.0,
            "periodicity_score": 0.0,
            "candidate_cycles": 0,
            "dominant_frequency_hz": None,
            "interpretation": "insufficient pose data",
        }
    result = _build_channel_result(
        signal,
        timestamps,
        usable_frames,
        total_frames,
        mean_visibility,
        mean_presence,
        description,
        channel_name,
    )
    return result


def analyze_trajectory_json(trajectory_data: Dict[str, Any], min_visibility: float = DEFAULT_MIN_VISIBILITY, min_presence: float = DEFAULT_MIN_PRESENCE) -> Dict[str, Any]:
    frames = trajectory_data.get("frames", [])
    if not isinstance(frames, list):
        raise ValueError("Trajectory JSON does not include a 'frames' list.")

    if not frames:
        return {
            "status": "success",
            "engine": "AutiCare Experimental Pose Temporal Analyzer",
            "source": {"trajectory_file": None, "duration_seconds": 0.0},
            "channels": {
                "trunk_motion": {"quality_status": "INSUFFICIENT", "usable_frames": 0, "total_frames": 0, "coverage_percent": 0.0, "periodicity_score": 0.0, "candidate_cycles": 0, "dominant_frequency_hz": None, "interpretation": "insufficient pose data"},
                "vertical_body_motion": {"quality_status": "INSUFFICIENT", "usable_frames": 0, "total_frames": 0, "coverage_percent": 0.0, "periodicity_score": 0.0, "candidate_cycles": 0, "dominant_frequency_hz": None, "interpretation": "insufficient pose data"},
                "left_wrist_motion": {"quality_status": "INSUFFICIENT", "usable_frames": 0, "total_frames": 0, "coverage_percent": 0.0, "periodicity_score": 0.0, "candidate_cycles": 0, "dominant_frequency_hz": None, "interpretation": "insufficient pose data"},
                "right_wrist_motion": {"quality_status": "INSUFFICIENT", "usable_frames": 0, "total_frames": 0, "coverage_percent": 0.0, "periodicity_score": 0.0, "candidate_cycles": 0, "dominant_frequency_hz": None, "interpretation": "insufficient pose data"},
                "head_motion": {"quality_status": "INSUFFICIENT", "usable_frames": 0, "total_frames": 0, "coverage_percent": 0.0, "periodicity_score": 0.0, "candidate_cycles": 0, "dominant_frequency_hz": None, "interpretation": "insufficient pose data"},
                "left_leg_motion": {"quality_status": "INSUFFICIENT", "usable_frames": 0, "total_frames": 0, "coverage_percent": 0.0, "periodicity_score": 0.0, "candidate_cycles": 0, "dominant_frequency_hz": None, "interpretation": "insufficient pose data"},
                "right_leg_motion": {"quality_status": "INSUFFICIENT", "usable_frames": 0, "total_frames": 0, "coverage_percent": 0.0, "periodicity_score": 0.0, "candidate_cycles": 0, "dominant_frequency_hz": None, "interpretation": "insufficient pose data"},
                "body_translation": {"quality_status": "INSUFFICIENT", "usable_frames": 0, "total_frames": 0, "coverage_percent": 0.0, "periodicity_score": 0.0, "candidate_cycles": 0, "dominant_frequency_hz": None, "interpretation": "insufficient pose data"},
            },
            "limitations": [
                "No valid pose frames were present in the supplied trajectory JSON.",
                "MediaPipe pose coverage is insufficient for temporal movement analysis.",
            ],
        }

    timestamps_ms = np.asarray([float(frame.get("timestamp_ms", 0.0)) for frame in frames if isinstance(frame, dict)], dtype=float)
    duration_seconds = float((timestamps_ms[-1] - timestamps_ms[0]) / 1000.0) if timestamps_ms.size > 1 else 0.0

    trunk_signal, trunk_times, trunk_usable, trunk_total, trunk_vis, trunk_pre = _trunk_configuration_signal(
        frames, min_visibility, min_presence
    )
    trunk_result = _build_channel_result(
        trunk_signal,
        trunk_times,
        trunk_usable,
        trunk_total,
        trunk_vis,
        trunk_pre,
        "repetitive trunk motion candidate",
        "trunk",
    )

    body_center_signal, body_times, body_usable, body_total, body_vis, body_pre = _vertical_body_signal(
        frames, min_visibility, min_presence
    )
    vertical_result = _build_channel_result(
        body_center_signal,
        body_times,
        body_usable,
        body_total,
        body_vis,
        body_pre,
        "vertical body motion candidate",
        "vertical body",
    )

    left_wrist_signal, left_wrist_times, left_wrist_usable, left_wrist_total, left_wrist_vis, left_wrist_pre = _relative_motion_signal(
        frames, ["left_wrist", "left_elbow"], ["left_shoulder"], min_visibility, min_presence, axis="y"
    )
    left_wrist_result = _build_channel_result(
        left_wrist_signal,
        left_wrist_times,
        left_wrist_usable,
        left_wrist_total,
        left_wrist_vis,
        left_wrist_pre,
        "left wrist motion candidate",
        "left wrist",
    )

    right_wrist_signal, right_wrist_times, right_wrist_usable, right_wrist_total, right_wrist_vis, right_wrist_pre = _relative_motion_signal(
        frames, ["right_wrist", "right_elbow"], ["right_shoulder"], min_visibility, min_presence, axis="y"
    )
    right_wrist_result = _build_channel_result(
        right_wrist_signal,
        right_wrist_times,
        right_wrist_usable,
        right_wrist_total,
        right_wrist_vis,
        right_wrist_pre,
        "right wrist motion candidate",
        "right wrist",
    )

    head_signal, head_times, head_usable, head_total, head_vis, head_pre = _relative_motion_signal(
        frames, ["nose", "left_ear", "right_ear"], ["left_shoulder", "right_shoulder"], min_visibility, min_presence, axis="y"
    )
    head_result = _build_channel_result(
        head_signal,
        head_times,
        head_usable,
        head_total,
        head_vis,
        head_pre,
        "head movement candidate",
        "head",
    )

    left_leg_signal, left_leg_times, left_leg_usable, left_leg_total, left_leg_vis, left_leg_pre = _relative_motion_signal(
        frames, ["left_knee", "left_ankle"], ["left_hip"], min_visibility, min_presence, axis="y"
    )
    left_leg_result = _build_channel_result(
        left_leg_signal,
        left_leg_times,
        left_leg_usable,
        left_leg_total,
        left_leg_vis,
        left_leg_pre,
        "left leg motion candidate",
        "left leg",
        force_insufficient=(left_leg_total > 0 and left_leg_usable / left_leg_total < 0.35),
    )

    right_leg_signal, right_leg_times, right_leg_usable, right_leg_total, right_leg_vis, right_leg_pre = _relative_motion_signal(
        frames, ["right_knee", "right_ankle"], ["right_hip"], min_visibility, min_presence, axis="y"
    )
    right_leg_result = _build_channel_result(
        right_leg_signal,
        right_leg_times,
        right_leg_usable,
        right_leg_total,
        right_leg_vis,
        right_leg_pre,
        "right leg motion candidate",
        "right leg",
        force_insufficient=(right_leg_total > 0 and right_leg_usable / right_leg_total < 0.35),
    )

    translation_signal = []
    translation_times = []
    translation_usable = 0
    translation_total = 0
    translation_vis = []
    translation_pre = []
    previous_center = None
    for frame in frames:
        if not isinstance(frame, dict):
            continue
        translation_total += 1
        points = []
        for name in ["left_shoulder", "right_shoulder", "left_hip", "right_hip"]:
            point = frame.get("landmarks", {}).get(name)
            if not _landmark_quality(point, min_visibility, min_presence):
                break
            points.append(point)
        else:
            if not points:
                continue
            center = _center_point(points)
            if center is None:
                continue
            translation_usable += 1
            if previous_center is None:
                displacement = 0.0
            else:
                displacement = float(np.linalg.norm(np.asarray(center, dtype=float) - np.asarray(previous_center, dtype=float)))
            translation_signal.append(displacement)
            translation_times.append(float(frame.get("timestamp_ms", 0.0)))
            translation_vis.extend(float(p.get("visibility")) for p in points if p.get("visibility") is not None)
            translation_pre.extend(float(p.get("presence")) for p in points if p.get("presence") is not None)
            previous_center = center
    body_translation_result = _build_channel_result(
        translation_signal,
        translation_times,
        translation_usable,
        translation_total,
        _weighted_mean(translation_vis),
        _weighted_mean(translation_pre),
        "body translation candidate",
        "translation",
    )
    if translation_usable >= 3:
        translation_diff = np.diff(np.asarray(translation_signal, dtype=float))
        sign_changes = np.sum(np.sign(translation_diff[:-1]) != np.sign(translation_diff[1:])) if translation_diff.size > 1 else 0
        body_translation_result["direction_reversals"] = int(sign_changes)
        body_translation_result["horizontal_range"] = float(np.max(translation_signal) - np.min(translation_signal)) if translation_signal else 0.0
        if translation_diff.size > 0:
            body_translation_result["mean_horizontal_velocity"] = round(float(np.mean(np.abs(translation_diff))), 6)
    else:
        body_translation_result["direction_reversals"] = 0
        body_translation_result["horizontal_range"] = 0.0

    limitations = [
        "This experimental layer only measures movement from pose landmarks and does not infer a medical diagnosis.",
        "Global camera motion and person translation can resemble local body movement when the entire torso shifts together.",
        "Lower-body landmarks can have lower visibility; conservative filtering is used to avoid unsupported claims.",
        "Body-relative normalization is based on torso-scale references derived from shoulder/hip geometry; it is not a clinical threshold.",
    ]

    return {
        "status": "success",
        "engine": "AutiCare Experimental Pose Temporal Analyzer",
        "source": {
            "trajectory_file": trajectory_data.get("source", {}).get("trajectory_file") if isinstance(trajectory_data.get("source"), dict) else None,
            "duration_seconds": round(duration_seconds, 4),
        },
        "channels": {
            "trunk_motion": trunk_result,
            "vertical_body_motion": vertical_result,
            "left_wrist_motion": left_wrist_result,
            "right_wrist_motion": right_wrist_result,
            "head_motion": head_result,
            "left_leg_motion": left_leg_result,
            "right_leg_motion": right_leg_result,
            "body_translation": body_translation_result,
        },
        "limitations": limitations,
        "quality_filters": {
            "min_visibility": min_visibility,
            "min_presence": min_presence,
            "normalization": "shoulder-width and hip-width torso scale, computed from left/right shoulder and hip distances per frame",
            "defaults": "0.35 visibility, 0.45 presence; values are configurable and are technical quality gates only",
        },
    }


def _load_trajectory_file(path: str | Path) -> Dict[str, Any]:
    file_path = Path(path).expanduser().resolve()
    if not file_path.is_file():
        raise FileNotFoundError(f"Trajectory JSON file not found: {file_path}")
    with file_path.open("r", encoding="utf-8") as handle:
        payload = json.load(handle)
    if not isinstance(payload, dict):
        raise ValueError("Trajectory JSON root must be an object.")
    payload.setdefault("source", {})
    payload["source"]["trajectory_file"] = str(file_path)
    return payload


def _save_plot(signal: Sequence[float], timestamps_ms: Sequence[float], output_path: Path, title: str) -> None:
    try:
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt
    except ImportError:
        return
    if not signal:
        return
    fig, ax = plt.subplots(figsize=(8, 3.5))
    xs = np.asarray(timestamps_ms, dtype=float) / 1000.0
    ys = np.asarray(signal, dtype=float)
    ax.plot(xs, ys, linewidth=1.5, color="#1f77b4")
    ax.set_title(title)
    ax.set_xlabel("Time (s)")
    ax.set_ylabel("Relative motion")
    fig.tight_layout()
    output_path.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(output_path, dpi=150)
    plt.close(fig)


def main() -> int:
    parser = argparse.ArgumentParser(description="Experimental pose-based temporal movement analysis.")
    parser.add_argument("trajectory_json", help="Path to a Stage 4 trajectory JSON file.")
    parser.add_argument("--min-visibility", type=float, default=DEFAULT_MIN_VISIBILITY)
    parser.add_argument("--min-presence", type=float, default=DEFAULT_MIN_PRESENCE)
    parser.add_argument("--plot", action="store_true", help="Save technical plot PNGs under experiments/pose_analysis/outputs/.")
    args = parser.parse_args()

    start = time.perf_counter()
    try:
        trajectory_data = _load_trajectory_file(args.trajectory_json)
        result = analyze_trajectory_json(trajectory_data, args.min_visibility, args.min_presence)
        if args.plot:
            output_dir = Path(__file__).resolve().parent / "outputs"
            output_dir.mkdir(parents=True, exist_ok=True)
            frames = trajectory_data.get("frames", [])
            if isinstance(frames, list) and frames:
                timestamps = np.asarray([float(frame.get("timestamp_ms", 0.0)) for frame in frames if isinstance(frame, dict)], dtype=float)
                for name, array in {
                    "trunk_motion": [
                        float(frame.get("landmarks", {}).get("left_shoulder", {}).get("y", 0.0))
                        for frame in frames if isinstance(frame, dict) and frame.get("landmarks")
                    ],
                }.items():
                    _save_plot(array, timestamps, output_dir / f"{name}.png", name.replace("_", " ").title())
        elapsed = time.perf_counter() - start
        result["analysis_runtime_seconds"] = round(elapsed, 4)
        result["trajectory_frames_processed"] = len(trajectory_data.get("frames", []))
        print(json.dumps(result, indent=2))
        return 0
    except Exception as exc:  # pragma: no cover - CLI fallback
        print(json.dumps({"status": "error", "error": str(exc)}, indent=2))
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
