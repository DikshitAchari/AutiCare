export interface ClinicalReport {
  id: string;
  childId: string;
  childName: string;
  therapistId: string;
  therapistName: string;
  title: string;
  date: string;
  sessionDate?: string;
  overallProgressScore: number; // 0 to 100
  observations: string;
  progressNotes?: string;
  recommendations?: string;
  nextSessionPlan?: string;
  goalsAchieved: string[];
  nextMilestones: string[];
  createdAt: string;
}

export interface TherapyReport extends ClinicalReport {}
