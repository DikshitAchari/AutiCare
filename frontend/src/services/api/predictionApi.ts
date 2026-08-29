import { request } from './apiClient';

export interface DomainBreakdownItem {
  status: string;
  percentage: number | null;
  action?: string;
  action_confidence?: number;
  description: string;
}

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
  domainBreakdown?: Record<string, DomainBreakdownItem>;
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
  domain_breakdown?: Record<string, DomainBreakdownItem>;
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
  domainBreakdown: result.domain_breakdown,
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
  },

  downloadReport: async (predictionId: string): Promise<Blob> => {
    const token = localStorage.getItem('auticare_token');
    const response = await fetch(`/api/prediction/results/${predictionId}/report`, {
      headers: {
        Authorization: token ? `Bearer ${token}` : ''
      }
    });
    if (!response.ok) {
      throw new Error(`Report generation failed: ${response.statusText}`);
    }
    return response.blob();
  }
};
