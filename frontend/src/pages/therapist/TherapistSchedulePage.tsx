import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAppointments } from '../../context/AppointmentContext';
import { OfflineBookingModal } from '../../components/appointments/OfflineBookingModal';
import { childApi } from '../../services/api/childApi';
import type { Child } from '../../types/child';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Clock, Lock, Video } from 'lucide-react';

export const TherapistSchedulePage: React.FC = () => {
  const { user } = useAuth();
  const { appointments } = useAppointments();

  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [isOfflineOpen, setIsOfflineOpen] = useState(false);
  const [childrenList, setChildrenList] = useState<Child[]>([]);

  useEffect(() => {
    childApi.getAllChildren().then(setChildrenList);
  }, []);

  const therapistApts = appointments.filter(
    (a) => a.therapistId === user?.id && a.date === selectedDate && a.status !== 'CANCELLED'
  );

  const SLOTS = [
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Schedule & Slot Matrix</h1>
          <p className="text-xs text-slate-500">Lock offline clinic appointments and manage daily time slots</p>
        </div>

        <Button onClick={() => setIsOfflineOpen(true)} variant="success" leftIcon={<Lock className="w-4 h-4" />}>
          + Lock Offline Slot
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Date Selector */}
        <Card className="p-5">
          <label className="block text-xs font-bold uppercase text-slate-700 mb-2">Select Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full p-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500"
          />

          <div className="mt-6 pt-4 border-t border-slate-100 text-xs space-y-2 text-slate-600">
            <h4 className="font-bold text-slate-800 uppercase">Slot Legend</h4>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <span>Offline Lock (Clinic Session)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500" />
              <span>Online Tele-Consultation</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-slate-200 border" />
              <span>Available Slot</span>
            </div>
          </div>
        </Card>

        {/* Time Matrix */}
        <Card className="p-6 lg:col-span-2 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b pb-2">
            Time Slots for {selectedDate}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {SLOTS.map((time) => {
              const matchedApt = therapistApts.find((a) => a.time === time);

              return (
                <div
                  key={time}
                  className={`p-3.5 rounded-xl border flex items-center justify-between text-xs transition-all ${
                    matchedApt
                      ? matchedApt.bookingSource === 'OFFLINE'
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-medium'
                        : 'bg-blue-50 border-blue-300 text-blue-950 font-medium'
                      : 'bg-white border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span>{time}</span>
                  </div>

                  {matchedApt ? (
                    <div className="flex items-center gap-1.5 font-bold">
                      {matchedApt.bookingSource === 'OFFLINE' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-md">
                          <Lock className="w-3 h-3" /> OFFLINE LOCKED ({matchedApt.childName})
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] bg-blue-200 text-blue-900 px-2 py-0.5 rounded-md">
                          <Video className="w-3 h-3" /> ONLINE ({matchedApt.childName})
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-[11px] font-semibold text-slate-400">Available</span>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <OfflineBookingModal
        isOpen={isOfflineOpen}
        onClose={() => setIsOfflineOpen(false)}
        childrenList={childrenList}
      />
    </div>
  );
};
