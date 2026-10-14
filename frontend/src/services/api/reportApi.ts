import type { ClinicalReport } from '../../types/report';
import { request } from './apiClient';

export const reportApi = {
  getAllReports: async (): Promise<ClinicalReport[]> => {
    return request<ClinicalReport[]>('/api/reports');
  },

  getReportsByChild: async (childId: string): Promise<ClinicalReport[]> => {
    return request<ClinicalReport[]>(`/api/reports?childId=${encodeURIComponent(childId)}`);
  },

  getReportById: async (reportId: string): Promise<ClinicalReport> => {
    return request<ClinicalReport>(`/api/reports/${reportId}`);
  },

  createReport: async (data: Omit<ClinicalReport, 'id' | 'createdAt'>): Promise<ClinicalReport> => {
    return request<ClinicalReport>('/api/reports', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
};
