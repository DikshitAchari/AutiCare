"""
Multi-Modal Behavioral Fusion Engine
====================================
Orchestrates behavioral feature fusion across PBR4AI, ASDMotion, AV-ASD, and Questionnaire inputs.
Produces unified screening indicator, domain breakdowns, and clinical recommendations.
"""

import time
import logging
from typing import Any, Dict, Optional

from app.services.ai.contracts import (
    VideoMetadata,
    PBR4AIFeatures,
    ASDMotionFeatures,
    AVASDFeatures,
    NormalizedFeatures,
    FusionResult,
    ModelStatus,
)
from app.services.ai.feature_extraction.behavioral_features import BehavioralFeatureExtractor
from app.services.ai.normalization.feature_normalizer import FeatureNormalizer
from app.services.ai.risk_scoring.behavioral_screening_scorer import BehavioralScreeningScorer
from app.services.ai.therapist_recommendation.recommendation_engine import TherapistRecommendationEngine
from app.services.ai.report_generation.report_generator import DISCLAIMER_TEXT

logger = logging.getLogger(__name__)


class BehavioralFusionEngine:
    @classmethod
    def fuse(
        cls,
        video_metadata: VideoMetadata,
        pbr4ai_raw: Dict[str, Any],
        asdmotion_raw: Optional[Dict[str, Any]] = None,
        av_asd_raw: Optional[Dict[str, Any]] = None,
        questionnaire_score: Optional[int] = None,
        questionnaire_max: Optional[int] = None,
    ) -> FusionResult:
        """
        Fuses behavioral features across active and standby models.
        """
        t0 = time.time()

        # 1. Extract standardized features
        pbr4ai_feat = BehavioralFeatureExtractor.extract_pbr4ai_features(pbr4ai_raw)
        asdmotion_feat = BehavioralFeatureExtractor.extract_asdmotion_features(asdmotion_raw)
        av_asd_feat = BehavioralFeatureExtractor.extract_av_asd_features(av_asd_raw)

        # 2. Normalize features
        norm = FeatureNormalizer.normalize(
            pbr4ai=pbr4ai_feat,
            asdmotion=asdmotion_feat,
            questionnaire_score=questionnaire_score,
            questionnaire_max=questionnaire_max,
        )

        # 3. Calculate Behavioral Screening Indicator & Support Level
        percentage, confidence_score, support_indicator, summary, recommendations = (
            BehavioralScreeningScorer.calculate_screening_indicator(
                norm=norm,
                has_human_subject=pbr4ai_feat.subject_detected,
            )
        )

        # 4. Generate Behavioral Therapist Recommendations
        therapist_recs = TherapistRecommendationEngine.generate_recommendations(
            top_action=pbr4ai_feat.top_action,
            has_repetitive_movement=pbr4ai_feat.has_repetitive_movement,
            support_indicator=support_indicator,
        )

        # 5. Assemble Domain Breakdown
        domain_breakdown = {
            "rrb": {
                "status": "analyzed" if pbr4ai_feat.subject_detected else "no_subject",
                "percentage": percentage if pbr4ai_feat.has_repetitive_movement else (12 if pbr4ai_feat.subject_detected else 0),
                "action": pbr4ai_feat.top_action if pbr4ai_feat.has_repetitive_movement else "None",
                "action_confidence": round(pbr4ai_feat.action_confidence * 100, 1) if pbr4ai_feat.has_repetitive_movement else 0.0,
                "description": (
                    f"Restricted & Repetitive Behaviors ({pbr4ai_feat.top_action})"
                    if pbr4ai_feat.has_repetitive_movement
                    else ("No repetitive behaviors detected" if pbr4ai_feat.subject_detected else "No human subject detected")
                ),
            },
            "social_interaction": {
                "status": "not_analyzed",
                "percentage": None,
                "description": "Requires clinical interaction evaluation or AV-ASD integration",
            },
            "communication": {
                "status": "not_analyzed",
                "percentage": None,
                "description": "Requires speech/gesture assessment",
            },
            "sensory_adaptation": {
                "status": "not_analyzed",
                "percentage": None,
                "description": "Requires sensory processing profiling",
            },
        }

        # 6. Assemble Multi-Model Pipeline Status
        models_summary = {
            "pbr4ai": {
                "model_name": "AI4ASD pbr4RRB (Swin-3D + RepDetectNet)",
                "status": "available",
                "subject_detected": pbr4ai_feat.subject_detected,
                "top_action": pbr4ai_feat.top_action,
                "action_confidence": round(pbr4ai_feat.action_confidence, 4),
                "action_probabilities": pbr4ai_feat.action_probabilities,
                "periodic_segments": pbr4ai_feat.periodic_segments,
                "peak_oscillation_power": pbr4ai_feat.peak_oscillation_power,
            },
            "asdmotion": {
                "model_name": "ASDMotion (PoseC3D)",
                "status": asdmotion_feat.status.value,
                "reason": asdmotion_feat.reason,
                "smm_detected": asdmotion_feat.smm_detected,
                "smm_confidence": asdmotion_feat.smm_confidence,
            },
            "av_asd": {
                "model_name": "AV-ASD (Audio-Visual Model)",
                "status": av_asd_feat.status.value,
                "reason": av_asd_feat.reason,
            },
        }

        # 7. Standardized Independent Video Analysis Dictionary
        video_analysis = {
            "pbr4rrb": {
                "status": pbr4ai_raw.get("status", "completed") if isinstance(pbr4ai_raw, dict) else "completed",
                "output": pbr4ai_raw.get("output") if isinstance(pbr4ai_raw, dict) and "output" in pbr4ai_raw else pbr4ai_raw,
                "error": pbr4ai_raw.get("error") if isinstance(pbr4ai_raw, dict) else None,
            },
            "asd_motion": {
                "status": asdmotion_raw.get("status", "completed") if isinstance(asdmotion_raw, dict) else "completed",
                "output": asdmotion_raw.get("output") if isinstance(asdmotion_raw, dict) and "output" in asdmotion_raw else asdmotion_raw,
                "error": asdmotion_raw.get("error") if isinstance(asdmotion_raw, dict) else None,
            },
            "av_asd": {
                "status": "not_available",
                "output": None,
                "reason": (av_asd_raw.get("reason") if isinstance(av_asd_raw, dict) else None) or "AV-ASD model weights/architecture are not currently available in the repository.",
            },
        }

        # Timing
        t_fusion = round(time.time() - t0, 4)
        pbr_timing = (pbr4ai_raw.get("output") or {}).get("timing", {}) if isinstance(pbr4ai_raw, dict) else {}
        asd_timing = (asdmotion_raw.get("output") or {}).get("timing", {}) if isinstance(asdmotion_raw, dict) else {}
        pbr_sec = float(pbr_timing.get("total_analysis_seconds", 0.0))
        asd_sec = float(asd_timing.get("total_analysis_seconds", 0.0))
        timing_dict = {
            "pbr4rrb_seconds": pbr_sec,
            "asd_motion_seconds": asd_sec,
            "av_asd_seconds": 0.0,
            "fusion_seconds": t_fusion,
            "total_seconds": round(pbr_sec + asd_sec + t_fusion, 2),
        }

        return FusionResult(
            support_indicator=support_indicator,
            confidence_score=confidence_score,
            percentage=percentage,
            summary=summary,
            recommendations=recommendations,
            disclaimer=DISCLAIMER_TEXT,
            domain_breakdown=domain_breakdown,
            models=models_summary,
            raw_model_metrics={
                "top_action": pbr4ai_feat.top_action,
                "action_probabilities": pbr4ai_feat.action_probabilities,
                "periodic_segments": pbr4ai_feat.periodic_segments,
                "peak_oscillation_power": pbr4ai_feat.peak_oscillation_power,
            },
            video_metadata={
                "width": video_metadata.width,
                "height": video_metadata.height,
                "fps": video_metadata.fps,
                "frame_count": video_metadata.frame_count,
                "duration_seconds": video_metadata.duration_seconds,
            },
            therapist_recommendations=therapist_recs,
            normalized_features={
                "rrb_intensity": norm.rrb_intensity,
                "rrb_periodicity": norm.rrb_periodicity,
                "rrb_confidence": norm.rrb_confidence,
                "smm_intensity": norm.smm_intensity,
                "smm_confidence": norm.smm_confidence,
                "questionnaire_score_ratio": norm.questionnaire_score_ratio or 0.0,
            },
            timing=timing_dict,
            video_analysis=video_analysis,
        )
