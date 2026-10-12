#!/usr/bin/env python
"""Extract MediaPipe Pose Landmarker trajectories from one video."""

import argparse
import json
import logging
import math
import sys
import time
from datetime import datetime
from pathlib import Path

import cv2


EXPERIMENT_DIR = Path(__file__).resolve().parent
DEFAULT_MODEL = EXPERIMENT_DIR / "assets" / "pose_landmarker_lite.task"
OUTPUT_DIR = EXPERIMENT_DIR / "outputs"
SUPPORTED_SUFFIXES = {".mp4", ".avi", ".mov", ".mkv"}

# MediaPipe Pose landmark indices.
LANDMARK_INDICES = {
    "nose": 0,
    "left_ear": 7,
    "right_ear": 8,
    "left_shoulder": 11,
    "right_shoulder": 12,
    "left_elbow": 13,
    "right_elbow": 14,
    "left_wrist": 15,
    "right_wrist": 16,
    "left_hip": 23,
    "right_hip": 24,
    "left_knee": 25,
    "right_knee": 26,
    "left_ankle": 27,
    "right_ankle": 28,
    "left_heel": 29,
    "right_heel": 30,
    "left_foot_index": 31,
    "right_foot_index": 32,
}

SKELETON_EDGES = (
    ("left_ear", "left_shoulder"),
    ("right_ear", "right_shoulder"),
    ("left_shoulder", "right_shoulder"),
    ("left_shoulder", "left_elbow"),
    ("left_elbow", "left_wrist"),
    ("right_shoulder", "right_elbow"),
    ("right_elbow", "right_wrist"),
    ("left_shoulder", "left_hip"),
    ("right_shoulder", "right_hip"),
    ("left_hip", "right_hip"),
    ("left_hip", "left_knee"),
    ("left_knee", "left_ankle"),
    ("left_ankle", "left_heel"),
    ("left_heel", "left_foot_index"),
    ("right_hip", "right_knee"),
    ("right_knee", "right_ankle"),
    ("right_ankle", "right_heel"),
    ("right_heel", "right_foot_index"),
)


class PoseVideoError(Exception):
    """An expected input, model, or video-processing error."""


def parse_args():
    parser = argparse.ArgumentParser(
        description="Extract real MediaPipe Pose landmarks from one video."
    )
    parser.add_argument("video_path", help="Path to an MP4, AVI, MOV, or MKV video.")
    parser.add_argument(
        "--model",
        default=str(DEFAULT_MODEL),
        help="Path to the official Pose Landmarker .task asset.",
    )
    parser.add_argument(
        "--sample-every",
        type=int,
        default=1,
        metavar="N",
        help=(
            "Analyze every Nth decoded frame. Default 1 analyzes every frame. "
            "Sampling is recorded in the output; use 1 for full temporal detail."
        ),
    )
    parser.add_argument(
        "--annotated-video",
        action="store_true",
        help="Write a visual verification video under this experiment's outputs folder.",
    )
    return parser.parse_args()


def _timestamped_output_path(video_path, suffix):
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now().strftime("%Y%m%d-%H%M%S-%f")
    return OUTPUT_DIR / "{}-{}{}".format(Path(video_path).stem, stamp, suffix)


def _landmark_record(normalized, world):
    record = {
        "x": float(normalized.x),
        "y": float(normalized.y),
        "z": float(normalized.z),
    }
    visibility = getattr(normalized, "visibility", None)
    presence = getattr(normalized, "presence", None)
    if visibility is not None and math.isfinite(float(visibility)):
        record["visibility"] = float(visibility)
    if presence is not None and math.isfinite(float(presence)):
        record["presence"] = float(presence)
    if world is not None:
        record["world"] = {
            "x": float(world.x),
            "y": float(world.y),
            "z": float(world.z),
        }
    return record


def _draw_pose(frame, landmarks):
    height, width = frame.shape[:2]
    pixels = {}
    for name, point in landmarks.items():
        x = int(round(point["x"] * width))
        y = int(round(point["y"] * height))
        pixels[name] = (x, y)
        cv2.circle(frame, (x, y), 4, (40, 220, 40), -1)

    for first, second in SKELETON_EDGES:
        if first in pixels and second in pixels:
            cv2.line(frame, pixels[first], pixels[second], (255, 80, 30), 2)
    return frame


def extract_video(video_path, model_path, sample_every, annotated_video):
    video_path = Path(video_path).expanduser().resolve()
    model_path = Path(model_path).expanduser().resolve()

    if not video_path.is_file():
        raise PoseVideoError("Video file does not exist.")
    if video_path.suffix.lower() not in SUPPORTED_SUFFIXES:
        raise PoseVideoError("Unsupported video format; use MP4, AVI, MOV, or MKV.")
    if not model_path.is_file() or model_path.stat().st_size == 0:
        raise PoseVideoError(
            "Pose Landmarker model asset is missing or empty: {}".format(model_path)
        )
    if sample_every < 1:
        raise PoseVideoError("--sample-every must be a positive integer.")

    try:
        import mediapipe as mp
        from mediapipe.tasks import python
        from mediapipe.tasks.python import vision
    except ImportError as exc:
        raise PoseVideoError(
            "MediaPipe is not installed in this Python environment. "
            "Use the isolated pose-analysis environment described in README.md."
        ) from exc

    capture = cv2.VideoCapture(str(video_path))
    if not capture.isOpened():
        capture.release()
        raise PoseVideoError("OpenCV could not open the supplied video.")

    reported_frames = int(capture.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = float(capture.get(cv2.CAP_PROP_FPS))
    width = int(capture.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(capture.get(cv2.CAP_PROP_FRAME_HEIGHT))
    duration_seconds = reported_frames / fps if reported_frames > 0 and fps > 0 else None

    if fps <= 0 or width <= 0 or height <= 0:
        capture.release()
        raise PoseVideoError("Video metadata has invalid FPS or dimensions.")

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    trajectory_path = _timestamped_output_path(video_path, ".json")
    annotated_path = (
        _timestamped_output_path(video_path, "-pose.mp4")
        if annotated_video
        else None
    )
    writer = None
    if annotated_path is not None:
        writer = cv2.VideoWriter(
            str(annotated_path),
            cv2.VideoWriter_fourcc(*"mp4v"),
            fps,
            (width, height),
        )
        if not writer.isOpened():
            capture.release()
            writer.release()
            raise PoseVideoError("Could not create the annotated output video.")

    base_options = python.BaseOptions(
        model_asset_path=str(model_path),
        delegate=python.BaseOptions.Delegate.CPU,
    )
    options = vision.PoseLandmarkerOptions(
        base_options=base_options,
        running_mode=vision.RunningMode.VIDEO,
        num_poses=1,
        output_segmentation_masks=False,
    )

    frames_read = 0
    frames_analyzed = 0
    frames_with_pose = 0
    trajectory_frames = []
    last_timestamp_ms = -1
    started = time.perf_counter()
    landmarker = None
    try:
        landmarker = vision.PoseLandmarker.create_from_options(options)
        while True:
            success, frame_bgr = capture.read()
            if not success:
                break

            frame_index = frames_read
            frames_read += 1
            analyze_this_frame = frame_index % sample_every == 0
            if not analyze_this_frame:
                if writer is not None:
                    writer.write(frame_bgr)
                continue

            timestamp_ms = int(round(frame_index * 1000.0 / fps))
            timestamp_ms = max(timestamp_ms, last_timestamp_ms + 1)
            last_timestamp_ms = timestamp_ms

            frame_rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
            mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=frame_rgb)
            result = landmarker.detect_for_video(mp_image, timestamp_ms)
            frames_analyzed += 1

            frame_landmarks = {}
            if result.pose_landmarks:
                normalized_pose = result.pose_landmarks[0]
                world_pose = (
                    result.pose_world_landmarks[0]
                    if result.pose_world_landmarks
                    else None
                )
                for name, index in LANDMARK_INDICES.items():
                    world_point = world_pose[index] if world_pose else None
                    frame_landmarks[name] = _landmark_record(
                        normalized_pose[index], world_point
                    )
                frames_with_pose += 1

            trajectory_frames.append(
                {
                    "frame_index": frame_index,
                    "timestamp_ms": timestamp_ms,
                    "pose_detected": bool(frame_landmarks),
                    "landmarks": frame_landmarks,
                }
            )

            if writer is not None:
                if frame_landmarks:
                    frame_bgr = _draw_pose(frame_bgr, frame_landmarks)
                writer.write(frame_bgr)
    except Exception as exc:
        if isinstance(exc, PoseVideoError):
            raise
        raise PoseVideoError("Pose/video processing failed: {}".format(exc)) from exc
    finally:
        capture.release()
        if writer is not None:
            writer.release()
        if landmarker is not None:
            landmarker.close()

    total_processing_seconds = time.perf_counter() - started
    if frames_read == 0 or frames_analyzed == 0:
        raise PoseVideoError("The video contains no readable/analyzed frames.")

    observed_points = {name: [] for name in LANDMARK_INDICES}
    for frame_record in trajectory_frames:
        for name, point in frame_record["landmarks"].items():
            observed_points[name].append(point)

    landmark_summary = {}
    for name, points in observed_points.items():
        summary = {"frames_detected": len(points)}
        if points:
            summary["mean_normalized_position"] = {
                axis: sum(point[axis] for point in points) / len(points)
                for axis in ("x", "y", "z")
            }
            visibility_values = [
                point["visibility"] for point in points if "visibility" in point
            ]
            presence_values = [
                point["presence"] for point in points if "presence" in point
            ]
            if visibility_values:
                summary["mean_visibility"] = sum(visibility_values) / len(
                    visibility_values
                )
            if presence_values:
                summary["mean_presence"] = sum(presence_values) / len(
                    presence_values
                )
        landmark_summary[name] = summary

    coverage = frames_with_pose / frames_analyzed * 100.0
    analyzed_fps = (
        frames_analyzed / total_processing_seconds
        if total_processing_seconds > 0
        else None
    )
    detailed_result = {
        "status": "success",
        "engine": "MediaPipe Pose Landmarker",
        "execution": {
            "delegate": "CPU",
            "running_mode": "VIDEO",
            "sample_every_nth_frame": sample_every,
            "timestamps": "source frame index / source FPS, in chronological order",
        },
        "video": {
            "path": str(video_path),
            "fps": fps,
            "width": width,
            "height": height,
            "reported_frame_count": reported_frames,
            "frames_read": frames_read,
            "frames_analyzed": frames_analyzed,
            "frames_with_pose": frames_with_pose,
            "duration_seconds": duration_seconds,
            "pose_detection_coverage_percent": coverage,
            "total_processing_seconds": total_processing_seconds,
            "analyzed_frames_per_second": analyzed_fps,
        },
        "pose_detected": frames_with_pose > 0,
        "landmark_summary": landmark_summary,
        "frames": trajectory_frames,
    }

    trajectory_path.write_text(
        json.dumps(detailed_result, indent=2),
        encoding="utf-8",
    )

    concise_result = {
        key: value for key, value in detailed_result.items() if key != "frames"
    }
    concise_result["trajectory_json"] = str(trajectory_path)
    if annotated_path is not None:
        concise_result["annotated_video"] = str(annotated_path)
    return concise_result


def main():
    logging.basicConfig(stream=sys.stderr, level=logging.INFO)
    args = parse_args()
    try:
        result = extract_video(
            args.video_path,
            args.model,
            args.sample_every,
            args.annotated_video,
        )
    except PoseVideoError as exc:
        print(json.dumps({"status": "error", "error": str(exc)}))
        return 2

    print(json.dumps(result, separators=(",", ":")))
    return 0


if __name__ == "__main__":
    sys.exit(main())
