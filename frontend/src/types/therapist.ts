export interface AvailabilitySlot {
  id: string;
  therapistId: string;
  dayOfWeek: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  startTime: string; // HH:mm format e.g. "09:00"
  endTime: string;   // HH:mm format e.g. "09:30"
  isBooked?: boolean;
}

export interface DayScheduleConfig {
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  active: boolean;
  slots: string[]; // Array of time strings e.g. ["09:00 AM", "09:30 AM", "10:00 AM"]
}
