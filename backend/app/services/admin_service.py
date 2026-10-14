from typing import List
from sqlalchemy.orm import Session

from app.models.user import (
    AppointmentRecord,
    AssessmentRecord,
    ChildProfile,
    PredictionAnalysis,
    User,
)
from app.schemas.admin import AdminDashboardStats, AdminParentOut
from app.services.therapist_service import TherapistService


class AdminService:
    @staticmethod
    def get_dashboard_stats(db: Session) -> AdminDashboardStats:
        TherapistService.ensure_demo_therapists(db)

        total_users = db.query(User).count()
        total_parents = db.query(User).filter(User.role == "PARENT").count()
        total_therapists = db.query(User).filter(User.role == "THERAPIST").count()
        pending_therapists = (
            db.query(User)
            .filter(User.role == "THERAPIST", User.status == "PENDING")
            .count()
        )
        total_children = db.query(ChildProfile).count()
        total_screenings = (
            db.query(AssessmentRecord).count() + db.query(PredictionAnalysis).count()
        )
        total_appointments = db.query(AppointmentRecord).count()

        return AdminDashboardStats(
            totalUsers=total_users,
            totalParents=total_parents,
            totalTherapists=total_therapists,
            pendingTherapists=pending_therapists,
            totalChildren=total_children,
            totalScreenings=total_screenings,
            totalAppointments=total_appointments,
        )

    @staticmethod
    def list_parents(db: Session) -> List[AdminParentOut]:
        parents = db.query(User).filter(User.role == "PARENT").all()
        results: List[AdminParentOut] = []

        for p in parents:
            children = (
                db.query(ChildProfile.id)
                .filter(ChildProfile.parent_id == p.id)
                .all()
            )
            child_ids = [str(c.id) for c in children]
            joined_date = p.created_at.strftime("%Y-%m-%d") if p.created_at else "2026-01-01"

            results.append(
                AdminParentOut(
                    id=str(p.id),
                    name=p.name,
                    email=p.email,
                    phone=p.phone or "N/A",
                    address="Registered Account",
                    childrenIds=child_ids,
                    joinedDate=joined_date,
                )
            )
        return results
