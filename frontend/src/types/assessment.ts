import type { SupportIndicatorLevel } from './child';

export type QuestionCategory =
  | 'SOCIAL'
  | 'COMMUNICATION'
  | 'BEHAVIORAL'
  | 'Social Interaction'
  | 'Communication'
  | 'Repetitive Behaviour'
  | 'Sensory Responses'
  | 'Attention & Focus';

export interface AssessmentQuestionOption {
  label: string;
  value?: string;
  score: number;
}

export interface AssessmentQuestion {
  id: string;
  category: QuestionCategory;
  text?: string;
  questionText?: string;
  options: AssessmentQuestionOption[];
}

export interface AssessmentSubmission {
  childId: string;
  answers: Record<string, number>; // questionId -> selected score
}

export interface DomainScore {
  category: QuestionCategory | string;
  categoryName?: string;
  obtainedScore?: number;
  scorePercentage?: number;
  maxScore?: number;
  percentage?: number;
  riskLevel?: string;
}

export interface AssessmentResult {
  id: string;
  assessmentId?: string;
  childId: string;
  childName: string;
  date?: string;
  completedDate: string;
  totalScore: number;
  maxScore: number;
  percentage: number;
  confidenceScore?: number;
  supportIndicator: SupportIndicatorLevel;
  overallSupportIndicator?: SupportIndicatorLevel;
  domainScores: DomainScore[];
  summary: string;
  recommendations: string[];
  disclaimer: string;
}

export type ScreeningResult = AssessmentResult;
