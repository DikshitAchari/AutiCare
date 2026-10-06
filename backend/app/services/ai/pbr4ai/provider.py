"""
Algorithm 4a: PBR4AI Model Provider
===================================
Executes the ETRI AI4ASD pbr4RRB inference pipeline (run_rrb_inference.py)
and returns standardized JSON output for restricted/repetitive motor behavior analysis.
"""

import os
import json
import logging
import shlex
import subprocess
from typing import Any, Dict

from app.core.config import get_settings

logger = logging.getLogger(__name__)

DEFAULT_PBR4AI_COMMAND = r"C:\Users\diksh\miniconda3\envs\asdmotion\python.exe C:\Users\diksh\OneDrive\Desktop\Auti-Fusion-AI\AI4ASD\pbr4RRB\run_rrb_inference.py"
DEFAULT_PBR4AI_MODEL_PATH = r"C:\Users\diksh\OneDrive\Desktop\Auti-Fusion-AI\AI4ASD\pbr4RRB\checkpoints\RRB_LA_Net_tr_countix.checkpoint"


class PBR4AIProviderError(RuntimeError):
    pass


class PBR4AIProvider:
    @staticmethod
    def is_available() -> bool:
        get_settings.cache_clear()
        settings = get_settings()
        model_path = settings.ai_video_model_path or DEFAULT_PBR4AI_MODEL_PATH
        return os.path.exists(model_path)

    @staticmethod
    def analyze(video_path: str) -> Dict[str, Any]:
        """
        Executes run_rrb_inference.py with the configured checkpoint and environment.
        """
        get_settings.cache_clear()
        settings = get_settings()

        cmd_str = settings.ai_video_model_command or DEFAULT_PBR4AI_COMMAND
        model_path = settings.ai_video_model_path or DEFAULT_PBR4AI_MODEL_PATH

        if not PBR4AIProvider.is_available():
            logger.error(f"[PBR4AI ERROR] Configured model checkpoint does not exist: {model_path}")
            return {
                "status": "failed",
                "error": f"Configured model checkpoint file does not exist: {model_path}",
                "output": None,
            }

        command = shlex.split(cmd_str, posix=False)
        if not command:
            return {
                "status": "failed",
                "error": "AI_VIDEO_MODEL_COMMAND is empty.",
                "output": None,
            }

        env = os.environ.copy()
        if model_path:
            env["AI_VIDEO_MODEL_PATH"] = model_path

        full_cmd = [*command, video_path]
        logger.info(f"[PBR4AI PROVIDER COMMAND] {' '.join(full_cmd)}")

        try:
            completed = subprocess.run(
                full_cmd,
                check=False,
                capture_output=True,
                text=True,
                timeout=300,
                env=env,
            )
        except OSError as exc:
            logger.error(f"[PBR4AI ERROR] Unable to execute PBR4AI model command: {exc}")
            return {
                "status": "failed",
                "error": f"Unable to execute PBR4AI model command: {exc}",
                "output": None,
            }
        except subprocess.TimeoutExpired:
            logger.error("[PBR4AI ERROR] PBR4AI model inference timed out.")
            return {
                "status": "failed",
                "error": "PBR4AI model inference timed out after 300s.",
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
            err_msg = completed.stderr.strip() or stdout_text[:300] or "Unknown inference error"
            logger.error(f"[PBR4AI ERROR] Output is not valid JSON: {err_msg}")
            return {
                "status": "failed",
                "error": f"PBR4AI model output is not valid JSON: {err_msg}",
                "output": None,
            }

        if completed.returncode != 0 and "error" in payload:
            return {
                "status": "failed",
                "error": payload["error"],
                "output": payload,
            }

        logger.info(f"[PBR4AI SUCCESS] Analysis completed for {video_path}")
        return {
            "status": "completed",
            "output": payload,
        }
