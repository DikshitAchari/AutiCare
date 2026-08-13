import React, { useState, useEffect } from 'react';
import { storageService } from '../../services/storage/storageService';
import type { ParentUser } from '../../types/user';
import { Card } from '../../components/ui/Card';

export const AdminParentsPage: React.FC = () => {
  const [parents, setParents] = useState<ParentUser[]>([]);

  useEffect(() => {
    setParents(storageService.getParents());
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Registered Parent Accounts</h1>
        <p className="text-xs text-slate-500">Global ledger of parent profiles and registered children</p>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 font-bold uppercase text-[10px] text-slate-600">
                <th className="py-3 px-4">Parent Profile</th>
                <th className="py-3 px-4">Contact Phone</th>
                <th className="py-3 px-4">Location Address</th>
                <th className="py-3 px-4">Children Count</th>
                <th className="py-3 px-4">Joined Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {parents.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    {p.name}
                    <span className="block text-[11px] text-slate-400 font-normal">{p.email}</span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 font-medium">{p.phone || 'N/A'}</td>
                  <td className="py-3.5 px-4 text-slate-600">{p.address || 'N/A'}</td>
                  <td className="py-3.5 px-4 font-bold text-blue-600">{p.childrenIds.length} Child(ren)</td>
                  <td className="py-3.5 px-4 text-slate-500">{p.joinedDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
