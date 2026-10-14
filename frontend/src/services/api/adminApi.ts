import type { ParentUser } from '../../types/user';
import { request } from './apiClient';

export interface AdminDashboardData {
  totalUsers: number;
  totalParents: number;
  totalTherapists: number;
  pendingTherapists: number;
  totalChildren: number;
  totalScreenings: number;
  totalAppointments: number;
}

export const adminApi = {
  getDashboard: async (): Promise<AdminDashboardData> => {
    return request<AdminDashboardData>('/api/admin/dashboard');
  },

  getParents: async (): Promise<ParentUser[]> => {
    return request<ParentUser[]>('/api/admin/parents');
  }
};
