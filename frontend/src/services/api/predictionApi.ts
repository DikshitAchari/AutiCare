import { request } from './apiClient';

export interface PredictionResult {
  id?: string;
  childId: string;
  supportIndicator: string;
  confidenceScore: number;
  percentage: number;
  summary: string;
  recommendations: string[];
  disclaimer: string;
  source?: string;
  createdAt?: string;
}

interface BackendPredictionResponse {
  id: number;
  child_id: number;
  support_indicator: string;
  confidence_score: number;
  percentage: number;
  summary: string;
  recommendations: string[];
  disclaimer: string;
  source?: string;
  created_at?: string | null;
}

const toPredictionResult = (result: BackendPredictionResponse): PredictionResult => ({
  id: String(result.id),
  childId: String(result.child_id),
  supportIndicator: result.support_indicator,
  confidenceScore: result.confidence_score,
  percentage: result.percentage,
  summary: result.summary,
  recommendations: result.recommendations,
  disclaimer: result.disclaimer,
  source: result.source,
  createdAt: result.created_at ?? undefined
});

export const predictionApi = {
  getPrediction: async (childId: string, answers: Record<string, number>): Promise<PredictionResult> => {
    const result = await request<BackendPredictionResponse>('/api/prediction', {
      method: 'POST',
      body: JSON.stringify({ child_id: Number(childId), answers })
    });
    return toPredictionResult(result);
  },

  analyzeVideo: async (childId: string, file: File): Promise<PredictionResult> => {
    const formData = new FormData();
    formData.append('child_id', childId);
    formData.append('file', file);

    const result = await request<BackendPredictionResponse>('/api/prediction/analyze', {
      method: 'POST',
      body: formData
    });

    return toPredictionResult(result);
  },

  getPredictionResultById: async (predictionId: string): Promise<PredictionResult> => {
    const result = await request<BackendPredictionResponse>(`/api/prediction/results/${predictionId}`);
    return toPredictionResult(result);
  },

  getPredictionResults: async (): Promise<PredictionResult[]> => {
    const results = await request<BackendPredictionResponse[]>('/api/prediction/results');
    return results.map(toPredictionResult);
  }
};
