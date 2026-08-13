import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { childApi } from '../../services/mockApi/childApi';
import { therapistApi } from '../../services/mockApi/therapistApi';
import type { Child } from '../../types/child';
import type { TherapistUser } from '../../types/user';
import { useAppointments } from '../../context/AppointmentContext';
import { useNavigate } from 'react-router-dom';

import {
  Brain,
  Calendar,
  Plus,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Video,
  Award,
  CheckCircle2
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { VideoUploadModal } from '../../components/video/VideoUploadModal';

export const ParentDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { appointments } = useAppointments();

  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [topTherapists, setTopTherapists] = useState<TherapistUser[]>([]);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (user) {
        const children = await childApi.getChildrenByParent(user.id);
        if (children.length > 0) {
          setSelectedChild(children[0]);
        }
      }
      const therapists = await therapistApi.getTherapists();
      setTopTherapists(therapists.filter((t) => t.status === 'APPROVED').slice(0, 3));
    };
    loadData();
  }, [user]);

  const parentAppointments = appointments.filter((a) => a.parentId === user?.id);

  // Mock chart data for child milestone progression over time
  const progressChartData = [
    { month: 'Jan', social: 45, communication: 50, motor: 60 },
    { month: 'Feb', social: 52, communication: 55, motor: 64 },
    { month: 'Mar', social: 60, communication: 62, motor: 70 },
    { month: 'Apr', social: 68, communication: 70, motor: 75 },
    { month: 'May', social: 75, communication: 78, motor: 82 }
  ];

  return (
    <div className="space-y-6">
      {/* 1. Header with Role Accent & Add Child Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Parent Dashboard</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Track child screening outcomes, behavioral milestones, and appointments.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsVideoModalOpen(true)}
            className="px-4 py-2.5 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 border border-purple-200"
          >
            <Video className="w-4 h-4 text-purple-600" />
            <span>Upload Behavior Video</span>
          </button>
          <button
            onClick={() => navigate('/parent/assessment/new')}
            className="px-5 py-2.5 text-xs font-extrabold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-md shadow-purple-600/20 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Start AI Screening</span>
          </button>
        </div>
      </div>

      {/* 2. Stat Cards Row (Matching Reference Screen 2 & 3) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Card 1: Selected Child Info */}
        <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Selected Child</span>
            <Brain className="w-4 h-4 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900">{selectedChild?.name || 'Aarav Sharma'}</h3>
            <span className="text-xs text-slate-500 font-semibold">Age {selectedChild?.age || 4} yrs • Male</span>
          </div>
        </div>

        {/* Card 2: Screening Status */}
        <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Screening Status</span>
            <Award className="w-4 h-4 text-purple-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black text-slate-900">Moderate</span>
              <span className="text-[10px] font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">
                Risk
              </span>
            </div>
            <span className="text-xs text-slate-500 font-medium">Completed May 10</span>
          </div>
        </div>

        {/* Card 3: Next Session */}
        <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Next Session</span>
            <Calendar className="w-4 h-4 text-purple-600" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 truncate">
              {parentAppointments[0] ? `${parentAppointments[0].date} @ ${parentAppointments[0].time}` : 'May 14 @ 10:00 AM'}
            </h3>
            <span className="text-xs text-purple-600 font-semibold truncate block">
              {parentAppointments[0] ? parentAppointments[0].therapistName : 'Dr. Anjali Sharma'}
            </span>
          </div>
        </div>

        {/* Card 4: Milestones Index */}
        <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Progress Index</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">78%</span>
              <span className="text-[11px] font-bold text-emerald-600">+12% gain</span>
            </div>
            <span className="text-xs text-slate-500 font-medium">4 milestones met</span>
          </div>
        </div>
      </div>

      {/* 3. Recharts Behavioral Progression & Quick Action Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Behavioral Progress Chart (8 cols) */}
        <div className="lg:col-span-8 p-6 rounded-3xl bg-white border border-slate-100 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Developmental Progress Velocity</h3>
              <p className="text-xs text-slate-500 font-medium">Social interaction, communication & motor skills score tracking</p>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold text-slate-500">
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
                <span>Social</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                <span>Comm</span>
              </div>
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={progressChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSocial" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorComm" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', borderColor: '#f1f5f9', fontSize: '11px' }}
                />
                <Area type="monotone" dataKey="social" stroke="#a855f7" strokeWidth={3} fillOpacity={1} fill="url(#colorSocial)" />
                <Area type="monotone" dataKey="communication" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorComm)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick AI & Therapy Actions (4 cols) */}
        <div className="lg:col-span-4 p-6 rounded-3xl bg-white border border-slate-100 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-purple-600 font-extrabold text-sm">
              <Sparkles className="w-4 h-4" />
              <span>AI Screening & Care Suite</span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Complete standard behavioral questions or upload 30-sec video clips to receive personalized clinical recommendations.
            </p>

            <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-purple-900">
                <span>Recent Test Result</span>
                <span className="text-purple-600 font-extrabold">Moderate Risk</span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                4-domain evaluation suggests targeted occupational therapy.
              </p>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <button
              onClick={() => navigate('/parent/assessment/new')}
              className="w-full py-3 px-4 text-xs font-extrabold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-md shadow-purple-600/20 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Retake AI Screening</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsVideoModalOpen(true)}
              className="w-full py-2.5 px-4 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Video className="w-3.5 h-3.5 text-purple-600" />
              <span>Upload Video Observation</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Top Recommended Therapists Showcase (Matching Reference Screen 6) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Top Recommended Certified Therapists</h3>
            <p className="text-xs text-slate-500 font-medium">Verified specialists matching your child's developmental goals</p>
          </div>
          <button
            onClick={() => navigate('/parent/therapists')}
            className="text-xs font-extrabold text-purple-600 hover:text-purple-700 flex items-center gap-1 cursor-pointer"
          >
            <span>View All Therapists</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {topTherapists.map((therapist) => (
            <div key={therapist.id} className="p-5 rounded-3xl bg-white border border-slate-100 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
              <div>
                <div className="flex items-start gap-3 mb-3">
                  <img
                    src={therapist.avatarUrl || 'https://images.unsplash.com/photo-1594824813566-88855ce78341?w=150'}
                    alt={therapist.name}
                    className="w-14 h-14 rounded-2xl object-cover border border-purple-100 shrink-0"
                  />
                  <div>
                    <div className="flex items-center gap-1">
                      <h4 className="text-sm font-extrabold text-slate-900">{therapist.name}</h4>
                      <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
                    </div>
                    <p className="text-xs text-purple-600 font-semibold">{therapist.title}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
                      ⭐ {therapist.rating} ({therapist.reviewsCount}) • {therapist.experienceYears} yrs Exp
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 mb-4">
                  {therapist.specializations.slice(0, 2).map((spec) => (
                    <span key={spec} className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-700 rounded-md">
                      {spec}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <span className="text-xs font-extrabold text-slate-900">₹{therapist.hourlyRate || 1200} / session</span>
                <button
                  onClick={() => navigate('/parent/therapists')}
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-all cursor-pointer shadow-sm"
                >
                  Book Slot
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <VideoUploadModal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
      />
    </div>
  );
};
