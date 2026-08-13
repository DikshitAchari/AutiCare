import type { BehaviorLog } from '../../types/behavior';
import { storageService } from '../storage/storageService';

export const behaviorApi = {
  getLogsByChild: async (childId: string): Promise<BehaviorLog[]> => {
    const all = storageService.getBehaviors() as unknown as BehaviorLog[];
    return all.filter((b) => b.childId === childId);
  },

  createLog: async (data: Omit<BehaviorLog, 'id' | 'createdAt'>): Promise<BehaviorLog> => {
    const current = (storageService.getBehaviors() as unknown as BehaviorLog[]) || [];
    const newLog: BehaviorLog = {
      ...data,
      id: `beh-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    const updated = [newLog, ...current];
    storageService.saveBehaviors(updated as any);
    return newLog;
  },

  addBehaviorLog: async (data: any): Promise<BehaviorLog> => {
    return behaviorApi.createLog({
      childId: data.childId,
      date: data.date || new Date().toISOString().split('T')[0],
      behaviorCategory: data.category || 'Sensory',
      behaviorDescription: data.behaviorTitle || data.description || 'Observed behavior',
      intensityLevel: data.severity === 'SEVERE' ? 'HIGH' : data.severity === 'MODERATE' ? 'MODERATE' : 'LOW',
      frequencyCount: data.frequency || 1,
      triggerAntecedent: data.trigger,
      managementStrategy: data.notes
    });
  }
};
