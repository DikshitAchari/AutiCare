import type { Notification } from '../types/notification';

export const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: 'NOT001',
    userId: 'P001',
    type: 'APPOINTMENT_CONFIRMED',
    title: 'Appointment Confirmed',
    message: 'Dr. Priya Sharma confirmed your session for Aarav on 12 Aug 2026 at 10:00 AM.',
    date: '2026-08-08T10:31:00Z',
    read: false,
    linkUrl: '/parent/appointments'
  },
  {
    id: 'NOT002',
    userId: 'P001',
    type: 'NEW_REPORT',
    title: 'New Therapy Progress Report',
    message: 'Dr. Priya Sharma uploaded a new behavioral progress report for Aarav.',
    date: '2026-08-08T14:32:00Z',
    read: true,
    linkUrl: '/parent/children'
  },
  {
    id: 'NOT003',
    userId: 'T001',
    type: 'APPOINTMENT_REQUEST',
    title: 'New Appointment Booking',
    message: 'Sunita Sharma requested a session for Ananya on 13 Aug 2026 at 11:00 AM.',
    date: '2026-08-10T16:21:00Z',
    read: false,
    linkUrl: '/therapist/appointments'
  },
  {
    id: 'NOT004',
    userId: 'ADM001',
    type: 'APPOINTMENT_REQUEST',
    title: 'New Therapist Verification Request',
    message: 'Dr. Ananya Verma submitted credential documents for administrator verification.',
    date: '2026-08-01T09:00:00Z',
    read: false,
    linkUrl: '/admin/therapists'
  }
];
