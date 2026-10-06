"""
Algorithm 7: Therapist Recommendation Engine
============================================
Recommends verified clinical specialists based on observed behavioral markers,
domain indicators, and clinical specializations.
"""

from typing import Any, Dict, List
from app.services.ai.contracts import TherapistRecommendation


class TherapistRecommendationEngine:
    SPECIALIZATION_MAPPING = {
        "ArmFlapping": [
            {
                "specialization": "Occupational Therapy",
                "rationale": "Specializes in sensory regulation, motor planning, and motor modulation for repetitive arm or hand movements.",
                "suggested_focus": ["Sensory Integration", "Motor Modulation", "Fine Motor Coordination"],
                "priority": "HIGH_PRIORITY",
            },
            {
                "specialization": "Sensory Integration",
                "rationale": "Evaluates sensory processing sensitivity and vestibular/proprioceptive inputs triggering repetitive gestures.",
                "suggested_focus": ["Sensory Processing Profile", "Proprioceptive Activities"],
                "priority": "RECOMMENDED",
            },
            {
                "specialization": "ABA Therapy",
                "rationale": "Provides individualized positive behavioral support and functional skill building.",
                "suggested_focus": ["Behavioral Support Plan", "Functional Communication"],
                "priority": "RECOMMENDED",
            }
        ],
        "Spinning": [
            {
                "specialization": "Occupational Therapy",
                "rationale": "Focuses on vestibular processing and equilibrium balance regulation for whole-body spinning patterns.",
                "suggested_focus": ["Vestibular Input Balancing", "Safe Sensory Outlets"],
                "priority": "HIGH_PRIORITY",
            },
            {
                "specialization": "Sensory Integration",
                "rationale": "Addresses vestibular seeking behaviors through structured sensory diet activities.",
                "suggested_focus": ["Vestibular Sensory Diet", "Body Awareness Exercises"],
                "priority": "RECOMMENDED",
            }
        ],
        "HeadBanging": [
            {
                "specialization": "Occupational Therapy",
                "rationale": "Urgent evaluation for sensory regulation and physical environment safety adaptations.",
                "suggested_focus": ["Protective Sensory Strategies", "Deep Pressure Therapy"],
                "priority": "URGENT",
            },
            {
                "specialization": "ABA Therapy",
                "rationale": "Immediate functional behavioral assessment to identify and mitigate underlying distress triggers.",
                "suggested_focus": ["Functional Behavior Assessment", "Replacement Behaviors"],
                "priority": "URGENT",
            }
        ]
    }

    @classmethod
    def generate_recommendations(
        cls,
        top_action: str,
        has_repetitive_movement: bool,
        support_indicator: str,
    ) -> List[Dict[str, Any]]:
        """
        Produces prioritized therapist specialization recommendations.
        """
        recs: List[Dict[str, Any]] = []

        if has_repetitive_movement and top_action in cls.SPECIALIZATION_MAPPING:
            recs.extend(cls.SPECIALIZATION_MAPPING[top_action])
        elif support_indicator in ["HIGH", "MODERATE"]:
            recs.append({
                "specialization": "Occupational Therapy",
                "rationale": "Recommended for comprehensive sensory and motor milestone evaluation.",
                "suggested_focus": ["Sensory Evaluation", "Motor Skill Development"],
                "priority": "RECOMMENDED",
            })
            recs.append({
                "specialization": "Speech & Language Therapy",
                "rationale": "Recommended to support functional non-verbal and verbal communication development.",
                "suggested_focus": ["Social Communication", "Expressive Language"],
                "priority": "RECOMMENDED",
            })
        else:
            recs.append({
                "specialization": "Occupational Therapy",
                "rationale": "Routine developmental tracking and wellness support.",
                "suggested_focus": ["Milestone Tracking", "Play-based Development"],
                "priority": "ROUTINE",
            })

        return recs
