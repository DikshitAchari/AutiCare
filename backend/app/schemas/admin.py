from typing import List, Optional
from pydantic import BaseModel, Field


class AdminDashboardStats(BaseModel):
    totalUsers: int
    totalParents: int
    totalTherapists: int
    pendingTherapists: int
    totalChildren: int
    totalScreenings: int
    totalAppointments: int


class AdminParentOut(BaseModel):
    id: str
    name: str
    email: str
    phone: Optional[str] = "N/A"
    address: Optional[str] = "N/A"
    childrenIds: List[str] = Field(default_factory=list)
    joinedDate: str
