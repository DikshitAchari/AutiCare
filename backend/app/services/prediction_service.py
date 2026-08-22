from typing import Dict, List


class PredictionService:
    @staticmethod
    def predict(answers: Dict[str, int]) -> dict:
        total_score = sum(answers.values())
        max_score = len(answers) * 3 if answers else 0
        percentage = round((total_score / max_score) * 100) if max_score else 0

        if percentage > 65:
            support_indicator = "HIGH"
            summary = "The current screening indicates a higher probability of developmental support needs based on the questionnaire responses."
            recommendations = [
                "Consult a pediatric developmental specialist and consider early intervention planning.",
                "Review sensory processing and communication support strategies with a therapist.",
                "Use structured routines and social-practice activities at home.",
            ]
            confidence_score = 87
        elif percentage > 35:
            support_indicator = "MODERATE"
            summary = "The current screening suggests moderate developmental indicators that may warrant targeted observation and professional support."
            recommendations = [
                "Monitor milestones consistently and schedule a follow-up review.",
                "Consider speech or occupational therapy consultation if concerns persist.",
                "Maintain a structured learning and play routine.",
            ]
            confidence_score = 74
        else:
            support_indicator = "LOW"
            summary = "The current screening suggests low indicators based on the provided responses; periodic monitoring remains appropriate."
            recommendations = [
                "Continue routine developmental monitoring.",
                "Encourage social interaction and play-based learning activities.",
                "Reassess in time if new concerns arise.",
            ]
            confidence_score = 68

        disclaimer = (
            "This preliminary screening result is intended for research and educational support only. "
            "It does not constitute a medical diagnosis of autism spectrum disorder."
        )

        return {
            "support_indicator": support_indicator,
            "confidence_score": confidence_score,
            "percentage": percentage,
            "summary": summary,
            "recommendations": recommendations,
            "disclaimer": disclaimer,
        }
