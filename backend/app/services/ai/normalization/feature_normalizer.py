"""
Algorithm 3: Feature Normalization Layer
========================================
Normalizes heterogeneous behavioral features into bounded [0.0, 1.0] continuous scales
for transparent multi-modal fusion.

Documented Normalization Rules:
1. RRB Intensity:
   - If subject detected and repetitive movement confirmed:
     rrb_intensity = clip(action_confidence * (1.0 + min(len(periodic_segments), 3) * 0.1), 0.0, 1.0)
   - Otherwise: 0.10 (baseline typical movement activity)
2. RRB Periodicity:
   - Scaled from peak oscillation power (threshold ~0.28 to max ~1.0):
     rrb_periodicity = clip((peak_oscillation_power - 0.20) / 0.80, 0.0, 1.0)
3. SMM Intensity (when ASDMotion enabled):
   - Scaled from smm_confidence and duration.
4. Questionnaire Score Ratio:
   - total_score / max_score (0.0 to 1.0)
"""

from typing import Optional
from app.services.ai.contracts import (
    PBR4AIFeatures,
    ASDMotionFeatures,
    NormalizedFeatures,
    ModelStatus,
)


class FeatureNormalizer:
    @staticmethod
    def normalize(
        pbr4ai: PBR4AIFeatures,
        asdmotion: Optional[ASDMotionFeatures] = None,
        questionnaire_score: Optional[int] = None,
        questionnaire_max: Optional[int] = None,
    ) -> NormalizedFeatures:
        """
        Calculates normalized continuous feature vector [0.0, 1.0] for fusion.
        """
        # 1. PBR4AI Normalization
        if not pbr4ai.subject_detected:
            rrb_intensity = 0.0
            rrb_periodicity = 0.0
            rrb_confidence = 0.0
            has_video_evidence = False
        elif pbr4ai.has_repetitive_movement:
            # Scale intensity based on action probability & recurrence count
            seg_boost = min(len(pbr4ai.periodic_segments), 3) * 0.05
            rrb_intensity = min(1.0, max(0.0, pbr4ai.action_confidence + seg_boost))
            rrb_periodicity = min(1.0, max(0.0, (pbr4ai.peak_oscillation_power - 0.20) / 0.80))
            rrb_confidence = min(1.0, max(0.0, pbr4ai.raw_confidence / 100.0))
            has_video_evidence = True
        else:
            # Normal movement baseline
            rrb_intensity = 0.12
            rrb_periodicity = min(0.25, max(0.0, pbr4ai.peak_oscillation_power))
            rrb_confidence = 0.88
            has_video_evidence = True

        # 2. ASDMotion Normalization (if available / completed)
        smm_intensity = 0.0
        smm_confidence = 0.0
        if asdmotion and asdmotion.status in (ModelStatus.AVAILABLE, ModelStatus.COMPLETED):
            smm_intensity = min(1.0, max(0.0, asdmotion.smm_confidence))
            smm_confidence = min(1.0, max(0.0, asdmotion.smm_confidence))

        # 3. Questionnaire Normalization
        q_ratio: Optional[float] = None
        if questionnaire_score is not None and questionnaire_max and questionnaire_max > 0:
            q_ratio = min(1.0, max(0.0, questionnaire_score / float(questionnaire_max)))

        return NormalizedFeatures(
            rrb_intensity=round(rrb_intensity, 4),
            rrb_periodicity=round(rrb_periodicity, 4),
            rrb_confidence=round(rrb_confidence, 4),
            smm_intensity=round(smm_intensity, 4),
            smm_confidence=round(smm_confidence, 4),
            questionnaire_score_ratio=round(q_ratio, 4) if q_ratio is not None else None,
            has_video_evidence=has_video_evidence,
        )
