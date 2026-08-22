import React, { useState, useEffect } from 'react';
import { childApi } from '../../services/api/childApi';
import type { Child } from '../../types/child';
import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { AddObservationModal } from '../../components/behavior/AddObservationModal';
import { CreateReportModal } from '../../components/reports/CreateReportModal';
import { Activity, FileText } from 'lucide-react';

export const TherapistChildrenPage: React.FC = () => {
  const [childrenList, setChildrenList] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [isObservationOpen, setIsObservationOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);

  const fetchChildren = async () => {
    const list = await childApi.getAllChildren();
    setChildrenList(list);
    if (list.length > 0 && !selectedChild) setSelectedChild(list[0]);
  };

  useEffect(() => {
    fetchChildren();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Patient Directory</h1>
          <p className="text-xs text-slate-500">Access registered child files, screening scores, and parent notes</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Child list */}
        <div className="space-y-3">
          {childrenList.map((c) => (
            <div
              key={c.id}
              onClick={() => setSelectedChild(c)}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                selectedChild?.id === c.id
                  ? 'bg-teal-50/80 border-teal-500 shadow-xs ring-1 ring-teal-200'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <img
                  src={c.avatarUrl || 'https://images.unsplash.com/photo-1543332164-6e82f355badc?w=150'}
                  alt={c.name}
                  className="w-10 h-10 rounded-full object-cover border"
                />
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{c.name}</h4>
                  <p className="text-xs text-slate-500">Parent: {c.parentName}</p>
                </div>
              </div>
              <StatusBadge status={c.supportIndicator} type="support" />
            </div>
          ))}
        </div>

        {/* Selected Child Detail */}
        {selectedChild && (
          <div className="lg:col-span-2">
            <Card className="p-6 space-y-4">
              <div className="flex items-start gap-4 pb-4 border-b border-slate-100">
                <img
                  src={selectedChild.avatarUrl || 'https://images.unsplash.com/photo-1543332164-6e82f355badc?w=150'}
                  alt={selectedChild.name}
                  className="w-16 h-16 rounded-2xl object-cover border"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-900">{selectedChild.name}</h3>
                    <StatusBadge status={selectedChild.supportIndicator} type="support" />
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Age: {selectedChild.age} yrs • Gender: {selectedChild.gender} • Parent Contact: {selectedChild.parentName}
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs space-y-2">
                <h4 className="font-bold text-slate-800 uppercase tracking-wider">Parent Intake & Observations</h4>
                <p className="text-slate-600 leading-relaxed">{selectedChild.parentNotes || 'No notes provided.'}</p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <Button
                  size="sm"
                  variant="outline"
                  leftIcon={<Activity className="w-3.5 h-3.5" />}
                  onClick={() => setIsObservationOpen(true)}
                >
                  Log Behavior Observation
                </Button>
                <Button
                  size="sm"
                  leftIcon={<FileText className="w-3.5 h-3.5" />}
                  onClick={() => setIsReportOpen(true)}
                >
                  Publish Progress Evaluation
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>

      <AddObservationModal
        isOpen={isObservationOpen}
        onClose={() => setIsObservationOpen(false)}
        childrenList={childrenList}
        onSuccess={fetchChildren}
      />

      <CreateReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        childrenList={childrenList}
        onSuccess={fetchChildren}
      />
    </div>
  );
};
