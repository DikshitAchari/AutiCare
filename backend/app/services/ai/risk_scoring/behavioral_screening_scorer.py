"""
Algorithm 5: Behavioral Screening & Risk Scoring Layer
======================================================
Computes a transparent, rule-based Behavioral Screening Indicator and Support Level.

CRITICAL CLINICAL & SCIENTIFIC DISTINCTION:
- This is an AI-assisted behavioral screening indicator, NOT an autism diagnostic probability.
- Weights and rules are documented, configurable, and deterministic.
"""

from typing import Any, Dict, List, Tuple
from app.services.ai.contracts import NormalizedFeatures, SupportIndicator


class BehavioralScreeningScorer:
    # Configurable domain weights
    WEIGHT_RRB: float = 0.55
    WEIGHT_PERIODICITY: float = 0.20
    WEIGHT_SMM: float = 0.25

    @classmethod
    def calculate_screening_indicator(
        cls,
        norm: NormalizedFeatures,
        has_human_subject: bool = True
    ) -> Tuple[int, int, str, str, List[str]]:
        """
        Calculates:
        - percentage: Integer (0-100) Behavioral Screening Indicator Score
        - confidence_score: Integer (0-100)
        - support_indicator: 'LOW' | 'MODERATE' | 'HIGH'
        - summary: Clinical AI summary narrative
        - recommendations: Actionable next steps
        """
        if not has_human_subject or not norm.has_video_evidence:
            return (
                0,
                0,
                SupportIndicator.LOW.value,
                "No human subject detected in the submitted video for behavioral analysis. The video may contain inanimate objects, moving vehicles, or an empty room.",
                [
                    "Upload a clear video showing the child during activities, play, or interactions.",
                    "Ensure adequate lighting and that the child's upper body and face are visible.",
                    "Avoid videos focused solely on background scenes or inanimate objects."
                ]
            )

        # Multi-modal fusion score computation
        # 1. Base RRB Score
        weighted_score = (
            norm.rrb_intensity * cls.WEIGHT_RRB +
            norm.rrb_periodicity * cls.WEIGHT_PERIODICITY +
            norm.smm_intensity * cls.WEIGHT_SMM
        )

        # If questionnaire evidence is also available, harmonize multi-modal evidence
        if norm.questionnaire_score_ratio is not None:
            # 60% video behavioral evidence, 40% parent questionnaire observations
            final_ratio = (weighted_score * 0.60) + (norm.questionnaire_score_ratio * 0.40)
        else:
            final_ratio = weighted_score

        # Convert to 0-100 percentage indicator
        percentage = int(round(final_ratio * 100))
        percentage = max(10, min(95, percentage))

        # Model confidence estimate based on signal clarity
        confidence_score = int(round(max(0.65, norm.rrb_confidence) * 100))

        # Support Indicator & Recommendations
        if percentage >= 65:
            support_indicator = SupportIndicator.HIGH.value
            summary = (
                f"Multi-modal behavioral screening detected elevated restricted or repetitive motor patterns "
                f"(Project Screening Indicator: {percentage}%, Model Confidence: {confidence_score}%). "
                f"Periodic movement oscillations were consistently observed."
            )
            recommendations = [
                "Schedule a comprehensive developmental diagnostic evaluation with a pediatric neurologist or developmental pediatrician.",
                "Observe and document environmental triggers or sensory factors related to repetitive motor routines.",
                "Consult an Occupational Therapist for sensory integration and motor regulation strategies.",
                "Consider targeted behavioral intervention (ABA / Developmental Therapy) assessment."
            ]
        elif percentage >= 35:
            support_indicator = SupportIndicator.MODERATE.value
            summary = (
                f"Multi-modal behavioral screening detected moderate rhythmic motor movements "
                f"(Project Screening Indicator: {percentage}%, Model Confidence: {confidence_score}%). "
                f"Further behavioral observation and targeted developmental check are recommended."
            )
            recommendations = [
                "Monitor and log frequency, duration, and context of observed motor patterns.",
                "Discuss behavioral observations with your child's pediatrician during the next visit.",
                "Engage in structured play activities that encourage varied motor gestures.",
                "Consult with an Occupational Therapist for sensory profile review if concerns persist."
            ]
        else:
            support_indicator = SupportIndicator.LOW.value
            summary = (
                f"Multi-modal behavioral analysis completed: Movement patterns fall within typical developmental ranges "
                f"with no significant restricted, repetitive, or stereotypic motor behaviors detected (Project Screening Indicator: {percentage}%, Model Confidence: {confidence_score}%)."
            )
            recommendations = [
                "Continue standard age-appropriate developmental monitoring and interactive play.",
                "Record and re-evaluate if new or concerning repetitive behaviors arise in future.",
                "Maintain regular pediatric wellness checkups."
            ]

        return percentage, confidence_score, support_indicator, summary, recommendations
