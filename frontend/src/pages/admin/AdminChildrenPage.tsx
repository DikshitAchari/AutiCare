import React, { useState, useEffect } from 'react';
import { childApi } from '../../services/api/childApi';
import type { Child } from '../../types/child';
import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';

export const AdminChildrenPage: React.FC = () => {
  const [childrenList, setChildrenList] = useState<Child[]>([]);

  useEffect(() => {
    childApi.getAllChildren().then(setChildrenList);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">System Registered Children</h1>
        <p className="text-xs text-slate-500">Cross-portal ledger of all child patient profiles and therapy statuses</p>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 font-bold uppercase text-[10px] text-slate-600">
                <th className="py-3 px-4">Child Profile</th>
                <th className="py-3 px-4">Parent</th>
                <th className="py-3 px-4">Age / Gender</th>
                <th className="py-3 px-4">Support Indicator</th>
                <th className="py-3 px-4">Therapy Status</th>
                <th className="py-3 px-4">Assigned Therapist</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {childrenList.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="py-3.5 px-4 font-bold text-slate-900">{c.name}</td>
                  <td className="py-3.5 px-4 font-medium text-slate-700">{c.parentName}</td>
                  <td className="py-3.5 px-4 text-slate-600">{c.age} yrs ({c.gender})</td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={c.supportIndicator} type="support" />
                  </td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={c.therapyStatus} type="therapy" />
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-800">
                    {c.assignedTherapistName || 'Unassigned'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
