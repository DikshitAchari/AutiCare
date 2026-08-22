import React, { useState, useEffect } from 'react';
import { behaviorApi } from '../../services/mockApi/behaviorApi';
import { childApi } from '../../services/api/childApi';
import type { BehaviorLog } from '../../types/behavior';
import type { Child } from '../../types/child';
import { BehaviorChart } from '../../components/behavior/BehaviorChart';
import { AddObservationModal } from '../../components/behavior/AddObservationModal';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Plus } from 'lucide-react';

export const BehaviorAnalysisPage: React.FC = () => {
  const [childrenList, setChildrenList] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState('');
  const [logs, setLogs] = useState<BehaviorLog[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const loadData = async () => {
    const allChildren = await childApi.getAllChildren();
    setChildrenList(allChildren);
    const childId = selectedChildId || allChildren[0]?.id;
    if (childId) {
      setSelectedChildId(childId);
      const childLogs = await behaviorApi.getLogsByChild(childId);
      setLogs(childLogs);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedChildId]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Behavior Analysis & Progress Metrics</h1>
          <p className="text-xs text-slate-500">Track behavior frequency trends, triggers, and severity over time</p>
        </div>

        <Button onClick={() => setIsAddModalOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
          + Log Observation Entry
        </Button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between gap-4">
        <div className="w-full sm:w-72">
          <Select
            label="Select Patient Child"
            value={selectedChildId}
            onChange={(e) => setSelectedChildId(e.target.value)}
            options={childrenList.map((c) => ({ label: `${c.name} (Age ${c.age})`, value: c.id }))}
          />
        </div>
      </div>

      <BehaviorChart logs={logs} />

      <Card className="p-6">
        <h3 className="text-sm font-bold text-slate-900 border-b pb-3 mb-4">Recorded Observation Logs</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 font-bold uppercase text-[10px] text-slate-600">
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Observed Behavior</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Occurrences</th>
                <th className="py-2.5 px-3">Severity</th>
                <th className="py-2.5 px-3">Trigger / Antecedent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400">
                    No behavior observations logged for this child.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const title = log.behaviorTitle || log.behaviorDescription || log.observation || 'Observed behavior';
                  const cat = log.category || log.behaviorCategory || 'Sensory';
                  const freq = log.frequency ?? log.frequencyCount ?? 1;
                  const sev = log.severity || log.intensityLevel || 'MODERATE';
                  const isLow = sev === 'Low' || sev === 'MILD' || sev === 'LOW';
                  const isMod = sev === 'Moderate' || sev === 'MODERATE';
                  const trig = log.trigger || log.triggerAntecedent || 'N/A';

                  return (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{log.date}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">{title}</td>
                      <td className="py-2.5 px-3">{cat}</td>
                      <td className="py-2.5 px-3 font-semibold">{freq} times</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isLow
                              ? 'bg-emerald-100 text-emerald-700'
                              : isMod
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {sev}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 italic">{trig}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <AddObservationModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        childrenList={childrenList}
        onSuccess={loadData}
      />
    </div>
  );
};
