from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy.orm import Session

from app.models.user import (
    AssessmentRecord,
    BehaviorObservation,
    ChildProfile,
    ClinicalReportRecord,
    PredictionAnalysis,
    User,
)
from app.schemas.report import (
    BehaviorObservationCreate,
    BehaviorObservationOut,
    ClinicalReportCreate,
    ClinicalReportOut,
)


class ReportService:
    @staticmethod
    def to_report_out(record: ClinicalReportRecord) -> ClinicalReportOut:
        created_at_iso = (
            record.created_at.isoformat()
            if record.created_at
            else datetime.now(timezone.utc).isoformat()
        )
        return ClinicalReportOut(
            id=str(record.id),
            childId=str(record.child_id),
            childName=record.child_name,
            therapistId=str(record.therapist_id),
            therapistName=record.therapist_name,
            title=record.title,
            date=record.date,
            sessionDate=record.session_date,
            overallProgressScore=record.overall_progress_score,
            observations=record.observations,
            progressNotes=record.progress_notes,
            recommendations=record.recommendations,
            nextSessionPlan=record.next_session_plan,
            goalsAchieved=record.goals_achieved or [],
            nextMilestones=record.next_milestones or [],
            createdAt=created_at_iso,
        )

    @staticmethod
    def create_report(
        db: Session,
        payload: ClinicalReportCreate,
        current_user_id: int,
        current_user_role: str,
    ) -> ClinicalReportOut:
        if current_user_role not in ["THERAPIST", "ADMIN"]:
            raise PermissionError("Only certified clinicians or administrators may create clinical reports.")

        child_id = int(payload.childId)
        child = db.query(ChildProfile).filter(ChildProfile.id == child_id).first()
        if not child:
            raise ValueError("Child profile not found")

        # Get therapist details
        therapist_id = current_user_id
        if payload.therapistId and current_user_role == "ADMIN":
            therapist_id = int(payload.therapistId)

        therapist_user = db.query(User).filter(User.id == therapist_id).first()
        therapist_name = (
            therapist_user.name
            if therapist_user
            else payload.therapistName or "Clinical Specialist"
        )

        # Pull actual stored screening data to inform report if progress notes/recommendations were omitted
        recommendations = payload.recommendations
        if not recommendations:
            latest_assessment = (
                db.query(AssessmentRecord)
                .filter(AssessmentRecord.child_id == child_id)
                .order_by(AssessmentRecord.completed_at.desc())
                .first()
            )
            if latest_assessment and latest_assessment.recommendations:
                recommendations = latest_assessment.recommendations.replace("|", "\n• ")

        record = ClinicalReportRecord(
            child_id=child_id,
            therapist_id=therapist_id,
            child_name=child.name,
            therapist_name=therapist_name,
            title=payload.title,
            date=payload.date,
            session_date=payload.sessionDate or payload.date,
            overall_progress_score=payload.overallProgressScore,
            observations=payload.observations,
            progress_notes=payload.progressNotes,
            recommendations=recommendations,
            next_session_plan=payload.nextSessionPlan,
            goals_achieved=payload.goalsAchieved,
            next_milestones=payload.nextMilestones,
            created_at=datetime.now(timezone.utc),
        )
        db.add(record)
        db.commit()
        db.refresh(record)

        return ReportService.to_report_out(record)

    @staticmethod
    def list_reports(
        db: Session,
        current_user_id: int,
        current_user_role: str,
        child_id: Optional[int] = None,
    ) -> List[ClinicalReportOut]:
        query = db.query(ClinicalReportRecord)

        if child_id:
            query = query.filter(ClinicalReportRecord.child_id == child_id)

        if current_user_role == "PARENT":
            # Parents only see reports for their children
            parent_child_ids = [
                c.id
                for c in db.query(ChildProfile.id)
                .filter(ChildProfile.parent_id == current_user_id)
                .all()
            ]
            if not parent_child_ids:
                return []
            query = query.filter(ClinicalReportRecord.child_id.in_(parent_child_ids))
        elif current_user_role == "THERAPIST":
            # Therapists see reports they authored
            query = query.filter(ClinicalReportRecord.therapist_id == current_user_id)
        elif current_user_role == "ADMIN":
            pass  # Admin sees all reports

        records = query.order_by(ClinicalReportRecord.created_at.desc()).all()
        return [ReportService.to_report_out(r) for r in records]

    @staticmethod
    def get_report_by_id(
        db: Session,
        report_id: int,
        current_user_id: int,
        current_user_role: str,
    ) -> ClinicalReportOut:
        record = (
            db.query(ClinicalReportRecord)
            .filter(ClinicalReportRecord.id == report_id)
            .first()
        )
        if not record:
            raise ValueError("Clinical report not found")

        # Authorization check
        if current_user_role == "PARENT":
            child = (
                db.query(ChildProfile)
                .filter(ChildProfile.id == record.child_id)
                .first()
            )
            if not child or child.parent_id != current_user_id:
                raise PermissionError("Unauthorized to view this clinical report.")
        elif current_user_role == "THERAPIST":
            if record.therapist_id != current_user_id:
                raise PermissionError("Unauthorized to view this clinical report.")

        return ReportService.to_report_out(record)

    @staticmethod
    def to_observation_out(obs: BehaviorObservation) -> BehaviorObservationOut:
        created_at_iso = (
            obs.created_at.isoformat()
            if obs.created_at
            else datetime.now(timezone.utc).isoformat()
        )
        return BehaviorObservationOut(
            id=str(obs.id),
            childId=str(obs.child_id),
            therapistId=str(obs.therapist_id) if obs.therapist_id else None,
            date=obs.date,
            behaviorCategory=obs.behavior_category,
            category=obs.behavior_category,
            behaviorDescription=obs.behavior_description,
            behaviorTitle=obs.behavior_description,
            observation=obs.behavior_description,
            intensityLevel=obs.intensity_level,
            severity=obs.intensity_level,
            frequencyCount=obs.frequency_count,
            frequency=obs.frequency_count,
            triggerAntecedent=obs.trigger_antecedent,
            trigger=obs.trigger_antecedent,
            managementStrategy=obs.management_strategy,
            notes=obs.management_strategy,
            createdAt=created_at_iso,
        )

    @staticmethod
    def create_behavior_observation(
        db: Session,
        payload: BehaviorObservationCreate,
        current_user_id: int,
        current_user_role: str,
    ) -> BehaviorObservationOut:
        child_id = int(payload.childId)
        child = db.query(ChildProfile).filter(ChildProfile.id == child_id).first()
        if not child:
            raise ValueError("Child profile not found")

        desc = (
            payload.behaviorDescription
            or payload.behaviorTitle
            or payload.description
            or "Observed behavior"
        )
        cat = payload.behaviorCategory or payload.category or "Sensory"
        intensity = payload.intensityLevel or payload.severity or "MODERATE"
        freq = payload.frequencyCount or payload.frequency or 1
        trigger = payload.triggerAntecedent or payload.trigger
        strategy = payload.managementStrategy or payload.notes
        date_str = payload.date or datetime.now(timezone.utc).strftime("%Y-%m-%d")

        obs = BehaviorObservation(
            child_id=child_id,
            therapist_id=current_user_id if current_user_role == "THERAPIST" else None,
            date=date_str,
            behavior_category=cat,
            behavior_description=desc,
            intensity_level=intensity,
            frequency_count=freq,
            trigger_antecedent=trigger,
            management_strategy=strategy,
            created_at=datetime.now(timezone.utc),
        )
        db.add(obs)
        db.commit()
        db.refresh(obs)
        return ReportService.to_observation_out(obs)

    @staticmethod
    def list_behavior_observations(
        db: Session,
        child_id: int,
    ) -> List[BehaviorObservationOut]:
        records = (
            db.query(BehaviorObservation)
            .filter(BehaviorObservation.child_id == child_id)
            .order_by(BehaviorObservation.created_at.desc())
            .all()
        )
        return [ReportService.to_observation_out(o) for o in records]

