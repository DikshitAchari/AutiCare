import type { ClinicalReport } from '../../types/report';
import { storageService } from '../storage/storageService';

export const reportApi = {
  getAllReports: async (): Promise<ClinicalReport[]> => {
    return storageService.getReports() as unknown as ClinicalReport[];
  },

  getReportsByChild: async (childId: string): Promise<ClinicalReport[]> => {
    const all = await reportApi.getAllReports();
    return all.filter((r) => r.childId === childId);
  },

  createReport: async (data: Omit<ClinicalReport, 'id' | 'createdAt'>): Promise<ClinicalReport> => {
    const current = await reportApi.getAllReports();
    const newReport: ClinicalReport = {
      ...data,
      id: `rep-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    const updated = [newReport, ...current];
    storageService.saveReports(updated as any);
    return newReport;
  }
};
