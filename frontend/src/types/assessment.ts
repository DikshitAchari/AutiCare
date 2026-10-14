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

export type BehaviorAnalysisStatus = 'detected' | 'not_detected' | 'not_analyzed';

export interface PoseMotionChannelSummary {
  quality_status?: string;
  usable_frames?: number;
  total_frames?: number;
  coverage_percent?: number;
  periodicity_score?: number;
  candidate_cycles?: number;
  dominant_frequency_hz?: number | null;
  interpretation?: string;
}

export interface PoseAnalysisSummary {
  status?: string;
  engine?: string;
  trajectory_json?: string;
  video_summary?: Record<string, unknown>;
  channels?: Record<string, PoseMotionChannelSummary>;
  dominant_channels?: Array<Record<string, unknown>>;
  limitations?: string[];
}

export interface BehaviorSegment {
  start_frame: number;
  end_frame: number;
  behavior: string;
  classification_confidence: number;
  proposal_confidence: number;
}

export interface BehaviorFinding {
  name: string;
  status: BehaviorAnalysisStatus;
  confidence: number | null;
  model: string | null;
  segments: BehaviorSegment[];
}

export interface DetectedBehaviorItem {
  behavior: string;
  confidence?: number | null;
  segments?: BehaviorSegment[];
}

export interface BehaviorAnalysis {
  analysis_type: 'RRB_behavior_analysis';
  status?: string;
  reason?: string;
  behaviors: BehaviorFinding[];
  additional_observations: BehaviorFinding[];
  detected_behaviors?: DetectedBehaviorItem[];
  supported_behavior_count: number;
  analyzed_behavior_count: number;
  detected_behavior_count: number;
  repetitive_behavior_detected: boolean;
  disclaimer: string;
}

export type ScreeningResult = AssessmentResult;
