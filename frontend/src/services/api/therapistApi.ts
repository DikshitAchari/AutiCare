import type { AvailabilitySlot } from '../../types/therapist';
import type { TherapistUser } from '../../types/user';
import { request } from './apiClient';

export interface TherapistRecommendation {
  therapist: TherapistUser;
  recommendation_type: string;
  method: string;
  is_ai_generated: boolean;
  matching_criteria: string[];
  explanation: string;
}

export const therapistApi = {
  getTherapists: async (status?: string): Promise<TherapistUser[]> => {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    return request<TherapistUser[]>(`/api/therapists${query}`);
  },

  getTherapistById: async (id: string): Promise<TherapistUser | null> => {
    try {
      return await request<TherapistUser>(`/api/therapists/${id}`);
    } catch {
      return null;
    }
  },

  updateTherapistStatus: async (
    id: string,
    status: TherapistUser['status']
  ): Promise<TherapistUser> => {
    return request<TherapistUser>(`/api/therapists/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  },

  getAvailability: async (therapistId: string): Promise<AvailabilitySlot[]> => {
    return request<AvailabilitySlot[]>(`/api/therapists/${therapistId}/availability`);
  },

  getRecommendations: async (childId: string): Promise<TherapistRecommendation[]> => {
    return request<TherapistRecommendation[]>(`/api/therapists/recommendation/${childId}`);
  }
};
