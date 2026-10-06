"""
Algorithm 4b: ASDMotion Model Provider
======================================
Modular provider interface for the ASDMotion (Stereotypical Motor Movements - PoseC3D) model.
Executes OpenPose + PoseC3D inference via run_asdmotion_inference.py and returns genuine model metrics.
"""

import json
import logging
import os
import shlex
import subprocess
from typing import Any, Dict

from app.core.config import get_settings

logger = logging.getLogger(__name__)

DEFAULT_ASDMOTION_COMMAND = r"C:\Users\diksh\miniconda3\envs\asdmotion\python.exe C:\Users\diksh\OneDrive\Desktop\Auti-Fusion-AI\ASDMotion\run_asdmotion_inference.py"
DEFAULT_ASDMOTION_MODEL_PATH = r"C:\Users\diksh\OneDrive\Desktop\Auti-Fusion-AI\ASDMotion\resources\models\model.pth"


class ASDMotionProvider:
    @staticmethod
    def is_available() -> bool:
        get_settings.cache_clear()
        settings = get_settings()
        model_path = settings.asdmotion_model_path or DEFAULT_ASDMOTION_MODEL_PATH
        return os.path.exists(model_path)

    @staticmethod
    def analyze(video_path: str) -> Dict[str, Any]:
        """
        Executes ASDMotion SMM inference and returns standardized genuine output.
        """
        get_settings.cache_clear()
        settings = get_settings()
        cmd_str = settings.asdmotion_model_command or DEFAULT_ASDMOTION_COMMAND

        if not ASDMotionProvider.is_available():
            logger.info("[ASDMOTION] Model weights not found.")
            return {
                "status": "not_available",
                "error": "ASDMotion model checkpoint not found on filesystem.",
                "output": None,
            }

        command = shlex.split(cmd_str, posix=False)
        if not command:
            return {
                "status": "failed",
                "error": "ASDMOTION_MODEL_COMMAND is empty.",
                "output": None,
            }

        full_cmd = [*command, video_path]
        logger.info(f"[ASDMOTION PROVIDER COMMAND] {' '.join(full_cmd)}")

        try:
            completed = subprocess.run(
                full_cmd,
                check=False,
                capture_output=True,
                text=True,
                timeout=600,
            )
        except OSError as exc:
            logger.error(f"[ASDMOTION ERROR] Execution failed: {exc}")
            return {
                "status": "failed",
                "error": f"Unable to execute ASDMotion model command: {exc}",
                "output": None,
            }
        except subprocess.TimeoutExpired:
            logger.error("[ASDMOTION ERROR] Inference timed out.")
            return {
                "status": "failed",
                "error": "ASDMotion model inference timed out after 600s.",
                "output": None,
            }

        stdout_text = completed.stdout.strip()
        json_start = stdout_text.find("{")
        json_end = stdout_text.rfind("}") + 1
        if json_start != -1 and json_end > json_start:
            json_str = stdout_text[json_start:json_end]
        else:
            json_str = stdout_text

        try:
            payload = json.loads(json_str)
        except json.JSONDecodeError:
            err_msg = completed.stderr.strip() or stdout_text[:300]
            logger.error(f"[ASDMOTION JSON ERROR] Failed to parse output: {err_msg}")
            return {
                "status": "failed",
                "error": f"ASDMotion model output is not valid JSON: {err_msg}",
                "output": None,
            }

        if completed.returncode != 0 and payload.get("status") == "failed":
            return {
                "status": "failed",
                "error": payload.get("error", "ASDMotion inference returned error status"),
                "output": payload,
            }

        logger.info(f"[ASDMOTION SUCCESS] Analysis completed for {video_path}")
        return {
            "status": "completed",
            "output": payload,
        }
