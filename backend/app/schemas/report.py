from typing import List, Optional
from pydantic import BaseModel, Field


class ClinicalReportCreate(BaseModel):
    childId: str
    childName: Optional[str] = None
    therapistId: Optional[str] = None
    therapistName: Optional[str] = None
    title: str = Field(..., min_length=2)
    date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    sessionDate: Optional[str] = None
    overallProgressScore: int = Field(default=75, ge=0, le=100)
    observations: str = Field(..., min_length=5)
    progressNotes: Optional[str] = None
    recommendations: Optional[str] = None
    nextSessionPlan: Optional[str] = None
    goalsAchieved: List[str] = Field(default_factory=list)
    nextMilestones: List[str] = Field(default_factory=list)


class ClinicalReportOut(BaseModel):
    id: str
    childId: str
    childName: str
    therapistId: str
    therapistName: str
    title: str
    date: str
    sessionDate: Optional[str] = None
    overallProgressScore: int
    observations: str
    progressNotes: Optional[str] = None
    recommendations: Optional[str] = None
    nextSessionPlan: Optional[str] = None
    goalsAchieved: List[str] = Field(default_factory=list)
    nextMilestones: List[str] = Field(default_factory=list)
    createdAt: str
    disclaimer: str = (
        "CLINICAL NOTICE: Technical screening & behavioral observation report. "
        "Non-diagnostic. Not a substitute for formal clinical psychiatric evaluation."
    )

    model_config = {"from_attributes": True}


class BehaviorObservationCreate(BaseModel):
    childId: str
    date: Optional[str] = None
    behaviorCategory: Optional[str] = "Sensory"
    category: Optional[str] = None
    behaviorDescription: Optional[str] = None
    behaviorTitle: Optional[str] = None
    description: Optional[str] = None
    intensityLevel: Optional[str] = "MODERATE"
    severity: Optional[str] = None
    frequencyCount: Optional[int] = 1
    frequency: Optional[int] = None
    triggerAntecedent: Optional[str] = None
    trigger: Optional[str] = None
    managementStrategy: Optional[str] = None
    notes: Optional[str] = None


class BehaviorObservationOut(BaseModel):
    id: str
    childId: str
    therapistId: Optional[str] = None
    date: str
    behaviorCategory: str
    category: str
    behaviorDescription: str
    behaviorTitle: str
    observation: str
    intensityLevel: str
    severity: str
    frequencyCount: int
    frequency: int
    triggerAntecedent: Optional[str] = None
    trigger: Optional[str] = None
    managementStrategy: Optional[str] = None
    notes: Optional[str] = None
    createdAt: str

    model_config = {"from_attributes": True}

