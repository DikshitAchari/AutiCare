export type SupportIndicatorLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'NOT_ASSESSED';
export type ChildTherapyStatus = 'REQUESTED' | 'ASSIGNED' | 'ACTIVE' | 'COMPLETED' | 'NOT_STARTED';

export interface ChildMilestone {
  id: string;
  title: string;
  date: string;
  category: 'Social' | 'Communication' | 'Motor' | 'Cognitive';
  achieved: boolean;
}

export interface ChildIntakeForm {
  name: string;
  dob: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  school?: string;
  grade?: string;
  parentNotes?: string;
}

export interface Child {
  id: string;
  parentId: string;
  parentName: string;
  name: string;
  dob: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  school?: string;
  grade?: string;
  parentNotes?: string;
  avatarUrl?: string;

  // Status fields
  assignedTherapistId?: string;
  assignedTherapistName?: string;
  supportIndicator: SupportIndicatorLevel;
  therapyStatus: ChildTherapyStatus;
  assessmentStatus: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING';
  lastAssessmentDate?: string;
  lastSessionDate?: string;

  milestones?: ChildMilestone[];
}
