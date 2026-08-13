import React from 'react';
import { useAppointments } from '../../context/AppointmentContext';
import { AppointmentTable } from '../../components/appointments/AppointmentTable';

export const AdminAppointmentsPage: React.FC = () => {
  const { appointments, cancelAppointment } = useAppointments();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Master Appointments Feed</h1>
        <p className="text-xs text-slate-500">Global ledger of offline clinic locks and online tele-consultation reservations</p>
      </div>

      <AppointmentTable
        appointments={appointments}
        onCancel={(id) => cancelAppointment(id)}
        showTherapistColumn={true}
      />
    </div>
  );
};
