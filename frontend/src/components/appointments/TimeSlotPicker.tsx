import React from 'react';
import { useAppointments } from '../../context/AppointmentContext';
import { clsx } from 'clsx';
import { Clock, Lock } from 'lucide-react';

export interface TimeSlotPickerProps {
  therapistId: string;
  date: string;
  selectedTime: string;
  onSelectTime: (time: string) => void;
  availableTimes?: string[];
}

const DEFAULT_SLOTS = [
  '09:00 AM',
  '09:30 AM',
  '10:00 AM',
  '10:30 AM',
  '11:00 AM',
  '11:30 AM',
  '02:00 PM',
  '02:30 PM',
  '03:00 PM',
  '03:30 PM',
  '04:00 PM'
];

export const TimeSlotPicker: React.FC<TimeSlotPickerProps> = ({
  therapistId,
  date,
  selectedTime,
  onSelectTime,
  availableTimes = DEFAULT_SLOTS
}) => {
  const { isSlotAvailable } = useAppointments();

  return (
    <div className="space-y-2">
      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
        Select Time Slot ({date || 'Select Date'})
      </label>

      {!date ? (
        <div className="text-xs text-slate-400 p-4 border border-dashed rounded-2xl text-center">
          Please select an appointment date to view available time slots.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {availableTimes.map((time) => {
            const available = isSlotAvailable(therapistId, date, time);
            const isSelected = selectedTime === time;

            return (
              <button
                key={time}
                type="button"
                disabled={!available}
                onClick={() => available && onSelectTime(time)}
                className={clsx(
                  'flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer',
                  isSelected && available && 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-600/20 ring-2 ring-purple-200',
                  !isSelected && available && 'bg-white text-slate-700 border-slate-200 hover:border-purple-300 hover:bg-purple-50/50',
                  !available && 'bg-slate-100 text-slate-400 border-slate-200 opacity-60 cursor-not-allowed line-through'
                )}
              >
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 shrink-0 text-purple-600" />
                  <span>{time}</span>
                </div>
                {!available && (
                  <span className="flex items-center gap-0.5 text-[10px] font-extrabold text-rose-600 uppercase no-underline">
                    <Lock className="w-3 h-3" /> Booked
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
