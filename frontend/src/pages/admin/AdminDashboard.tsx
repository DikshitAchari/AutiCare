import React, { useState, useEffect } from 'react';
import { therapistApi } from '../../services/mockApi/therapistApi';
import type { TherapistUser } from '../../types/user';
import { useAppointments } from '../../context/AppointmentContext';
import { useToast } from '../../context/ToastContext';
import { Users, AlertCircle, FileCheck, Calendar, CheckCircle2, XCircle, FileText } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export const AdminDashboard: React.FC = () => {
  const { showToast } = useToast();
  const { appointments } = useAppointments();

  const [therapists, setTherapists] = useState<TherapistUser[]>([]);

  const loadData = async () => {
    const data = await therapistApi.getTherapists();
    setTherapists(data);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApprove = async (id: string, name: string) => {
    await therapistApi.updateTherapistStatus(id, 'APPROVED');
    showToast(`Therapist ${name} verified & approved!`, 'success');
    loadData();
  };

  const handleReject = async (id: string, name: string) => {
    await therapistApi.updateTherapistStatus(id, 'REJECTED');
    showToast(`Therapist ${name} application rejected`, 'warning');
    loadData();
  };

  const pendingTherapists = therapists.filter((t) => t.status === 'PENDING');

  const activityData = [
    { month: 'Jan', screenings: 45, appointments: 28 },
    { month: 'Feb', screenings: 58, appointments: 35 },
    { month: 'Mar', screenings: 65, appointments: 42 },
    { month: 'Apr', screenings: 78, appointments: 50 },
    { month: 'May', screenings: 89, appointments: 34 }
  ];

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Admin Dashboard</h1>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          Manage users, verify therapist credentials, and monitor platform activity.
        </p>
      </div>

      {/* 2. 4 Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Users</span>
            <Users className="w-4 h-4 text-purple-600" />
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">142</span>
              <span className="text-[11px] font-bold text-slate-400">Parents & Clinicians</span>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Pending Approvals</span>
            <AlertCircle className="w-4 h-4 text-amber-500" />
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{pendingTherapists.length || 3}</span>
              <span className="text-[11px] font-bold text-amber-600">Verification Req.</span>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Screenings</span>
            <FileCheck className="w-4 h-4 text-purple-600" />
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">89</span>
              <span className="text-[11px] font-bold text-slate-400">Completed</span>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active Appointments</span>
            <Calendar className="w-4 h-4 text-purple-600" />
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{appointments.length || 34}</span>
              <span className="text-[11px] font-bold text-emerald-600">Synchronized</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Pending Therapist Credential Verification Queue */}
      <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Pending Therapist Verification Queue</h3>
            <p className="text-xs text-slate-500 font-medium">Verify credentials before granting public directory listing</p>
          </div>
        </div>

        {pendingTherapists.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400 font-medium">
            No therapist onboarding requests pending audit.
          </div>
        ) : (
          <div className="space-y-3">
            {pendingTherapists.map((t) => (
              <div
                key={t.id}
                className="p-4 rounded-2xl border border-amber-200 bg-amber-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={t.avatarUrl || 'https://images.unsplash.com/photo-1594824813566-88855ce78341?w=150'}
                    alt={t.name}
                    className="w-12 h-12 rounded-2xl object-cover border border-amber-200"
                  />
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900">{t.name}</h4>
                    <p className="text-xs font-semibold text-purple-600">{t.title} • {t.location}</p>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                      <span className="font-bold text-slate-700">{t.experienceYears} yrs Exp</span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-slate-600">
                        <FileText className="w-3 h-3 text-purple-600" /> Degree.pdf, License.pdf
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleReject(t.id, t.name)}
                    className="px-4 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>
                  <button
                    onClick={() => handleApprove(t.id, t.name)}
                    className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-600/20 transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approve Credentials</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. System Activity & Metrics Chart */}
      <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-xs space-y-4">
        <h3 className="text-base font-extrabold text-slate-900">Platform Monthly Activity & Volume</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', borderColor: '#f1f5f9', fontSize: '11px' }}
              />
              <Bar dataKey="screenings" name="AI Screenings" fill="#6366f1" radius={[6, 6, 0, 0]} />
              <Bar dataKey="appointments" name="Appointments Booked" fill="#a855f7" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
