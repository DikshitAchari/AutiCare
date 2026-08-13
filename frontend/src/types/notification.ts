export type NotificationType = 
  | 'APPOINTMENT_REQUEST'
  | 'APPOINTMENT_CONFIRMED'
  | 'APPOINTMENT_CANCELLED'
  | 'ASSESSMENT_COMPLETED'
  | 'NEW_REPORT'
  | 'MESSAGE';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  date: string;
  read: boolean;
  linkUrl?: string;
}
