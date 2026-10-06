"""
Algorithm 2: Behavioral Feature Extraction
==========================================
Defines standardized behavioral feature extractors for:
- PBR4AI (Restricted & Repetitive Behaviors)
- ASDMotion (Stereotypic Motor Movements)
- AV-ASD (Audio-Visual ASD markers)
- Questionnaire (Developmental domain indicators)
"""

from typing import Any, Dict, Optional
from app.services.ai.contracts import (
    PBR4AIFeatures,
    ASDMotionFeatures,
    AVASDFeatures,
    ModelStatus,
)


class BehavioralFeatureExtractor:
    @staticmethod
    def extract_pbr4ai_features(raw_output: Dict[str, Any]) -> PBR4AIFeatures:
        """
        Extracts structured RRB features from PBR4AI output.
        """
        # Unwrap if structured provider response
        actual_output = raw_output.get("output") if isinstance(raw_output, dict) and "output" in raw_output and raw_output["output"] else raw_output

        metrics = actual_output.get("raw_model_metrics", {})
        action_probs = metrics.get("action_probabilities", {})
        top_action = metrics.get("top_action", "None")
        periodic_segments = metrics.get("periodic_segments", [])
        peak_osc = float(metrics.get("peak_oscillation_power", 0.0))
        subject_detected = actual_output.get("subject_detected", True)

        action_conf = float(action_probs.get(top_action, 0.0)) if top_action in action_probs else 0.0
        has_rep = len(periodic_segments) > 0 and peak_osc >= 0.28

        return PBR4AIFeatures(
            subject_detected=subject_detected,
            top_action=top_action if has_rep else "None",
            action_confidence=action_conf if has_rep else 0.0,
            action_probabilities=action_probs,
            periodic_segments=periodic_segments,
            peak_oscillation_power=peak_osc,
            has_repetitive_movement=has_rep,
            raw_confidence=int(actual_output.get("confidence_score", 0)),
            raw_percentage=int(actual_output.get("percentage", 0)),
            timing=actual_output.get("timing", {}),
        )

    @staticmethod
    def extract_asdmotion_features(raw_output: Optional[Dict[str, Any]]) -> ASDMotionFeatures:
        """
        Extracts SMM features from ASDMotion output or returns not_available state.
        """
        if not raw_output:
            return ASDMotionFeatures(
                status=ModelStatus.NOT_AVAILABLE,
                reason="ASDMotion analysis output not available",
                smm_detected=False,
                smm_confidence=0.0,
                smm_frequency=0.0,
                smm_duration_seconds=0.0,
                smm_segments=[],
            )

        status_val = raw_output.get("status", "")
        if status_val not in ("available", "completed"):
            reason = raw_output.get("error") or raw_output.get("reason", "ASDMotion execution not available")
            return ASDMotionFeatures(
                status=ModelStatus.NOT_AVAILABLE,
                reason=reason,
                smm_detected=False,
                smm_confidence=0.0,
                smm_frequency=0.0,
                smm_duration_seconds=0.0,
                smm_segments=[],
            )

        actual_output = raw_output.get("output") if ("output" in raw_output and raw_output["output"]) else raw_output

        smm_detected = bool(actual_output.get("smm_detected", False))
        avg_score = float(actual_output.get("average_stereotypical_score", 0.0))
        max_score = float(actual_output.get("max_stereotypical_score", 0.0))
        smm_conf = max_score if smm_detected else 0.0
        smm_freq = float(actual_output.get("smm_per_minute", 0.0))
        smm_dur = float(actual_output.get("smm_duration_seconds", 0.0))
        segments = actual_output.get("segments", [])

        return ASDMotionFeatures(
            status=ModelStatus.COMPLETED,
            reason=None,
            smm_detected=smm_detected,
            smm_confidence=smm_conf,
            smm_frequency=smm_freq,
            smm_duration_seconds=smm_dur,
            smm_segments=segments,
        )

    @staticmethod
    def extract_av_asd_features(raw_output: Optional[Dict[str, Any]]) -> AVASDFeatures:
        """
        Extracts AV-ASD features or returns not_available state.
        """
        if not raw_output or raw_output.get("status") not in ("available", "completed"):
            reason = (raw_output or {}).get("reason") or (raw_output or {}).get("error") or "AV-ASD model weights and inference implementation not present in repository"
            return AVASDFeatures(
                status=ModelStatus.NOT_AVAILABLE,
                reason=reason,
                audio_video_congruence=None,
                behavioral_markers={},
            )

        actual_output = raw_output.get("output") if ("output" in raw_output and raw_output["output"]) else raw_output

        return AVASDFeatures(
            status=ModelStatus.AVAILABLE,
            reason=None,
            audio_video_congruence=actual_output.get("audio_video_congruence"),
            behavioral_markers=actual_output.get("behavioral_markers", {}),
        )
