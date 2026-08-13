import type { Appointment, BookingSource, AppointmentType } from '../../types/appointment';
import { storageService } from '../storage/storageService';

export const appointmentApi = {
  getAppointments: async (): Promise<Appointment[]> => {
    return storageService.getAppointments();
  },

  getAppointmentsByParent: async (parentId: string): Promise<Appointment[]> => {
    const list = storageService.getAppointments();
    return list.filter((a) => a.parentId === parentId);
  },

  getAppointmentsByTherapist: async (therapistId: string): Promise<Appointment[]> => {
    const list = storageService.getAppointments();
    return list.filter((a) => a.therapistId === therapistId);
  },

  createAppointment: async (data: {
    therapistId: string;
    therapistName: string;
    parentId: string;
    parentName: string;
    childId: string;
    childName: string;
    date: string;
    time: string;
    bookingSource: BookingSource;
    appointmentType?: AppointmentType;
    type?: AppointmentType;
    notes?: string;
  }): Promise<Appointment> => {
    const current = storageService.getAppointments();

    const existingSlot = current.find(
      (a) =>
        a.therapistId === data.therapistId &&
        a.date === data.date &&
        a.time === data.time &&
        a.status !== 'CANCELLED'
    );

    if (existingSlot) {
      if (existingSlot.bookingSource === 'OFFLINE') {
        throw new Error(
          'This slot has been locked for an offline clinic session by the therapist and is not available for online booking.'
        );
      }
      throw new Error('This therapist is already booked for the selected date and time slot.');
    }

    const apptType: AppointmentType = data.appointmentType || data.type || (data.bookingSource === 'OFFLINE' ? 'IN_PERSON' : 'ONLINE');

    const newAppointment: Appointment = {
      id: `apt-${Date.now()}`,
      therapistId: data.therapistId,
      therapistName: data.therapistName,
      parentId: data.parentId,
      parentName: data.parentName,
      childId: data.childId,
      childName: data.childName,
      date: data.date,
      time: data.time,
      bookingSource: data.bookingSource,
      appointmentType: apptType,
      status: data.bookingSource === 'OFFLINE' ? 'BOOKED' : 'PENDING',
      notes: data.notes,
      createdAt: new Date().toISOString()
    };

    const updatedList = [newAppointment, ...current];
    storageService.saveAppointments(updatedList);
    return newAppointment;
  },

  updateStatus: async (appointmentId: string, status: Appointment['status']): Promise<Appointment> => {
    const current = storageService.getAppointments();
    const idx = current.findIndex((a) => a.id === appointmentId);
    if (idx === -1) throw new Error('Appointment not found');

    const updated = { ...current[idx], status };
    current[idx] = updated;
    storageService.saveAppointments(current);
    return updated;
  },

  updateAppointmentStatus: async (appointmentId: string, status: Appointment['status']): Promise<Appointment> => {
    return appointmentApi.updateStatus(appointmentId, status);
  },

  cancelAppointment: async (appointmentId: string): Promise<Appointment> => {
    return appointmentApi.updateStatus(appointmentId, 'CANCELLED');
  }
};
