from datetime import datetime, timezone
from typing import Dict, List

from sqlalchemy.orm import Session

from app.models.user import AssessmentAnswer, AssessmentRecord, ChildProfile

DISCLAIMER_TEXT = (
    "CLINICAL NOTICE & MEDICAL DISCLAIMER: This assessment is an automated AI-assisted developmental "
    "screening tool designed for early risk indicator identification. It DOES NOT constitute a formal "
    "medical, neurological, or psychiatric diagnosis of Autism Spectrum Disorder (ASD). Please consult "
    "a certified pediatric neurologist, developmental pediatrician, or clinical psychologist for formal evaluation."
)

QUESTION_DOMAINS = {
    "Q1": "Social Interaction",
    "Q2": "Social Interaction",
    "Q3": "Communication",
    "Q4": "Communication",
    "Q5": "Repetitive Behaviour",
    "Q6": "Repetitive Behaviour",
    "Q7": "Sensory Responses",
    "Q8": "Attention & Focus",
}


class AssessmentService:
    @staticmethod
    def calculate_result(answers: Dict[str, int]) -> dict:
        total_score = sum(answers.get(question_id, 0) for question_id in sorted(answers.keys()))
        max_score = len(answers) * 3 if answers else 0
        percentage = round((total_score / max_score) * 100) if max_score else 0

        if percentage > 65:
            support_indicator = "HIGH"
            summary = "The screening responses highlight elevated indicators in social reciprocity and communication domains. Substantial clinical support is recommended."
            recommendations = [
                "Urgent recommendation: Consult with a certified Pediatric Neurologist or Developmental Specialist.",
                "Consider comprehensive ABA (Applied Behavior Analysis) evaluation and Speech Therapy assessment.",
                "Request early intervention therapy services with your local developmental healthcare team.",
            ]
        elif percentage > 35:
            support_indicator = "MODERATE"
            summary = "The screening responses show moderate developmental variation across social and behavioral categories. Moderate support and targeted therapy may be beneficial."
            recommendations = [
                "Consult with an Occupational Therapist for sensory integration evaluation.",
                "Schedule a clinical consultation with a certified Speech & Language Therapist.",
                "Re-evaluate screening indicators in 3 months.",
            ]
        else:
            support_indicator = "LOW"
            summary = "The screening responses indicate low indicators for developmental autism spectrum traits. Routine developmental monitoring is recommended."
            recommendations = [
                "Continue standard developmental milestones tracking.",
                "Promote interactive peer play and structured storytelling.",
                "Schedule routine annual pediatric checkups.",
            ]

        domain_scores = []
        domain_totals = {
            "Social Interaction": {"score": 0, "count": 0},
            "Communication": {"score": 0, "count": 0},
            "Repetitive Behaviour": {"score": 0, "count": 0},
            "Sensory Responses": {"score": 0, "count": 0},
            "Attention & Focus": {"score": 0, "count": 0},
        }

        for question_id, score in answers.items():
            category = QUESTION_DOMAINS.get(question_id, "General")
            if category in domain_totals:
                domain_totals[category]["score"] += score
                domain_totals[category]["count"] += 1

        for category, values in domain_totals.items():
            count = values["count"]
            category_max = count * 3
            category_percentage = round((values["score"] / category_max) * 100) if category_max else 0
            domain_scores.append({
                "category": category,
                "category_name": category,
                "obtained_score": values["score"],
                "max_score": category_max,
                "percentage": category_percentage,
            })

        return {
            "total_score": total_score,
            "max_score": max_score,
            "percentage": percentage,
            "support_indicator": support_indicator,
            "summary": summary,
            "recommendations": recommendations,
            "disclaimer": DISCLAIMER_TEXT,
            "domain_scores": domain_scores,
        }

    @staticmethod
    def submit_assessment(db: Session, child_id: int, answers: Dict[str, int]) -> AssessmentRecord:
        child = db.query(ChildProfile).filter(ChildProfile.id == child_id).first()
        if not child:
            raise ValueError("Child profile not found")

        result = AssessmentService.calculate_result(answers)

        record = AssessmentRecord(
            child_id=child_id,
            total_score=result["total_score"],
            max_score=result["max_score"],
            percentage=result["percentage"],
            support_indicator=result["support_indicator"],
            summary=result["summary"],
            recommendations="|".join(result["recommendations"]),
            disclaimer=result["disclaimer"],
            completed_at=datetime.now(timezone.utc),
        )
        db.add(record)
        db.commit()
        db.refresh(record)

        for question_id, score in answers.items():
            answer = AssessmentAnswer(
                assessment_id=record.id,
                question_id=question_id,
                score=score,
            )
            db.add(answer)

        child.support_indicator = result["support_indicator"]
        child.assessment_status = "COMPLETED"
        child.last_assessment_date = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        db.commit()

        return record
