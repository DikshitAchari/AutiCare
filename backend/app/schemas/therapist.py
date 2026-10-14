from typing import List, Optional
from pydantic import BaseModel, Field


class TherapistProfileOut(BaseModel):
    id: str
    email: str
    name: str
    role: str = "THERAPIST"
    phone: str = ""
    status: str = "APPROVED"
    joinedDate: str
    avatarUrl: Optional[str] = None
    title: str
    qualification: str
    experienceYears: int
    specializations: List[str] = Field(default_factory=list)
    languages: List[str] = Field(default_factory=list)
    bio: str = ""
    rating: float = 4.9
    reviewsCount: int = 0
    hourlyRate: Optional[int] = 1500
    location: str = "Online & In-Clinic"
    documentsVerified: bool = True

    model_config = {"from_attributes": True}


class TherapistStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(APPROVED|PENDING|SUSPENDED|REJECTED)$")


class AvailabilitySlotOut(BaseModel):
    id: str
    therapistId: str
    dayOfWeek: str
    startTime: str
    endTime: str
    isBooked: bool = False

    model_config = {"from_attributes": True}


class TherapistRecommendationOut(BaseModel):
    therapist: TherapistProfileOut
    recommendation_type: str = "Rule-based therapist recommendation"
    method: str = "rule_based_clinical_matching"
    is_ai_generated: bool = False
    matching_criteria: List[str] = Field(default_factory=list)
    explanation: str
