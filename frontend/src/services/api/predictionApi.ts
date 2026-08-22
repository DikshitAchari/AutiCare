import { request } from './apiClient';

export interface PredictionResult {
  childId: string;
  supportIndicator: string;
  confidenceScore: number;
  percentage: number;
  summary: string;
  recommendations: string[];
  disclaimer: string;
}

export const predictionApi = {
  getPrediction: async (childId: string, answers: Record<string, number>): Promise<PredictionResult> => {
    const result = await request<{
      child_id: number;
      support_indicator: string;
      confidence_score: number;
      percentage: number;
      summary: string;
      recommendations: string[];
      disclaimer: string;
    }>('/api/prediction', {
      method: 'POST',
      body: JSON.stringify({ child_id: Number(childId), answers })
    });
    return {
      childId: String(result.child_id),
      supportIndicator: result.support_indicator,
      confidenceScore: result.confidence_score,
      percentage: result.percentage,
      summary: result.summary,
      recommendations: result.recommendations,
      disclaimer: result.disclaimer
    };
  }
};