#!/usr/bin/env python
"""Validate human/pose presence in a video using MediaPipe Pose."""

import json
import os
import sys

def validate_human_presence(video_path: str, max_samples: int = 30) -> dict:
    if not os.path.exists(video_path):
        return {
            "status": "error",
            "has_human": False,
            "reason": "video_not_found",
            "error": f"Video file not found: {video_path}",
        }

    try:
        import cv2
        import mediapipe as mp
    except ImportError as e:
        return {
            "status": "error",
            "has_human": False,
            "reason": "missing_dependencies",
            "error": str(e),
        }

    capture = cv2.VideoCapture(video_path)
    if not capture.isOpened():
        return {
            "status": "error",
            "has_human": False,
            "reason": "cannot_open_video",
            "error": "OpenCV failed to open video.",
        }

    total_frames = int(capture.get(cv2.CAP_PROP_FRAME_COUNT))
    if total_frames <= 0:
        capture.release()
        return {
            "status": "error",
            "has_human": False,
            "reason": "empty_video",
            "error": "Video contains 0 frames.",
        }

    step = max(1, total_frames // max_samples)
    pose = mp.solutions.pose.Pose(
        static_image_mode=False,
        model_complexity=0,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5,
    )

    checked = 0
    detected = 0
    frame_idx = 0

    try:
        while capture.isOpened() and checked < max_samples:
            ret, frame = capture.read()
            if not ret:
                break
            if frame_idx % step == 0:
                checked += 1
                rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                res = pose.process(rgb)
                if res.pose_landmarks and len(res.pose_landmarks.landmark) > 0:
                    landmarks = res.pose_landmarks.landmark
                    # Verify key upper-body landmarks: 0 (nose), 11 (left_shoulder), 12 (right_shoulder)
                    keypoints_visible = any(
                        getattr(lm, "visibility", 1.0) > 0.4 or getattr(lm, "presence", 1.0) > 0.4
                        for lm in [landmarks[0], landmarks[11], landmarks[12]]
                    )
                    if keypoints_visible:
                        detected += 1
            frame_idx += 1
    finally:
        capture.release()
        pose.close()

    ratio = detected / max(1, checked)
    # Require observable human pose in at least 15% of sampled frames and at least 2 frames
    has_human = ratio >= 0.15 and detected >= 2

    return {
        "status": "success",
        "has_human": has_human,
        "ratio": round(ratio, 3),
        "detected_frames": detected,
        "checked_frames": checked,
        "total_frames": total_frames,
        "reason": "human_detected" if has_human else "no_person_detected",
    }


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"status": "error", "has_human": False, "reason": "missing_argument"}))
        sys.exit(1)
    result = validate_human_presence(sys.argv[1])
    print(json.dumps(result))
