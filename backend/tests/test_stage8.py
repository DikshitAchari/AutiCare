import pytest
from unittest.mock import MagicMock
from app.models.user import AppointmentRecord, ChildProfile, User
from app.schemas.appointment import AppointmentCreate
from app.services.appointment_service import AppointmentService
from app.services.recommendation_engine import RecommendationEngine
from app.services.report_service import ReportService
from app.services.message_service import MessageService
from app.routes.admin import require_admin
from fastapi import HTTPException


def test_rule_based_recommendation_contract():
    """Verify recommendation engine is transparently rule-based and non-AI."""
    db = MagicMock()
    child = ChildProfile(id=1, name="Aarav", support_indicator="HIGH")
    db.query.return_value.filter.return_value.first.return_value = child
    db.query.return_value.filter.return_value.order_by.return_value.first.return_value = None
    db.query.return_value.filter.return_value.all.return_value = []

    results = RecommendationEngine.recommend_for_child(db, 1)
    assert isinstance(results, list)
    for r in results:
        assert r.is_ai_generated is False
        assert r.recommendation_type == "Rule-based therapist recommendation"
        assert r.method == "rule_based_clinical_matching"


def test_appointment_double_booking_prevention():
    """Verify that booking an already reserved slot raises ValueError."""
    db = MagicMock()
    child = ChildProfile(id=1, parent_id=10, name="Aarav")
    parent = User(id=10, name="Parent User", role="PARENT")
    therapist = User(id=5, name="Dr. Priya", role="THERAPIST", status="APPROVED")
    existing_apt = AppointmentRecord(
        id=101, therapist_id=5, date="2026-10-20", time="10:00 AM", status="BOOKED", booking_source="ONLINE"
    )

    # Query 1: child
    # Query 2: parent
    # Query 3: therapist
    # Query 4: existing appointment
    mock_query = MagicMock()
    mock_query.filter.side_effect = [
        MagicMock(first=MagicMock(return_value=child)),
        MagicMock(first=MagicMock(return_value=parent)),
        MagicMock(first=MagicMock(return_value=therapist)),
        MagicMock(first=MagicMock(return_value=existing_apt)),
    ]
    db.query.return_value = mock_query

    payload = AppointmentCreate(
        therapistId="5",
        childId="1",
        date="2026-10-20",
        time="10:00 AM",
        bookingSource="ONLINE",
        appointmentType="ONLINE",
    )

    with pytest.raises(ValueError, match="already booked"):
        AppointmentService.book_appointment(db, payload, current_user_id=10, current_user_role="PARENT")


def test_appointment_parent_ownership_enforcement():
    """Verify parent cannot book an appointment for another parent's child."""
    db = MagicMock()
    child = ChildProfile(id=2, parent_id=99, name="Other Child")
    mock_query = MagicMock()
    mock_query.filter.return_value.first.return_value = child
    db.query.return_value = mock_query

    payload = AppointmentCreate(
        therapistId="5",
        childId="2",
        date="2026-10-20",
        time="10:00 AM",
        bookingSource="ONLINE",
        appointmentType="ONLINE",
    )

    with pytest.raises(PermissionError, match="own children"):
        AppointmentService.book_appointment(db, payload, current_user_id=10, current_user_role="PARENT")


def test_report_clinical_notice_disclaimer():
    """Verify reports include non-diagnostic disclaimer and do not fabricate diagnoses."""
    db = MagicMock()
    mock_record = MagicMock()
    mock_record.id = 1
    mock_record.child_id = 1
    mock_record.therapist_id = 5
    mock_record.child_name = "Aarav"
    mock_record.therapist_name = "Dr. Priya"
    mock_record.title = "Milestone Report"
    mock_record.date = "2026-10-14"
    mock_record.session_date = "2026-10-14"
    mock_record.overall_progress_score = 75
    mock_record.observations = "Observed motor coordination"
    mock_record.progress_notes = "Progressing well"
    mock_record.recommendations = "Routine follow-up"
    mock_record.next_session_plan = "Session plan"
    mock_record.goals_achieved = ["Eye contact"]
    mock_record.next_milestones = ["Turn-taking"]
    mock_record.created_at = None

    report_out = ReportService.to_report_out(mock_record)
    assert "CLINICAL NOTICE" in report_out.disclaimer
    assert "Non-diagnostic" in report_out.disclaimer


def test_message_authorization_prevents_unauthorized_access():
    """Verify a user who is not a participant in a conversation thread cannot read it."""
    db = MagicMock()
    msg = MagicMock(sender_id=1, recipient_id=2)
    db.query.return_value.filter.return_value.order_by.return_value.all.return_value = [msg]

    with pytest.raises(PermissionError, match="Unauthorized"):
        MessageService.list_messages(db, "thread_1_2", current_user_id=999)


def test_admin_route_guard_rejects_non_admin():
    """Verify admin routes reject non-admin users with HTTP 403."""
    with pytest.raises(HTTPException) as excinfo:
        require_admin({"sub": "1", "role": "PARENT"})
    assert excinfo.value.status_code == 403

    with pytest.raises(HTTPException) as excinfo2:
        require_admin({"sub": "2", "role": "THERAPIST"})
    assert excinfo2.value.status_code == 403

    # Admin passes
    result = require_admin({"sub": "3", "role": "ADMIN"})
    assert result["role"] == "ADMIN"
