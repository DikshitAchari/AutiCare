from sqlalchemy import Boolean, Column, DateTime, Integer, String
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
