import React from 'react';
import type { Child } from '../../types/child';
import { Card } from '../ui/Card';
import { StatusBadge } from '../ui/StatusBadge';
import { Button } from '../ui/Button';
import { User, UserCheck, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export interface ChildCardProps {
  child: Child;
  onView?: () => void;
}

export const ChildCard: React.FC<ChildCardProps> = ({ child, onView }) => {
  const navigate = useNavigate();

  return (
    <Card hoverable className="flex flex-col justify-between">
      <div>
        <div className="flex items-start gap-3.5 mb-4">
          <img
            src={child.avatarUrl || 'https://images.unsplash.com/photo-1543332164-6e82f355badc?w=150'}
            alt={child.name}
            className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-2xs"
          />
          <div className="flex-1 min-w-0">
            <h4 className="text-base font-bold text-slate-900 truncate">{child.name}</h4>
            <p className="text-xs text-slate-500 font-medium">
              Age: {child.age} yrs • {child.gender}
            </p>
            {child.school && <p className="text-[11px] text-slate-400 truncate">{child.school}</p>}
          </div>
        </div>

        <div className="space-y-2 mb-4 bg-slate-50/80 p-3 rounded-xl border border-slate-100">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-500" /> Screening Indicator:
            </span>
            <StatusBadge status={child.supportIndicator} type="support" />
          </div>

          <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-200/60">
            <span className="text-slate-500 font-medium flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 text-blue-500" /> Therapy Status:
            </span>
            <StatusBadge status={child.therapyStatus} type="therapy" />
          </div>
        </div>

        {child.assignedTherapistName ? (
          <p className="text-xs text-slate-600 mb-3 flex items-center gap-1.5 font-medium">
            <User className="w-3.5 h-3.5 text-teal-600" />
            Therapist: <span className="text-slate-900 font-semibold">{child.assignedTherapistName}</span>
          </p>
        ) : (
          <p className="text-xs text-slate-400 italic mb-3">No assigned therapist yet</p>
        )}
      </div>

      <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
        <Button
          size="sm"
          variant="outline"
          onClick={onView || (() => navigate(`/parent/children`))}
        >
          View Profile
        </Button>
      </div>
    </Card>
  );
};
