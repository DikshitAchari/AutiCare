from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy.orm import Session

from app.models.user import AppointmentRecord, ChildProfile, User
from app.schemas.appointment import AppointmentCreate, AppointmentOut


class AppointmentService:
    @staticmethod
    def to_appointment_out(record: AppointmentRecord) -> AppointmentOut:
        created_at_iso = (
            record.created_at.isoformat()
            if record.created_at
            else datetime.now(timezone.utc).isoformat()
        )
        return AppointmentOut(
            id=str(record.id),
            therapistId=str(record.therapist_id),
            therapistName=record.therapist_name,
            childId=str(record.child_id),
            childName=record.child_name,
            parentId=str(record.parent_id),
            parentName=record.parent_name,
            date=record.date,
            time=record.time,
            status=record.status,
            bookingSource=record.booking_source,
            appointmentType=record.appointment_type,
            reason=record.reason,
            notes=record.notes,
            createdAt=created_at_iso,
        )

    @staticmethod
    def book_appointment(
        db: Session,
        payload: AppointmentCreate,
        current_user_id: int,
        current_user_role: str,
    ) -> AppointmentOut:
        therapist_id = int(payload.therapistId)
        child_id = int(payload.childId)

        # 1. Verify child exists and check ownership if caller is PARENT
        child = db.query(ChildProfile).filter(ChildProfile.id == child_id).first()
        if not child:
            raise ValueError("Child profile not found")

        if current_user_role == "PARENT" and child.parent_id != current_user_id:
            raise PermissionError("You can only book appointments for your own children.")

        parent_id = child.parent_id
        parent_user = db.query(User).filter(User.id == parent_id).first()
        parent_name = parent_user.name if parent_user else payload.parentName or "Parent"

        # 2. Verify therapist exists and is active/approved
        therapist_user = (
            db.query(User)
            .filter(User.id == therapist_id, User.role == "THERAPIST")
            .first()
        )
        if not therapist_user:
            raise ValueError("Therapist not found")

        if therapist_user.status not in ["APPROVED", "ACTIVE"]:
            raise ValueError("Selected therapist is not currently approved for bookings.")

        # 3. Double-booking prevention
        existing = (
            db.query(AppointmentRecord)
            .filter(
                AppointmentRecord.therapist_id == therapist_id,
                AppointmentRecord.date == payload.date,
                AppointmentRecord.time == payload.time,
                AppointmentRecord.status != "CANCELLED",
            )
            .first()
        )

        if existing:
            if existing.booking_source == "OFFLINE":
                raise ValueError(
                    "This slot has been locked for an offline clinic session by the therapist and is not available for online booking."
                )
            raise ValueError("This therapist is already booked for the selected date and time slot.")

        # Initial status
        initial_status = "BOOKED" if payload.bookingSource == "OFFLINE" else "PENDING"

        record = AppointmentRecord(
            therapist_id=therapist_id,
            parent_id=parent_id,
            child_id=child_id,
            therapist_name=therapist_user.name,
            parent_name=parent_name,
            child_name=child.name,
            date=payload.date,
            time=payload.time,
            status=initial_status,
            booking_source=payload.bookingSource,
            appointment_type=payload.appointmentType,
            reason=payload.reason,
            notes=payload.notes,
            created_at=datetime.now(timezone.utc),
        )
        db.add(record)
        db.commit()
        db.refresh(record)

        return AppointmentService.to_appointment_out(record)

    @staticmethod
    def list_appointments(
        db: Session,
        current_user_id: int,
        current_user_role: str,
    ) -> List[AppointmentOut]:
        query = db.query(AppointmentRecord)

        if current_user_role == "PARENT":
            query = query.filter(AppointmentRecord.parent_id == current_user_id)
        elif current_user_role == "THERAPIST":
            query = query.filter(AppointmentRecord.therapist_id == current_user_id)
        elif current_user_role == "ADMIN":
            pass  # Admin sees all
        else:
            return []

        records = query.order_by(AppointmentRecord.created_at.desc()).all()
        return [AppointmentService.to_appointment_out(r) for r in records]

    @staticmethod
    def update_status(
        db: Session,
        appointment_id: int,
        new_status: str,
        current_user_id: int,
        current_user_role: str,
    ) -> AppointmentOut:
        record = db.query(AppointmentRecord).filter(AppointmentRecord.id == appointment_id).first()
        if not record:
            raise ValueError("Appointment not found")

        # Authorization: Therapist of this appointment or Admin or Parent (if cancelling)
        if current_user_role == "PARENT":
            if record.parent_id != current_user_id:
                raise PermissionError("Unauthorized to update this appointment.")
            if new_status != "CANCELLED":
                raise PermissionError("Parents may only cancel their appointments.")
        elif current_user_role == "THERAPIST":
            if record.therapist_id != current_user_id:
                raise PermissionError("Unauthorized to update this appointment.")
        elif current_user_role != "ADMIN":
            raise PermissionError("Unauthorized to update appointments.")

        record.status = new_status
        db.commit()
        db.refresh(record)

        return AppointmentService.to_appointment_out(record)

    @staticmethod
    def cancel_appointment(
        db: Session,
        appointment_id: int,
        current_user_id: int,
        current_user_role: str,
    ) -> AppointmentOut:
        return AppointmentService.update_status(
            db, appointment_id, "CANCELLED", current_user_id, current_user_role
        )
