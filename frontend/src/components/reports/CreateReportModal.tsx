import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import { reportApi } from '../../services/mockApi/reportApi';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import type { Child } from '../../types/child';

export interface CreateReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  childrenList: Child[];
  onSuccess: () => void;
}

export const CreateReportModal: React.FC<CreateReportModalProps> = ({
  isOpen,
  onClose,
  childrenList,
  onSuccess
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [childId, setChildId] = useState(childrenList[0]?.id || '');
  const [title, setTitle] = useState('');
  const [goalsAchieved, setGoalsAchieved] = useState('');
  const [observations, setObservations] = useState('');
  const [nextMilestones, setNextMilestones] = useState('');
  const [overallScore, setOverallScore] = useState(80);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (childrenList.length > 0 && (!childId || !childrenList.some((c) => c.id === childId))) {
      setChildId(childrenList[0].id);
    }
  }, [childrenList, childId, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) {
      showToast('Please enter report title', 'error');
      return;
    }

    const selectedChild = childrenList.find((c) => c.id === childId) || childrenList[0];
    if (!selectedChild || !user) {
      showToast('Please select a valid child patient', 'error');
      return;
    }

    setLoading(true);
    try {
      await reportApi.createReport({
        childId: selectedChild.id,
        childName: selectedChild.name,
        therapistId: user.id,
        therapistName: user.name,
        date: new Date().toISOString().split('T')[0],
        title,
        goalsAchieved: goalsAchieved.split('\n').map((s) => s.trim()).filter(Boolean),
        observations,
        nextMilestones: nextMilestones.split('\n').map((s) => s.trim()).filter(Boolean),
        overallProgressScore: overallScore
      });

      showToast(`Clinical Therapy Report generated for ${selectedChild.name}!`, 'success');
      onSuccess();
      onClose();
    } catch (err: any) {
      showToast(err?.message || 'Failed to create report', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="+ Generate Therapy Progress Report" maxWidth="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Select Patient Child"
          value={childId}
          onChange={(e) => setChildId(e.target.value)}
          options={childrenList.map((c) => ({ label: c.name, value: c.id }))}
        />

        <Input
          label="Report Title"
          placeholder="e.g. Q3 Comprehensive Speech & Sensory Milestone Evaluation"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Textarea
            label="Key Goals Achieved (One per line)"
            placeholder="Maintained 5-min joint attention&#10;Responded to non-verbal cues&#10;Reduced sensory meltdown frequency"
            value={goalsAchieved}
            onChange={(e) => setGoalsAchieved(e.target.value)}
            rows={4}
          />

          <Textarea
            label="Next Quarter Milestones (One per line)"
            placeholder="Engage in peer turn-taking&#10;Expand 2-word verbal requests&#10;Self-regulate in noisy environments"
            value={nextMilestones}
            onChange={(e) => setNextMilestones(e.target.value)}
            rows={4}
          />
        </div>

        <Textarea
          label="Clinical Observations Summary"
          placeholder="Detailed synthesis of child's responsiveness to occupational / speech interventions..."
          value={observations}
          onChange={(e) => setObservations(e.target.value)}
          rows={3}
        />

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Overall Progress Index Score ({overallScore} / 100)
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={overallScore}
            onChange={(e) => setOverallScore(Number(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={loading}>
            Publish Clinical Report
          </Button>
        </div>
      </form>
    </Modal>
  );
};
