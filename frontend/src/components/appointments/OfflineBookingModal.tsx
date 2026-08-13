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

export interface OfflineBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  childrenList: Child[];
}

export const OfflineBookingModal: React.FC<OfflineBookingModalProps> = ({
  isOpen,
  onClose,
  childrenList
}) => {
  const { user } = useAuth();
  const { bookAppointment } = useAppointments();
  const { showToast } = useToast();

  const [childId, setChildId] = useState(childrenList[0]?.id || '');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('');
  const [appointmentType, setAppointmentType] = useState<'ONLINE' | 'IN_PERSON'>('IN_PERSON');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!childId) {
      showToast('Please select a child', 'error');
      return;
    }
    if (!time) {
      showToast('Please select an available slot', 'error');
      return;
    }

    const selectedChild = childrenList.find((c) => c.id === childId);
    if (!selectedChild || !user) return;

    setLoading(true);
    try {
      await bookAppointment({
        therapistId: user.id,
        therapistName: user.name,
        childId: selectedChild.id,
        childName: selectedChild.name,
        parentId: selectedChild.parentId,
        parentName: selectedChild.parentName,
        date,
        time,
        bookingSource: 'OFFLINE',
        appointmentType,
        notes,
        reason: 'Clinic scheduled session (Offline)'
      });

      showToast(`Offline slot locked successfully for ${selectedChild.name} on ${date} at ${time}. Parents can no longer book this slot.`, 'success');
      onClose();
    } catch (err: any) {
      showToast(err?.message || 'Slot conflict or booking error', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="+ Add Offline / Clinic Appointment" maxWidth="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3 text-xs text-amber-900 leading-relaxed mb-2">
          <strong>Offline Lock Notice:</strong> Creating an offline clinic appointment immediately reserves this slot in the shared schedule matrix. Parents viewing your profile online will see this slot as <em>"Already Booked"</em>.
        </div>

        <Select
          label="Select Patient Child"
          value={childId}
          onChange={(e) => setChildId(e.target.value)}
          options={childrenList.map((c) => ({ label: `${c.name} (Parent: ${c.parentName})`, value: c.id }))}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Appointment Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setTime('');
              }}
              className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <Select
            label="Location Format"
            value={appointmentType}
            onChange={(e) => setAppointmentType(e.target.value as any)}
            options={[
              { label: 'In-Person Clinic Visit', value: 'IN_PERSON' },
              { label: 'Online Tele-Session', value: 'ONLINE' }
            ]}
          />
        </div>

        {user && (
          <TimeSlotPicker
            therapistId={user.id}
            date={date}
            selectedTime={time}
            onSelectTime={(t) => setTime(t)}
          />
        )}

        <Textarea
          label="Internal Clinical Notes"
          placeholder="Session objectives, targeted behaviors, or equipment setup notes..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
        />

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="success" isLoading={loading} disabled={!time}>
            Lock Slot & Confirm
          </Button>
        </div>
      </form>
    </Modal>
  );
};
