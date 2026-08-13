import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAppointments } from '../../context/AppointmentContext';
import { childApi } from '../../services/mockApi/childApi';
import type { Child } from '../../types/child';
import { Button } from '../../components/ui/Button';
import { AppointmentCard } from '../../components/appointments/AppointmentCard';
import { OfflineBookingModal } from '../../components/appointments/OfflineBookingModal';
import { Users, Calendar, FileText, Lock, Plus } from 'lucide-react';

export const TherapistDashboard: React.FC = () => {
  const { user } = useAuth();
  const { appointments, updateStatus, cancelAppointment } = useAppointments();

  const [childrenList, setChildrenList] = useState<Child[]>([]);
  const [isOfflineModalOpen, setIsOfflineModalOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      const allChildren = await childApi.getAllChildren();
      setChildrenList(allChildren);
    };
    load();
  }, []);

  const therapistAppointments = appointments.filter((a) => a.therapistId === user?.id);
  const offlineLocks = therapistAppointments.filter((a) => a.bookingSource === 'OFFLINE');

  return (
    <div className="space-y-6">
      {/* 1. Header (Matching Screen 7) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Therapist Portal</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {user?.name || 'Dr. Anjali Sharma'} • Child Psychologist & Clinical Specialist
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setIsOfflineModalOpen(true)}
            leftIcon={<Lock className="w-4 h-4" />}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md shadow-purple-600/20"
          >
            Lock Offline Slot
          </Button>
        </div>
      </div>

      {/* 2. 4 Stat Cards (Horizontal Row matching Screen 7) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Patients</span>
            <Users className="w-4 h-4 text-purple-600" />
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">18</span>
              <span className="text-[11px] font-bold text-slate-400">Active</span>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Today's Sessions</span>
            <Calendar className="w-4 h-4 text-purple-600" />
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">4</span>
              <span className="text-[11px] font-bold text-emerald-600">2 Completed</span>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Reports Published</span>
            <FileText className="w-4 h-4 text-purple-600" />
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">24</span>
              <span className="text-[11px] font-bold text-slate-400">Quarterly</span>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Slots Locked</span>
            <Lock className="w-4 h-4 text-amber-500" />
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{offlineLocks.length || 8}</span>
              <span className="text-[11px] font-bold text-amber-600">Prevented Double-Bookings</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Quick Lock Offline Clinic Slot Banner */}
      <div className="p-5 rounded-3xl bg-purple-50/60 border border-purple-100/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Clinical Double-Booking Prevention</h3>
            <p className="text-xs text-slate-600 font-medium">
              Locking an offline walk-in slot in clinic instantly blocks online reservations by parents across all devices.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsOfflineModalOpen(true)}
          className="w-full md:w-auto px-5 py-2.5 text-xs font-extrabold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-md shadow-purple-600/20 transition-all cursor-pointer text-center shrink-0 flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Lock Offline Clinic Slot</span>
        </button>
      </div>

      {/* 4. Synchronized Schedule Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Synchronized Clinical Schedule</h3>
            <p className="text-xs text-slate-500 font-medium">Real-time online tele-health & offline clinic reservations</p>
          </div>
        </div>

        {therapistAppointments.length === 0 ? (
          <div className="p-8 rounded-3xl bg-white border border-slate-100 text-center text-xs text-slate-400">
            No scheduled sessions found.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {therapistAppointments.map((apt) => (
              <AppointmentCard
                key={apt.id}
                appointment={apt}
                userRole="THERAPIST"
                onApprove={(id) => updateStatus(id, 'BOOKED')}
                onCancel={(id) => cancelAppointment(id)}
              />
            ))}
          </div>
        )}
      </div>

      <OfflineBookingModal
        isOpen={isOfflineModalOpen}
        onClose={() => setIsOfflineModalOpen(false)}
        childrenList={childrenList}
      />
    </div>
  );
};
