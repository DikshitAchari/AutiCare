from typing import Dict, List, Optional
from sqlalchemy.orm import Session

from app.models.user import (
    AssessmentRecord,
    ChildProfile,
    PredictionAnalysis,
    TherapistProfile,
    User,
)
from app.schemas.therapist import TherapistProfileOut, TherapistRecommendationOut


SPECIALIZATION_MAP = {
    "Communication": ["Speech & Language Therapy", "Speech Integration"],
    "Social Interaction": ["Child Behavior", "Developmental Therapy", "ABA Therapy"],
    "Repetitive Behaviour": ["ABA Therapy", "Child Behavior"],
    "Sensory Responses": ["Sensory Integration", "Occupational Therapy"],
    "Attention & Focus": ["Developmental Therapy", "Occupational Therapy"],
}


class RecommendationEngine:
    """
    Transparent rule-based clinical recommendation engine for connecting children with certified therapists.
    NOTE: This is NOT an AI/ML recommendation model; it uses deterministic, rule-based clinical criteria.
    """

    @staticmethod
    def recommend_for_child(
        db: Session, child_id: int
    ) -> List[TherapistRecommendationOut]:
        child = db.query(ChildProfile).filter(ChildProfile.id == child_id).first()
        if not child:
            raise ValueError("Child profile not found")

        # Gather stored clinical assessment records
        latest_assessment = (
            db.query(AssessmentRecord)
            .filter(AssessmentRecord.child_id == child_id)
            .order_by(AssessmentRecord.completed_at.desc())
            .first()
        )

        # Gather stored video behavior prediction analysis
        latest_prediction = (
            db.query(PredictionAnalysis)
            .filter(PredictionAnalysis.child_id == child_id)
            .order_by(PredictionAnalysis.created_at.desc())
            .first()
        )

        # Identify target specializations from actual data
        target_specializations = set()
        criteria_notes = []

        if latest_assessment:
            support = latest_assessment.support_indicator.upper()
            criteria_notes.append(f"Screening support indicator: {support}")
            if support in ["HIGH", "MODERATE"]:
                target_specializations.update(["ABA Therapy", "Child Behavior", "Developmental Therapy"])
            else:
                target_specializations.update(["Developmental Therapy"])

        if latest_prediction and latest_prediction.raw_output:
            behavior_analysis = latest_prediction.raw_output.get("behavior_analysis") or {}
            detected_count = behavior_analysis.get("detected_behavior_count", 0)
            if detected_count > 0:
                criteria_notes.append(f"{detected_count} repetitive movement pattern(s) identified in technical video screening")
                target_specializations.update(["Sensory Integration", "Occupational Therapy", "ABA Therapy"])

        # Fallback to general pediatric specializations if no assessments exist yet
        if not target_specializations:
            target_specializations = {"Child Behavior", "Developmental Therapy", "Occupational Therapy"}
            criteria_notes.append("Standard intake recommendation based on developmental age")

        # Query approved therapists
        therapist_users = (
            db.query(User)
            .filter(User.role == "THERAPIST", User.status == "APPROVED")
            .all()
        )

        recommendations: List[TherapistRecommendationOut] = []

        for user in therapist_users:
            profile = (
                db.query(TherapistProfile)
                .filter(TherapistProfile.user_id == user.id)
                .first()
            )
            if not profile:
                continue

            therapist_specs = set(profile.specializations or [])
            matched = therapist_specs.intersection(target_specializations)

            # Build explainable criteria
            matched_list = list(matched)
            if matched_list:
                explanation = (
                    f"Recommended based on clinical rule matching: {user.name} specializes in "
                    f"{', '.join(matched_list)}, which aligns with the child's identified support needs "
                    f"({'; '.join(criteria_notes)})."
                )
            else:
                explanation = (
                    f"Certified specialist available for pediatric developmental consultation "
                    f"with {profile.experience_years} years of clinical experience."
                )

            joined_date = user.created_at.strftime("%Y-%m-%d") if user.created_at else "2026-01-01"

            profile_out = TherapistProfileOut(
                id=str(user.id),
                email=user.email,
                name=user.name,
                role="THERAPIST",
                phone=user.phone or "",
                status=user.status or "APPROVED",
                joinedDate=joined_date,
                avatarUrl=profile.avatar_url,
                title=profile.title,
                qualification=profile.qualification,
                experienceYears=profile.experience_years,
                specializations=profile.specializations or [],
                languages=profile.languages or [],
                bio=profile.bio or "",
                rating=profile.rating,
                reviewsCount=profile.reviews_count,
                hourlyRate=profile.hourly_rate,
                location=profile.location,
                documentsVerified=profile.documents_verified,
            )

            rec = TherapistRecommendationOut(
                therapist=profile_out,
                recommendation_type="Rule-based therapist recommendation",
                method="rule_based_clinical_matching",
                is_ai_generated=False,
                matching_criteria=matched_list if matched_list else ["General Pediatric Support"],
                explanation=explanation,
            )
            recommendations.append(rec)

        # Sort recommendations: therapists with matching specializations first, then experience
        recommendations.sort(
            key=lambda r: (len(r.matching_criteria), r.therapist.experienceYears),
            reverse=True,
        )

        return recommendations
