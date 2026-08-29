from typing import Any, Dict, List, Optional

from pydantic import BaseModel, EmailStr, Field, field_validator


class ChildCreate(BaseModel):
    name: str = Field(..., min_length=1)
    dob: str
    gender: str = Field(default="Male")
    school: Optional[str] = None
    grade: Optional[str] = None
    parent_notes: Optional[str] = None

    @field_validator("name")
    @classmethod
    def validate_name(cls, value):
        if not value or not value.strip():
            raise ValueError("Child name is required")
        return value.strip()

    @field_validator("dob")
    @classmethod
    def validate_dob(cls, value):
        if not value:
            raise ValueError("Date of birth is required")
        return value


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    name: str = Field(..., min_length=2)
    role: str = Field(default="PARENT")
    phone: Optional[str] = None
    child: Optional[ChildCreate] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    role: Optional[str] = None


class UserOut(BaseModel):
    id: int
    email: str
    name: str
    role: str
    phone: Optional[str] = None
    status: Optional[str] = "ACTIVE"

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class ChildOut(BaseModel):
    id: int
    parent_id: int
    name: str
    dob: str
    age: int
    gender: str
    school: Optional[str] = None
    grade: Optional[str] = None
    parent_notes: Optional[str] = None
    support_indicator: Optional[str] = "NOT_ASSESSED"
    therapy_status: Optional[str] = "NOT_STARTED"
    assessment_status: Optional[str] = "PENDING"
    last_assessment_date: Optional[str] = None

    model_config = {"from_attributes": True}


class AssessmentAnswerInput(BaseModel):
    question_id: str
    score: int = Field(..., ge=0, le=3)


class AssessmentSubmit(BaseModel):
    child_id: int
    answers: Dict[str, int] = Field(...)

    @field_validator("answers")
    @classmethod
    def validate_answers(cls, value):
        if not value:
            raise ValueError("Answers cannot be empty")
        for key, score in value.items():
            if not isinstance(score, int) or score < 0 or score > 3:
                raise ValueError(f"Invalid score for question {key}: must be an integer between 0 and 3")
        return value


class DomainScore(BaseModel):
    category: str
    category_name: Optional[str] = None
    obtained_score: Optional[int] = 0
    max_score: Optional[int] = 0
    percentage: Optional[int] = 0


class AssessmentResultOut(BaseModel):
    id: int
    child_id: int
    total_score: int
    max_score: int
    percentage: int
    support_indicator: str
    summary: str
    recommendations: List[str]
    disclaimer: str
    completed_at: Optional[str] = None
    domain_scores: List[DomainScore] = []


class PredictionRequest(BaseModel):
    child_id: int
    answers: Dict[str, int] = Field(...)


class PredictionResponse(BaseModel):
    id: Optional[int] = None
    child_id: int
    support_indicator: str
    confidence_score: int
    percentage: int
    summary: str
    recommendations: List[str]
    disclaimer: str
    source: str = "questionnaire"
    domain_breakdown: Optional[Dict[str, Any]] = None
    created_at: Optional[str] = None


class PredictionHistoryItem(PredictionResponse):
    pass


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)


class ChatResponse(BaseModel):
    response: str
    disclaimer: str


class ChatMessageOut(BaseModel):
    id: int
    role: str
    message: str
    created_at: Optional[str] = None

    model_config = {"from_attributes": True}
