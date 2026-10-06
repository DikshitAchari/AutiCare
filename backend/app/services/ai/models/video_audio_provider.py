import logging
import os
import sys
from typing import Any, Dict

logger = logging.getLogger(__name__)


class VideoAudioProvider:
    @staticmethod
    def is_available() -> bool:
        from app.core.config import get_settings

        settings = get_settings()
        path = settings.video_audio_model_path

        return bool(path and os.path.isdir(path))

    @staticmethod
    def analyze(video_path: str) -> Dict[str, Any]:
        from app.core.config import get_settings

        settings = get_settings()

        if not VideoAudioProvider.is_available():
            return {
                "status": "not_available",
                "output": None,
                "error": "Video+Audio model directory not found.",
            }

        try:
            model_dir = settings.video_audio_model_path

            if model_dir not in sys.path:
                sys.path.insert(0, model_dir)

            from video_features import extract_video_features
            from audio_features import extract_audio_features
            from dual_nn import run_dual_nn
            from ensemble_fusion import fuse_predictions

            video_features = extract_video_features(video_path)
            audio_features = extract_audio_features(video_path)

            model_output = run_dual_nn(
                video_features,
                audio_features,
            )

            ensemble_output = fuse_predictions(model_output)

            return {
                "status": "completed",
                "output": {
                    "video_features": video_features,
                    "audio_features": audio_features,
                    "model_output": model_output,
                    "ensemble": ensemble_output,
                    "is_diagnostic_probability": False,
                },
            }

        except Exception as exc:
            logger.exception("[VIDEO+AUDIO] Analysis failed")
            return {
                "status": "failed",
                "output": None,
                "error": str(exc),
            }