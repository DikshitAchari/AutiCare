import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAppointments } from '../../context/AppointmentContext';
import { AppointmentTable } from '../../components/appointments/AppointmentTable';
import { AppointmentCard } from '../../components/appointments/AppointmentCard';
import { Tabs } from '../../components/ui/Tabs';
import { LayoutGrid, List } from 'lucide-react';

export const ParentAppointmentsPage: React.FC = () => {
  const { user } = useAuth();
  const { appointments, cancelAppointment } = useAppointments();
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  const myAppointments = appointments.filter((a) => a.parentId === user?.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">My Appointments</h1>
          <p className="text-xs text-slate-500">Track upcoming session times & review past clinical appointments</p>
        </div>

        <Tabs
          tabs={[
            { id: 'cards', label: 'Grid Cards', icon: <LayoutGrid className="w-3.5 h-3.5" /> },
            { id: 'table', label: 'Table View', icon: <List className="w-3.5 h-3.5" /> }
          ]}
          activeTab={viewMode}
          onChange={(tabId) => setViewMode(tabId as any)}
          variant="pills"
        />
      </div>

      {viewMode === 'cards' ? (
        myAppointments.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 bg-white rounded-xl border border-slate-200">
            No appointments booked yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myAppointments.map((apt) => (
              <AppointmentCard
                key={apt.id}
                appointment={apt}
                userRole="PARENT"
                onCancel={(id) => cancelAppointment(id)}
              />
            ))}
          </div>
        )
      ) : (
        <AppointmentTable
          appointments={myAppointments}
          onCancel={(id) => cancelAppointment(id)}
          showTherapistColumn={true}
        />
      )}
    </div>
  );
};
