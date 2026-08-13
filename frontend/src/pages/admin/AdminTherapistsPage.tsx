import React, { useState, useEffect } from 'react';
import { therapistApi } from '../../services/mockApi/therapistApi';
import type { TherapistUser } from '../../types/user';
import { useToast } from '../../context/ToastContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Tabs } from '../../components/ui/Tabs';

export const AdminTherapistsPage: React.FC = () => {
  const { showToast } = useToast();
  const [therapists, setTherapists] = useState<TherapistUser[]>([]);
  const [statusTab, setStatusTab] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'SUSPENDED'>('ALL');

  const loadTherapists = async () => {
    const list = await therapistApi.getTherapists();
    setTherapists(list);
  };

  useEffect(() => {
    loadTherapists();
  }, []);

  const filtered = therapists.filter((t) => (statusTab === 'ALL' ? true : t.status === statusTab));

  const handleStatusChange = async (id: string, newStatus: TherapistUser['status']) => {
    try {
      await therapistApi.updateTherapistStatus(id, newStatus);
      showToast(`Therapist status updated to ${newStatus}`, 'success');
      loadTherapists();
    } catch (err: any) {
      showToast(err?.message || 'Failed to update therapist', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Therapists Management & Verifications</h1>
          <p className="text-xs text-slate-500">Audit therapist applications, document checks, and status privileges</p>
        </div>

        <Tabs
          tabs={[
            { id: 'ALL', label: 'All Therapists' },
            { id: 'PENDING', label: 'Pending Approval', badge: therapists.filter((t) => t.status === 'PENDING').length },
            { id: 'APPROVED', label: 'Approved & Listed' },
            { id: 'SUSPENDED', label: 'Suspended' }
          ]}
          activeTab={statusTab}
          onChange={(tab) => setStatusTab(tab as any)}
          variant="pills"
        />
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 font-bold uppercase text-[10px] text-slate-600">
                <th className="py-3 px-4">Therapist Profile</th>
                <th className="py-3 px-4">Specializations</th>
                <th className="py-3 px-4">Experience</th>
                <th className="py-3 px-4">Rating</th>
                <th className="py-3 px-4">Verification Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <img src={t.avatarUrl} alt={t.name} className="w-9 h-9 rounded-full object-cover border" />
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{t.name}</h4>
                        <p className="text-[11px] text-slate-500">{t.email} • {t.location}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 font-medium">
                    {t.specializations.join(', ')}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-800">{t.experienceYears} Years</td>
                  <td className="py-3.5 px-4 font-bold text-amber-600">★ {t.rating}</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        t.status === 'APPROVED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : t.status === 'PENDING'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {t.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {t.status !== 'APPROVED' && (
                        <Button size="sm" variant="success" className="text-[11px] py-1 px-2" onClick={() => handleStatusChange(t.id, 'APPROVED')}>
                          Approve
                        </Button>
                      )}
                      {t.status !== 'SUSPENDED' && (
                        <Button size="sm" variant="danger" className="text-[11px] py-1 px-2" onClick={() => handleStatusChange(t.id, 'SUSPENDED')}>
                          Suspend
                        </Button>
                      )}
                    </div>
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
