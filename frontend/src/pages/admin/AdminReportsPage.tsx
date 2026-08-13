import React, { useState, useEffect } from 'react';
import { reportApi } from '../../services/mockApi/reportApi';
import type { ClinicalReport } from '../../types/report';
import { Button } from '../../components/ui/Button';
import { FileText, Download, TrendingUp, Users, Calendar, Award } from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

export const AdminReportsPage: React.FC = () => {
  const [reports, setReports] = useState<ClinicalReport[]>([]);

  useEffect(() => {
    reportApi.getAllReports().then(setReports);
  }, []);

  const pieData = [
    { name: 'Low Risk', value: 35, color: '#10b981' },
    { name: 'Moderate Risk', value: 45, color: '#f59e0b' },
    { name: 'High Risk', value: 20, color: '#ef4444' }
  ];

  const barData = [
    { month: 'Jan', count: 18 },
    { month: 'Feb', count: 24 },
    { month: 'Mar', count: 32 },
    { month: 'Apr', count: 40 },
    { month: 'May', count: 34 }
  ];

  return (
    <div className="space-y-6">
      {/* 1. Header (Matching Screen 10) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Reports & Analytics</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Detailed insights on system usage, screening outcomes, and appointment stats.
          </p>
        </div>
        <Button
          variant="outline"
          leftIcon={<Download className="w-4 h-4" />}
          className="rounded-xl border-slate-200"
        >
          Export Full CSV
        </Button>
      </div>

      {/* 2. Stat Summaries (Horizontal Row matching Screen 10) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Screenings</span>
            <FileText className="w-4 h-4 text-purple-600" />
          </div>
          <div>
            <span className="text-2xl font-black text-slate-900">89</span>
            <span className="text-[11px] font-bold text-emerald-600 block mt-0.5">+12% this month</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Avg Progress Score</span>
            <TrendingUp className="w-4 h-4 text-purple-600" />
          </div>
          <div>
            <span className="text-2xl font-black text-slate-900">76%</span>
            <span className="text-[11px] font-bold text-slate-400 block mt-0.5">Clinical index</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Appointments</span>
            <Calendar className="w-4 h-4 text-purple-600" />
          </div>
          <div>
            <span className="text-2xl font-black text-slate-900">34</span>
            <span className="text-[11px] font-bold text-purple-600 block mt-0.5">Active this month</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active Therapists</span>
            <Users className="w-4 h-4 text-purple-600" />
          </div>
          <div>
            <span className="text-2xl font-black text-slate-900">12</span>
            <span className="text-[11px] font-bold text-slate-400 block mt-0.5">Verified clinicians</span>
          </div>
        </div>
      </div>

      {/* 3. Two-Column Analytics Charts (Matching Screen 10) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT: Screening Outcome Risk Distribution (Pie Chart) */}
        <div className="lg:col-span-5 p-6 rounded-3xl bg-white border border-slate-100 shadow-xs flex flex-col justify-between">
          <h3 className="text-sm font-extrabold text-slate-900 mb-2">Risk Level Distribution</h3>
          <div className="relative h-48 my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-center gap-4 text-[11px] font-semibold text-slate-600">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Low (35%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>Moderate (45%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span>High (20%)</span>
            </div>
          </div>
        </div>

        {/* RIGHT: Monthly Appointment Volume (Bar Chart) */}
        <div className="lg:col-span-7 p-6 rounded-3xl bg-white border border-slate-100 shadow-xs">
          <h3 className="text-sm font-extrabold text-slate-900 mb-4">Monthly Appointment Volume</h3>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', borderColor: '#f1f5f9', fontSize: '11px' }}
                />
                <Bar dataKey="count" name="Appointments" fill="#a855f7" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 4. Cross-Therapist Clinical Progress Audit Table */}
      <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-xs space-y-4">
        <h3 className="text-base font-extrabold text-slate-900">Clinical Progress Reports Log</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 font-extrabold uppercase text-[10px] text-slate-400">
                <th className="py-3 px-4">Report Title</th>
                <th className="py-3 px-4">Patient Child</th>
                <th className="py-3 px-4">Authoring Therapist</th>
                <th className="py-3 px-4">Progress Index</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reports.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400 font-medium">
                    No clinical progress reports recorded yet.
                  </td>
                </tr>
              ) : (
                reports.map((r) => (
                  <tr key={r.id} className="hover:bg-purple-50/20 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{r.title}</td>
                    <td className="py-3.5 px-4 text-slate-700 font-medium">{r.childName}</td>
                    <td className="py-3.5 px-4 text-purple-600 font-semibold">{r.therapistName}</td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
                        <Award className="w-3 h-3 text-purple-600" /> {r.overallProgressScore} / 100
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-medium">{r.date}</td>
                    <td className="py-3.5 px-4 text-right">
                      <button className="px-3 py-1.5 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1">
                        <Download className="w-3 h-3" /> PDF
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
