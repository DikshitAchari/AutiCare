import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import { TimeSlotPicker } from './TimeSlotPicker';
import { useAppointments } from '../../context/AppointmentContext';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import type { Child } from '../../types/child';
import type { TherapistUser } from '../../types/user';

export interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  therapist: TherapistUser;
  childrenList: Child[];
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  therapist,
  childrenList
}) => {
  const { user } = useAuth();
  const { bookAppointment } = useAppointments();
  const { showToast } = useToast();

  const [childId, setChildId] = useState(childrenList[0]?.id || '');
  const [date, setDate] = useState(() => new Date(Date.now() + 86400000).toISOString().split('T')[0]);
  const [time, setTime] = useState('');
  const [appointmentType, setAppointmentType] = useState<'ONLINE' | 'IN_PERSON'>('ONLINE');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!childId) {
      showToast('Please select a child for the appointment', 'error');
      return;
    }
    if (!time) {
      showToast('Please select an available time slot', 'error');
      return;
    }

    const selectedChild = childrenList.find((c) => c.id === childId);
    if (!selectedChild || !user) return;

    setLoading(true);
    try {
      await bookAppointment({
        therapistId: therapist.id,
        therapistName: therapist.name,
        childId: selectedChild.id,
        childName: selectedChild.name,
        parentId: user.id,
        parentName: user.name,
        date,
        time,
        bookingSource: 'ONLINE',
        appointmentType,
        reason
      });

      showToast(`Appointment booked successfully with ${therapist.name} for ${date} at ${time}`, 'success');
      onClose();
    } catch (err: any) {
      showToast(err?.message || 'Failed to book appointment', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Book Appointment - ${therapist.name}`} maxWidth="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Select Child"
          value={childId}
          onChange={(e) => setChildId(e.target.value)}
          options={childrenList.map((c) => ({ label: `${c.name} (Age ${c.age})`, value: c.id }))}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Appointment Date
            </label>
            <input
              type="date"
              value={date}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => {
                setDate(e.target.value);
                setTime('');
              }}
              className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <Select
            label="Session Format"
            value={appointmentType}
            onChange={(e) => setAppointmentType(e.target.value as any)}
            options={[
              { label: 'Online Tele-Consultation', value: 'ONLINE' },
              { label: 'In-Person Clinic Visit', value: 'IN_PERSON' }
            ]}
          />
        </div>

        <TimeSlotPicker
          therapistId={therapist.id}
          date={date}
          selectedTime={time}
          onSelectTime={(t) => setTime(t)}
        />

        <Textarea
          label="Reason / Notes for Therapist"
          placeholder="Describe your child's recent behavior, goals, or specific concerns for this session..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
        />

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={loading} disabled={!time}>
            Confirm Appointment
          </Button>
        </div>
      </form>
    </Modal>
  );
};
