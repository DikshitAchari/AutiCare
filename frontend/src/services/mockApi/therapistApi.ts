import type { TherapistUser } from '../../types/user';
import { storageService } from '../storage/storageService';

export const therapistApi = {
  getTherapists: async (): Promise<TherapistUser[]> => {
    return storageService.getTherapists();
  },

  getTherapistById: async (id: string): Promise<TherapistUser | null> => {
    const list = storageService.getTherapists();
    return list.find((t) => t.id === id) || null;
  },

  updateTherapistStatus: async (
    id: string,
    status: TherapistUser['status']
  ): Promise<TherapistUser> => {
    const updated = storageService.updateTherapist(id, { status });
    if (!updated) throw new Error('Therapist not found');
    return updated;
  }
};
