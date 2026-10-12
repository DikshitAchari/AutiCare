import { API_BASE_URL, request } from './apiClient';
import type { BehaviorAnalysis, PoseAnalysisSummary } from '../../types/assessment';
import { storageService } from '../storage/storageService';

interface BackendApiError {
  detail?: string | Array<{ msg?: string }>;
}

export interface PredictionResult {
  id?: string;
  childId: string;
  supportIndicator?: string | null;
  confidenceScore?: number | null;
  percentage?: number | null;
  summary: string;
  recommendations: string[];
  disclaimer: string;
  source?: string;
  createdAt?: string;
  behaviorAnalysis?: BehaviorAnalysis | null;
  poseAnalysis?: PoseAnalysisSummary | null;
}

interface BackendPredictionResponse {
  id: number;
  child_id: number;
  support_indicator?: string | null;
  confidence_score?: number | null;
  percentage?: number | null;
  summary: string;
  recommendations: string[];
  disclaimer: string;
  source?: string;
  created_at?: string | null;
  behavior_analysis?: BehaviorAnalysis | null;
  pose_analysis?: PoseAnalysisSummary | null;
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
  createdAt: result.created_at ?? undefined,
  behaviorAnalysis: result.behavior_analysis ?? undefined,
  poseAnalysis: result.pose_analysis ?? undefined
});

export const predictionApi = {
  getPrediction: async (childId: string, answers: Record<string, number>): Promise<PredictionResult> => {
    const result = await request<BackendPredictionResponse>('/api/prediction', {
      method: 'POST',
      body: JSON.stringify({ child_id: Number(childId), answers })
    });
    return toPredictionResult(result);
  },

  analyzeVideo: async (
    childId: string,
    file: File,
    onUploadComplete?: () => void
  ): Promise<PredictionResult> => {
    const formData = new FormData();
    formData.append('child_id', childId);
    formData.append('file', file);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${API_BASE_URL}/api/prediction/analyze`);
      xhr.timeout = 360_000;
      const token = storageService.getAuthToken();
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }

      xhr.upload.addEventListener('load', () => onUploadComplete?.());
      xhr.addEventListener('load', () => {
        let body: BackendPredictionResponse | BackendApiError;
        try {
          body = JSON.parse(xhr.responseText) as BackendPredictionResponse | BackendApiError;
        } catch {
          reject(new Error('Analysis server returned an invalid response.'));
          return;
        }

        if (xhr.status < 200 || xhr.status >= 300) {
          const detail = (body as BackendApiError).detail;
          const message = typeof detail === 'string'
            ? detail
            : Array.isArray(detail)
              ? detail.map((error) => error.msg).filter(Boolean).join(', ')
              : `Request failed (${xhr.status})`;
          reject(new Error(message));
          return;
        }
        resolve(toPredictionResult(body as BackendPredictionResponse));
      });
      xhr.addEventListener('error', () => {
        reject(new Error('Unable to connect to AutiCare. Please check that the server is running.'));
      });
      xhr.addEventListener('timeout', () => {
        reject(new Error('Video analysis timed out. Please try again with a shorter video.'));
      });
      xhr.addEventListener('abort', () => reject(new Error('Video analysis was cancelled.')));
      xhr.send(formData);
    });
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
