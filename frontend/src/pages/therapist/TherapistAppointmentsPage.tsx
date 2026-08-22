import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAppointments } from '../../context/AppointmentContext';
import { AppointmentTable } from '../../components/appointments/AppointmentTable';
import { AppointmentCard } from '../../components/appointments/AppointmentCard';
import { OfflineBookingModal } from '../../components/appointments/OfflineBookingModal';
import { childApi } from '../../services/api/childApi';
import type { Child } from '../../types/child';
import { Button } from '../../components/ui/Button';
import { Tabs } from '../../components/ui/Tabs';
import { LayoutGrid, List, Lock } from 'lucide-react';

export const TherapistAppointmentsPage: React.FC = () => {
  const { user } = useAuth();
  const { appointments, updateStatus, cancelAppointment } = useAppointments();

  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [isOfflineOpen, setIsOfflineOpen] = useState(false);
  const [childrenList, setChildrenList] = useState<Child[]>([]);

  React.useEffect(() => {
    childApi.getAllChildren().then(setChildrenList);
  }, []);

  const therapistAppointments = appointments.filter((a) => a.therapistId === user?.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Clinical Appointment Management</h1>
          <p className="text-xs text-slate-500">Approve booking requests, lock clinic time slots, and view schedule</p>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={() => setIsOfflineOpen(true)} variant="success" leftIcon={<Lock className="w-4 h-4" />}>
            + Lock Offline Slot
          </Button>

          <Tabs
            tabs={[
              { id: 'cards', label: 'Grid', icon: <LayoutGrid className="w-3.5 h-3.5" /> },
              { id: 'table', label: 'Table', icon: <List className="w-3.5 h-3.5" /> }
            ]}
            activeTab={viewMode}
            onChange={(id) => setViewMode(id as any)}
            variant="pills"
          />
        </div>
      </div>

      {viewMode === 'cards' ? (
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
      ) : (
        <AppointmentTable
          appointments={therapistAppointments}
          onApprove={(id) => updateStatus(id, 'BOOKED')}
          onCancel={(id) => cancelAppointment(id)}
          showTherapistColumn={false}
        />
      )}

      <OfflineBookingModal
        isOpen={isOfflineOpen}
        onClose={() => setIsOfflineOpen(false)}
        childrenList={childrenList}
      />
    </div>
  );
};
