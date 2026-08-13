import React, { useState } from 'react';
import type { Appointment } from '../../types/appointment';
import { StatusBadge } from '../ui/StatusBadge';
import { Button } from '../ui/Button';
import { Search, Filter } from 'lucide-react';

export interface AppointmentTableProps {
  appointments: Appointment[];
  onCancel?: (id: string) => void;
  onApprove?: (id: string) => void;
  showTherapistColumn?: boolean;
}

export const AppointmentTable: React.FC<AppointmentTableProps> = ({
  appointments,
  onCancel,
  onApprove,
  showTherapistColumn = true
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filtered = appointments.filter((apt) => {
    const matchesSearch =
      apt.childName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.therapistName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.parentName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || apt.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Table Header Filter Toolbar */}
      <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search by child, therapist, or parent..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-none w-full"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="BOOKED">Confirmed / Booked</option>
            <option value="PENDING">Pending Approval</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100/70 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              <th className="py-3 px-4">Date & Time</th>
              <th className="py-3 px-4">Child Patient</th>
              <th className="py-3 px-4">Parent</th>
              {showTherapistColumn && <th className="py-3 px-4">Therapist</th>}
              <th className="py-3 px-4">Source & Format</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400">
                  No appointments found matching your filter criteria.
                </td>
              </tr>
            ) : (
              filtered.map((apt) => (
                <tr key={apt.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-semibold text-slate-900">
                    <div>{apt.date}</div>
                    <div className="text-[10px] text-blue-600 font-bold">{apt.time}</div>
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-900">{apt.childName}</td>
                  <td className="py-3 px-4 text-slate-600">{apt.parentName}</td>
                  {showTherapistColumn && <td className="py-3 px-4 font-medium text-slate-800">{apt.therapistName}</td>}
                  <td className="py-3 px-4">
                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                      {apt.bookingSource} • {apt.appointmentType}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={apt.status} type="appointment" />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {apt.status === 'PENDING' && onApprove && (
                        <Button size="sm" variant="success" className="text-[11px] py-1 px-2" onClick={() => onApprove(apt.id)}>
                          Approve
                        </Button>
                      )}
                      {apt.status !== 'CANCELLED' && onCancel && (
                        <Button size="sm" variant="outline" className="text-[11px] py-1 px-2 text-rose-600 border-rose-200" onClick={() => onCancel(apt.id)}>
                          Cancel
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
