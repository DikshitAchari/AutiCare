import type { Appointment, BookingSource, AppointmentType } from '../../types/appointment';
import { request } from './apiClient';

export interface CreateAppointmentInput {
  therapistId: string;
  therapistName?: string;
  parentId?: string;
  parentName?: string;
  childId: string;
  childName?: string;
  date: string;
  time: string;
  bookingSource: BookingSource;
  appointmentType?: AppointmentType;
  type?: AppointmentType;
  reason?: string;
  notes?: string;
}

export const appointmentApi = {
  getAppointments: async (): Promise<Appointment[]> => {
    return request<Appointment[]>('/api/appointments');
  },

  getAppointmentsByParent: async (parentId?: string): Promise<Appointment[]> => {
    const query = parentId ? `?parentId=${encodeURIComponent(parentId)}` : '';
    return request<Appointment[]>(`/api/appointments${query}`);
  },

  getAppointmentsByTherapist: async (therapistId?: string): Promise<Appointment[]> => {
    const query = therapistId ? `?therapistId=${encodeURIComponent(therapistId)}` : '';
    return request<Appointment[]>(`/api/appointments${query}`);
  },

  createAppointment: async (data: CreateAppointmentInput): Promise<Appointment> => {
    const apptType: AppointmentType =
      data.appointmentType || data.type || (data.bookingSource === 'OFFLINE' ? 'IN_PERSON' : 'ONLINE');

    return request<Appointment>('/api/appointments', {
      method: 'POST',
      body: JSON.stringify({
        therapistId: data.therapistId,
        therapistName: data.therapistName,
        childId: data.childId,
        childName: data.childName,
        parentId: data.parentId,
        parentName: data.parentName,
        date: data.date,
        time: data.time,
        bookingSource: data.bookingSource,
        appointmentType: apptType,
        reason: data.reason,
        notes: data.notes
      })
    });
  },

  updateStatus: async (appointmentId: string, status: Appointment['status']): Promise<Appointment> => {
    return request<Appointment>(`/api/appointments/${appointmentId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  },

  updateAppointmentStatus: async (appointmentId: string, status: Appointment['status']): Promise<Appointment> => {
    return appointmentApi.updateStatus(appointmentId, status);
  },

  cancelAppointment: async (appointmentId: string): Promise<Appointment> => {
    return request<Appointment>(`/api/appointments/${appointmentId}/cancel`, {
      method: 'POST'
    });
  }
};
