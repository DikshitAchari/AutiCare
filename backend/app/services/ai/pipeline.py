"""
Behavioral Analysis Fusion Pipeline (Unified Orchestrator)
=========================================================
Connects all 8 core algorithms into a unified, modular execution flow:
1. Video Preprocessing
2. Behavioral Feature Extraction
3. Feature Normalization
4. Unified Multi-Model Behavior Classification (PBR4AI, ASDMotion, AV-ASD)
5. Behavioral Screening Indicator & Risk Scoring
6. Report Generation
7. Therapist Recommendation
8. Appointment & Availability Matching (integrated via downstream services)
"""

import logging
from typing import Any, Dict, Optional

from app.services.ai.preprocessing.video_preprocessor import VideoPreprocessor, VideoPreprocessingError
from app.services.ai.pbr4ai.provider import PBR4AIProvider, PBR4AIProviderError
from app.services.ai.asdmotion.provider import ASDMotionProvider
from app.services.ai.av_asd.provider import AVASDProvider
from app.services.ai.fusion.fusion_engine import BehavioralFusionEngine
from app.services.ai.report_generation.report_generator import AIReportGenerator
from app.services.ai.contracts import FusionResult

logger = logging.getLogger(__name__)


class BehavioralAnalysisPipeline:
    @classmethod
    def analyze_video(
        cls,
        video_path: str,
        questionnaire_score: Optional[int] = None,
        questionnaire_max: Optional[int] = None,
        child_info: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Executes the complete modular multi-modal behavioral analysis pipeline.
        """
        import time
        t_pipeline_start = time.time()
        logger.info(f"[PIPELINE START] Beginning multi-modal behavioral analysis for: {video_path}")

        # 1. Video Preprocessing & Validation
        t_prep0 = time.time()
        video_metadata = VideoPreprocessor.inspect_and_validate(video_path)
        t_prep = time.time() - t_prep0
        logger.info(f"[PIPELINE] Video preprocessing completed in {t_prep:.2f}s")

        # 2. Multi-Model Inference Layer
        # a) PBR4AI (ETRI AI4ASD pbr4RRB - RepDetectNet & Video Swin)
        t_pbr0 = time.time()
        pbr4ai_raw = PBR4AIProvider.analyze(video_path)
        t_pbr = time.time() - t_pbr0
        logger.info(f"[PIPELINE] PBR4RRB completed in {t_pbr:.2f}s")

        # b) ASDMotion (PoseC3D - SMM analysis)
        t_asd0 = time.time()
        asdmotion_raw = ASDMotionProvider.analyze(video_path)
        t_asd = time.time() - t_asd0
        logger.info(f"[PIPELINE] ASDMotion completed in {t_asd:.2f}s")

        # c) AV-ASD (Audio-Visual - Standby provider)
        t_av0 = time.time()
        av_asd_raw = AVASDProvider.analyze(video_path)
        t_av = time.time() - t_av0
        logger.info(f"[PIPELINE] AV-ASD status check completed in {t_av:.2f}s")

        # 3. Behavioral Feature Extraction, Normalization, Screening Scoring & Fusion
        fusion_result: FusionResult = BehavioralFusionEngine.fuse(
            video_metadata=video_metadata,
            pbr4ai_raw=pbr4ai_raw,
            asdmotion_raw=asdmotion_raw,
            av_asd_raw=av_asd_raw,
            questionnaire_score=questionnaire_score,
            questionnaire_max=questionnaire_max,
        )

        # 4. Structured Report Packaging
        child_dict = child_info or {}
        report_data = AIReportGenerator.build_report_data(
            fusion_result=fusion_result,
            child_id=child_dict.get("id"),
            child_name=child_dict.get("name"),
            child_age=child_dict.get("age"),
            child_gender=child_dict.get("gender"),
        )

        t_pipeline_total = time.time() - t_pipeline_start
        logger.info(f"[PIPELINE] total: {t_pipeline_total:.2f} sec")

        timing_data = dict(fusion_result.timing)
        timing_data["pipeline_total_seconds"] = round(t_pipeline_total, 2)
        timing_data["preprocessing_seconds"] = round(t_prep, 2)

        # 5. Build Unified Response (backward-compatible with PredictionResponse schema)
        output_payload = {
            "support_indicator": fusion_result.support_indicator,
            "confidence_score": fusion_result.confidence_score,
            "percentage": fusion_result.percentage,
            "summary": fusion_result.summary,
            "recommendations": fusion_result.recommendations,
            "disclaimer": fusion_result.disclaimer,
            "domain_breakdown": fusion_result.domain_breakdown,
            "models": fusion_result.models,
            "raw_model_metrics": fusion_result.raw_model_metrics,
            "video_metadata": fusion_result.video_metadata,
            "therapist_recommendations": fusion_result.therapist_recommendations,
            "normalized_features": fusion_result.normalized_features,
            "video_analysis": fusion_result.video_analysis,
            "timing": timing_data,
            "report_data": report_data,
        }

        logger.info(
            f"[PIPELINE COMPLETE] Indicator={fusion_result.percentage}%, Support={fusion_result.support_indicator}, TotalTime={t_pipeline_total:.2f}s"
        )
        return output_payload
