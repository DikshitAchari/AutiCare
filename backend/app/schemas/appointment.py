from typing import Optional
from pydantic import BaseModel, Field


class AppointmentCreate(BaseModel):
    therapistId: str
    therapistName: Optional[str] = None
    childId: str
    childName: Optional[str] = None
    parentId: Optional[str] = None
    parentName: Optional[str] = None
    date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    time: str
    bookingSource: str = Field(default="ONLINE", pattern="^(ONLINE|OFFLINE)$")
    appointmentType: str = Field(default="ONLINE", pattern="^(ONLINE|IN_PERSON)$")
    reason: Optional[str] = None
    notes: Optional[str] = None


class AppointmentStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(BOOKED|PENDING|CANCELLED|COMPLETED)$")


class AppointmentOut(BaseModel):
    id: str
    therapistId: str
    therapistName: str
    childId: str
    childName: str
    parentId: str
    parentName: str
    date: str
    time: str
    status: str
    bookingSource: str
    appointmentType: str
    reason: Optional[str] = None
    notes: Optional[str] = None
    createdAt: str

    model_config = {"from_attributes": True}
