import React from 'react';
import type { Appointment } from '../../types/appointment';
import { StatusBadge } from '../ui/StatusBadge';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Calendar, Clock, User, Video, MapPin, XCircle, CheckCircle } from 'lucide-react';

export interface AppointmentCardProps {
  appointment: Appointment;
  onCancel?: (id: string) => void;
  onApprove?: (id: string) => void;
  userRole: 'PARENT' | 'THERAPIST' | 'ADMIN';
}

export const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
  onCancel,
  onApprove,
  userRole
}) => {
  return (
    <Card hoverable className="relative flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
            {appointment.appointmentType === 'ONLINE' ? (
              <span className="inline-flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                <Video className="w-3 h-3" /> Online Session
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100">
                <MapPin className="w-3 h-3" /> In-Person Clinic
              </span>
            )}
            {appointment.bookingSource === 'OFFLINE' && (
              <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-1.5 py-0.5 rounded-md">
                OFFLINE LOCK
              </span>
            )}
          </div>
          <StatusBadge status={appointment.status} type="appointment" />
        </div>

        <h4 className="text-base font-bold text-slate-900 mb-1">
          {userRole === 'PARENT' ? appointment.therapistName : appointment.childName}
        </h4>

        <p className="text-xs text-slate-500 mb-3 flex items-center gap-1.5">
          <User className="w-3.5 h-3.5 text-slate-400" />
          {userRole === 'PARENT' ? `Patient: ${appointment.childName}` : `Parent: ${appointment.parentName}`}
        </p>

        <div className="flex items-center gap-4 text-xs font-semibold text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100 mb-3">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <span>{appointment.date}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span>{appointment.time}</span>
          </div>
        </div>

        {appointment.reason && (
          <p className="text-xs text-slate-600 italic bg-slate-50/50 p-2 rounded-md line-clamp-2 mb-3">
            "{appointment.reason}"
          </p>
        )}
      </div>

      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 mt-2">
        {appointment.status === 'PENDING' && userRole === 'THERAPIST' && onApprove && (
          <Button size="sm" variant="success" leftIcon={<CheckCircle className="w-3.5 h-3.5" />} onClick={() => onApprove(appointment.id)}>
            Accept Request
          </Button>
        )}
        {appointment.status !== 'CANCELLED' && appointment.status !== 'COMPLETED' && onCancel && (
          <Button size="sm" variant="outline" className="text-rose-600 border-rose-200 hover:bg-rose-50" leftIcon={<XCircle className="w-3.5 h-3.5" />} onClick={() => onCancel(appointment.id)}>
            Cancel Session
          </Button>
        )}
      </div>
    </Card>
  );
};
