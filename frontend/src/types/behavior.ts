export type BehaviorSeverity = 'Low' | 'Moderate' | 'High' | 'MILD' | 'MODERATE' | 'SEVERE';

export interface BehaviorRecord {
  id: string;
  childId: string;
  therapistId?: string;
  date: string;
  behaviorTitle?: string;
  behaviorDescription?: string;
  behaviorCategory?: string;
  category?: string;
  observation?: string;
  frequency?: number;
  frequencyCount?: number;
  severity?: BehaviorSeverity;
  intensityLevel?: 'LOW' | 'MODERATE' | 'HIGH';
  trigger?: string;
  triggerAntecedent?: string;
  response?: string;
  managementStrategy?: string;
  notes?: string;
  createdAt: string;
}

export interface BehaviorLog extends BehaviorRecord {}
