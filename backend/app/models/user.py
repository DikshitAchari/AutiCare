from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.sql import func

from app.database.connection import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    name = Column(String, nullable=False)
    role = Column(String, nullable=False, default="PARENT")
    phone = Column(String, nullable=True)
    status = Column(String, nullable=True, default="ACTIVE")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    is_active = Column(Boolean, default=True)
    # Password reset fields
    otp = Column(String, nullable=True)
    otp_expires_at = Column(DateTime(timezone=True), nullable=True)
    otp_attempts = Column(Integer, default=0, nullable=False)
    reset_token = Column(String, nullable=True)
    reset_token_expires_at = Column(DateTime(timezone=True), nullable=True)


class ChildProfile(Base):
    __tablename__ = "child_profiles"

    id = Column(Integer, primary_key=True, index=True)
    parent_id = Column(Integer, nullable=False, index=True)
    name = Column(String, nullable=False)
    dob = Column(String, nullable=False)
    age = Column(Integer, nullable=False)
    gender = Column(String, nullable=False)
    school = Column(String, nullable=True)
    grade = Column(String, nullable=True)
    parent_notes = Column(String, nullable=True)
    support_indicator = Column(String, nullable=True, default="NOT_ASSESSED")
    therapy_status = Column(String, nullable=True, default="NOT_STARTED")
    assessment_status = Column(String, nullable=True, default="PENDING")
    last_assessment_date = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class AssessmentRecord(Base):
    __tablename__ = "assessment_records"

    id = Column(Integer, primary_key=True, index=True)
    child_id = Column(Integer, nullable=False, index=True)
    total_score = Column(Integer, nullable=False)
    max_score = Column(Integer, nullable=False)
    percentage = Column(Integer, nullable=False)
    support_indicator = Column(String, nullable=False)
    summary = Column(String, nullable=False)
    recommendations = Column(String, nullable=False)
    disclaimer = Column(String, nullable=False)
    completed_at = Column(DateTime(timezone=True), server_default=func.now())


class AssessmentAnswer(Base):
    __tablename__ = "assessment_answers"

    id = Column(Integer, primary_key=True, index=True)
    assessment_id = Column(Integer, nullable=False, index=True)
    question_id = Column(String, nullable=False)
    score = Column(Integer, nullable=False)


class PredictionAnalysis(Base):
    __tablename__ = "prediction_analyses"

    id = Column(Integer, primary_key=True, index=True)
    child_id = Column(Integer, ForeignKey("child_profiles.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    source = Column(String, nullable=False, default="questionnaire")
    support_indicator = Column(String, nullable=False)
    confidence_score = Column(Integer, nullable=True)
    percentage = Column(Integer, nullable=True)
    summary = Column(Text, nullable=False)
    recommendations = Column(JSON, nullable=False, default=list)
    disclaimer = Column(Text, nullable=False)
    model_name = Column(String, nullable=True)
    model_version = Column(String, nullable=True)
    raw_output = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    role = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class TherapistProfile(Base):
    __tablename__ = "therapist_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True, index=True)
    title = Column(String, nullable=False, default="Clinical Specialist")
    qualification = Column(String, nullable=False, default="Master of Clinical Psychology")
    experience_years = Column(Integer, nullable=False, default=5)
    specializations = Column(JSON, nullable=False, default=list)
    languages = Column(JSON, nullable=False, default=list)
    bio = Column(Text, nullable=False, default="")
    rating = Column(Float, nullable=False, default=4.9)
    reviews_count = Column(Integer, nullable=False, default=0)
    hourly_rate = Column(Integer, nullable=False, default=1500)
    location = Column(String, nullable=False, default="Online & In-Clinic")
    documents_verified = Column(Boolean, nullable=False, default=True)
    avatar_url = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class TherapistAvailability(Base):
    __tablename__ = "therapist_availabilities"

    id = Column(Integer, primary_key=True, index=True)
    therapist_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    day_of_week = Column(String, nullable=False)
    start_time = Column(String, nullable=False)
    end_time = Column(String, nullable=False)
    is_booked = Column(Boolean, nullable=False, default=False)
    slot_date = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class AppointmentRecord(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    therapist_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    parent_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    child_id = Column(Integer, ForeignKey("child_profiles.id"), nullable=False, index=True)
    therapist_name = Column(String, nullable=False)
    parent_name = Column(String, nullable=False)
    child_name = Column(String, nullable=False)
    date = Column(String, nullable=False)
    time = Column(String, nullable=False)
    status = Column(String, nullable=False, default="PENDING")
    booking_source = Column(String, nullable=False, default="ONLINE")
    appointment_type = Column(String, nullable=False, default="ONLINE")
    reason = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class ClinicalReportRecord(Base):
    __tablename__ = "clinical_reports"

    id = Column(Integer, primary_key=True, index=True)
    child_id = Column(Integer, ForeignKey("child_profiles.id"), nullable=False, index=True)
    therapist_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    child_name = Column(String, nullable=False)
    therapist_name = Column(String, nullable=False)
    title = Column(String, nullable=False)
    date = Column(String, nullable=False)
    session_date = Column(String, nullable=True)
    overall_progress_score = Column(Integer, nullable=False, default=75)
    observations = Column(Text, nullable=False)
    progress_notes = Column(Text, nullable=True)
    recommendations = Column(Text, nullable=True)
    next_session_plan = Column(Text, nullable=True)
    goals_achieved = Column(JSON, nullable=False, default=list)
    next_milestones = Column(JSON, nullable=False, default=list)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class DirectMessage(Base):
    __tablename__ = "direct_messages"

    id = Column(Integer, primary_key=True, index=True)
    thread_id = Column(String, nullable=False, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    recipient_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    sender_name = Column(String, nullable=False)
    sender_role = Column(String, nullable=False)
    text = Column(Text, nullable=False)
    is_read = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class BehaviorObservation(Base):
    __tablename__ = "behavior_observations"

    id = Column(Integer, primary_key=True, index=True)
    child_id = Column(Integer, ForeignKey("child_profiles.id"), nullable=False, index=True)
    therapist_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    date = Column(String, nullable=False)
    behavior_category = Column(String, nullable=False, default="Sensory")
    behavior_description = Column(String, nullable=False)
    intensity_level = Column(String, nullable=False, default="MODERATE")
    frequency_count = Column(Integer, nullable=False, default=1)
    trigger_antecedent = Column(String, nullable=True)
    management_strategy = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


