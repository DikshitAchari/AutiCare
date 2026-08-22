import type { AssessmentResult, AssessmentSubmission } from '../../types/assessment';
import { request } from './apiClient';

interface BackendAssessmentResult {
  id: number;
  child_id: number;
  total_score: number;
  max_score: number;
  percentage: number;
  support_indicator: AssessmentResult['supportIndicator'];
  summary: string;
  recommendations: string[];
  disclaimer: string;
  completed_at?: string | null;
  domain_scores: Array<{ category: string; category_name?: string; obtained_score?: number; max_score?: number; percentage?: number }>;
}

const toResult = (result: BackendAssessmentResult): AssessmentResult => ({
  id: String(result.id),
  childId: String(result.child_id),
  childName: 'Child Patient',
  completedDate: result.completed_at ?? new Date().toISOString(),
  totalScore: result.total_score,
  maxScore: result.max_score,
  percentage: result.percentage,
  supportIndicator: result.support_indicator,
  domainScores: result.domain_scores.map((domain) => ({
    category: domain.category,
    categoryName: domain.category_name,
    obtainedScore: domain.obtained_score,
    maxScore: domain.max_score,
    percentage: domain.percentage
  })),
  summary: result.summary,
  recommendations: result.recommendations,
  disclaimer: result.disclaimer
});

export const assessmentApi = {
  submitAssessment: async (submission: AssessmentSubmission): Promise<AssessmentResult> => {
    const result = await request<BackendAssessmentResult>('/api/assessment', {
      method: 'POST',
      body: JSON.stringify({ child_id: Number(submission.childId), answers: submission.answers })
    });
    return toResult(result);
  },

  getAllResults: async (): Promise<AssessmentResult[]> =>
    request<BackendAssessmentResult[]>('/api/assessment').then((results) => results.map(toResult))
};