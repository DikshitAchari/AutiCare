export type AppointmentStatus = 'BOOKED' | 'PENDING' | 'CANCELLED' | 'COMPLETED';
export type BookingSource = 'ONLINE' | 'OFFLINE';
export type AppointmentType = 'ONLINE' | 'IN_PERSON';

export interface Appointment {
  id: string;
  therapistId: string;
  therapistName: string;
  childId: string;
  childName: string;
  parentId: string;
  parentName: string;
  date: string; // YYYY-MM-DD format e.g. "2026-08-12"
  time: string; // e.g. "10:00 AM"
  status: AppointmentStatus;
  bookingSource: BookingSource;
  appointmentType: AppointmentType;
  reason?: string;
  notes?: string;
  createdAt: string;
}
