import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import { behaviorApi } from '../../services/mockApi/behaviorApi';
import { useToast } from '../../context/ToastContext';
import type { Child } from '../../types/child';

export interface AddObservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  childrenList: Child[];
  onSuccess: () => void;
}

export const AddObservationModal: React.FC<AddObservationModalProps> = ({
  isOpen,
  onClose,
  childrenList,
  onSuccess
}) => {
  const { showToast } = useToast();

  const [childId, setChildId] = useState(childrenList[0]?.id || '');
  const [behaviorTitle, setBehaviorTitle] = useState('');
  const [category, setCategory] = useState<'Communication' | 'Social' | 'Sensory' | 'Repetitive' | 'Emotional'>('Sensory');
  const [frequency, setFrequency] = useState(1);
  const [severity, setSeverity] = useState<'MILD' | 'MODERATE' | 'SEVERE'>('MODERATE');
  const [trigger, setTrigger] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!behaviorTitle) {
      showToast('Please specify behavior title', 'error');
      return;
    }

    setLoading(true);
    try {
      await behaviorApi.addBehaviorLog({
        childId,
        date: new Date().toISOString().split('T')[0],
        behaviorTitle,
        category,
        frequency,
        severity,
        trigger,
        notes
      });

      showToast('Behavior observation logged successfully!', 'success');
      onSuccess();
      onClose();
    } catch (err: any) {
      showToast(err?.message || 'Failed to record behavior log', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="+ Log Behavioral Observation" maxWidth="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Child Patient"
          value={childId}
          onChange={(e) => setChildId(e.target.value)}
          options={childrenList.map((c) => ({ label: c.name, value: c.id }))}
        />

        <Input
          label="Observed Behavior Title"
          placeholder="e.g. Hand flapping during loud music, Eye contact avoidance"
          value={behaviorTitle}
          onChange={(e) => setBehaviorTitle(e.target.value)}
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Select
            label="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value as any)}
            options={[
              { label: 'Sensory', value: 'Sensory' },
              { label: 'Communication', value: 'Communication' },
              { label: 'Social Interaction', value: 'Social' },
              { label: 'Repetitive Action', value: 'Repetitive' },
              { label: 'Emotional Regulator', value: 'Emotional' }
            ]}
          />

          <Input
            label="Occurrences Count"
            type="number"
            min={1}
            value={frequency}
            onChange={(e) => setFrequency(Number(e.target.value))}
          />

          <Select
            label="Severity Level"
            value={severity}
            onChange={(e) => setSeverity(e.target.value as any)}
            options={[
              { label: 'Mild', value: 'MILD' },
              { label: 'Moderate', value: 'MODERATE' },
              { label: 'Severe', value: 'SEVERE' }
            ]}
          />
        </div>

        <Input
          label="Perceived Trigger / Antecedent"
          placeholder="e.g. Sudden transition to dinner time, Overcrowded room noise"
          value={trigger}
          onChange={(e) => setTrigger(e.target.value)}
        />

        <Textarea
          label="Contextual Clinical Notes"
          placeholder="Describe coping strategy used, duration of event, and outcome..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
        />

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={loading}>
            Save Log
          </Button>
        </div>
      </form>
    </Modal>
  );
};
