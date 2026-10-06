import json
import logging
import os
import shlex
import subprocess
from typing import Any, Dict

from app.core.config import get_settings

logger = logging.getLogger(__name__)


class BASSTProvider:
    @staticmethod
    def is_available() -> bool:
        settings = get_settings()
        return bool(
            settings.basst_model_path
            and os.path.exists(settings.basst_model_path)
        )

    @staticmethod
    def analyze(video_path: str) -> Dict[str, Any]:
        settings = get_settings()

        if not BASSTProvider.is_available():
            return {
                "status": "not_available",
                "output": None,
                "error": "BASST checkpoint not found.",
            }

        # The BASST repository currently requires its own inference
        # environment and preprocessing pipeline. Until that command
        # is explicitly configured, report the model as configured
        # rather than fabricating an inference result.
        command = settings.basst_model_command

        if not command:
            return {
                "status": "configured",
                "output": None,
                "model_path": settings.basst_model_path,
                "reason": "BASST checkpoint is available, but no backend inference command has been configured yet.",
            }

        try:
            full_cmd = [*shlex.split(command, posix=False), video_path]

            completed = subprocess.run(
                full_cmd,
                check=False,
                capture_output=True,
                text=True,
                timeout=900,
            )

            stdout = completed.stdout.strip()

            if not stdout:
                return {
                    "status": "failed",
                    "output": None,
                    "error": completed.stderr.strip()
                    or "BASST inference returned no output.",
                }

            try:
                payload = json.loads(stdout)
            except json.JSONDecodeError:
                return {
                    "status": "failed",
                    "output": stdout,
                    "error": "BASST inference output was not valid JSON.",
                }

            return {
                "status": "completed" if completed.returncode == 0 else "failed",
                "output": payload,
                "returncode": completed.returncode,
            }

        except subprocess.TimeoutExpired:
            return {
                "status": "failed",
                "output": None,
                "error": "BASST inference timed out after 900 seconds.",
            }
        except OSError as exc:
            return {
                "status": "failed",
                "output": None,
                "error": f"Unable to execute BASST: {exc}",
            }