import React, { useState, useEffect } from 'react';
import { reportApi } from '../../services/mockApi/reportApi';
import { childApi } from '../../services/mockApi/childApi';
import type { ClinicalReport } from '../../types/report';
import type { Child } from '../../types/child';
import { CreateReportModal } from '../../components/reports/CreateReportModal';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../context/ToastContext';
import { FileText, Plus, CheckCircle, Target, Award, Sparkles, Send } from 'lucide-react';

export const TherapistReportsPage: React.FC = () => {
  const { showToast } = useToast();
  const [reports, setReports] = useState<ClinicalReport[]>([]);
  const [childrenList, setChildrenList] = useState<Child[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Form state for observation entry matching Screen 8
  const [selectedChildId, setSelectedChildId] = useState('');
  const [behaviorType, setBehaviorType] = useState('Social Interaction');
  const [frequencyIndex, setFrequencyIndex] = useState(7);
  const [observationNotes, setObservationNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const loadData = async () => {
    const rList = await reportApi.getAllReports();
    setReports(rList);
    const cList = await childApi.getAllChildren();
    setChildrenList(cList);
    if (cList.length > 0 && !selectedChildId) {
      setSelectedChildId(cList[0].id);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleQuickObservationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!observationNotes.trim()) {
      showToast('Please enter observation notes', 'warning');
      return;
    }
    const selectedChild = childrenList.find((c) => c.id === selectedChildId);
    if (!selectedChild) return;

    setIsSaving(true);
    try {
      await reportApi.createReport({
        childId: selectedChild.id,
        childName: selectedChild.name,
        therapistId: 'therapist-1',
        therapistName: 'Dr. Anjali Sharma',
        date: new Date().toISOString().split('T')[0],
        title: `${behaviorType} Clinical Observation`,
        goalsAchieved: [`Demonstrated improved ${behaviorType.toLowerCase()}`],
        observations: observationNotes,
        nextMilestones: ['Continue weekly session tracking'],
        overallProgressScore: frequencyIndex * 10
      });
      showToast(`Behavior observation entry submitted for ${selectedChild.name}!`, 'success');
      setObservationNotes('');
      loadData();
    } catch (err: any) {
      showToast('Failed to record entry', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Behavior & Progress Reports</h1>
          <p className="text-xs text-slate-500 font-medium">Log clinical observations, behavior notes & publish progress evaluations</p>
        </div>

        <Button
          onClick={() => setIsCreateOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md shadow-purple-600/20"
        >
          + Detailed Progress Evaluation
        </Button>
      </div>

      {/* Observation Entry Form Card (Matching Screen 8 Layout) */}
      <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <h2 className="text-sm font-extrabold text-slate-900">Observation Entry Form</h2>
        </div>

        <form onSubmit={handleQuickObservationSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Select Patient Child</label>
              <select
                value={selectedChildId}
                onChange={(e) => setSelectedChildId(e.target.value)}
                className="w-full text-xs font-bold bg-white text-slate-800 rounded-xl p-2.5 border border-slate-200 focus:outline-none"
              >
                {childrenList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} (Age {c.age})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Behavior Domain Category</label>
              <select
                value={behaviorType}
                onChange={(e) => setBehaviorType(e.target.value)}
                className="w-full text-xs font-bold bg-white text-slate-800 rounded-xl p-2.5 border border-slate-200 focus:outline-none"
              >
                <option value="Social Interaction">Social Interaction</option>
                <option value="Communication">Communication & Speech</option>
                <option value="Repetitive Behavior">Repetitive Behavior</option>
                <option value="Emotional Regulation">Emotional Regulation</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                Responsiveness Index ({frequencyIndex} / 10)
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={frequencyIndex}
                onChange={(e) => setFrequencyIndex(Number(e.target.value))}
                className="w-full h-2.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-purple-600 mt-2"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Clinical Observation Notes</label>
            <textarea
              rows={3}
              value={observationNotes}
              onChange={(e) => setObservationNotes(e.target.value)}
              placeholder="Child demonstrated improved eye contact during 15-minute therapy session. Responded positively to non-verbal cues..."
              className="w-full text-xs font-medium bg-slate-50 text-slate-800 rounded-2xl p-3 border border-slate-200 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setObservationNotes('')}
              className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Clear
            </button>
            <Button
              type="submit"
              isLoading={isSaving}
              leftIcon={<Send className="w-3.5 h-3.5" />}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md shadow-purple-600/20"
            >
              Submit Observation Entry
            </Button>
          </div>
        </form>
      </div>

      {/* Published Reports List Section */}
      <div className="space-y-4">
        <h3 className="text-base font-extrabold text-slate-900">Published Clinical Evaluation Reports</h3>

        {reports.length === 0 ? (
          <div className="p-8 text-center bg-white border border-slate-100 rounded-3xl text-slate-400 text-xs">
            <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="font-semibold text-slate-700">No progress reports published yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reports.map((report) => {
              const goals = Array.isArray(report.goalsAchieved) ? report.goalsAchieved : [];
              const milestones = Array.isArray(report.nextMilestones) ? report.nextMilestones : [];

              return (
                <div key={report.id} className="p-6 rounded-3xl bg-white border border-slate-100 shadow-xs space-y-4 flex flex-col justify-between hover:shadow-md transition-all">
                  <div>
                    <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100 mb-3">
                      <span className="text-[11px] font-extrabold text-purple-600 uppercase tracking-wider">
                        Date: {report.date}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-extrabold bg-purple-50 text-purple-700 px-2.5 py-0.5 rounded-full border border-purple-200">
                        <Award className="w-3.5 h-3.5 text-purple-600" /> Score: {report.overallProgressScore} / 100
                      </span>
                    </div>

                    <h3 className="text-base font-black text-slate-900 mb-1">{report.title}</h3>
                    <p className="text-xs font-semibold text-slate-500 mb-3">Patient: {report.childName}</p>

                    <p className="text-xs text-slate-600 leading-relaxed bg-purple-50/40 p-3 rounded-2xl border border-purple-100/60 mb-3 font-medium">
                      "{report.observations}"
                    </p>

                    <div className="space-y-2 text-xs">
                      {goals.length > 0 && (
                        <div>
                          <h4 className="font-extrabold text-slate-800 flex items-center gap-1.5 text-[11px] uppercase">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Goals Achieved
                          </h4>
                          <ul className="list-disc list-inside text-slate-600 pl-1 mt-1 space-y-0.5 font-medium">
                            {goals.map((g: string, idx: number) => (
                              <li key={idx}>{g}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {milestones.length > 0 && (
                        <div className="pt-2">
                          <h4 className="font-extrabold text-slate-800 flex items-center gap-1.5 text-[11px] uppercase">
                            <Target className="w-3.5 h-3.5 text-indigo-600" /> Targeted Milestones
                          </h4>
                          <ul className="list-disc list-inside text-slate-600 pl-1 mt-1 space-y-0.5 font-medium">
                            {milestones.map((m: string, idx: number) => (
                              <li key={idx}>{m}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 text-right">
                    <button className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer inline-flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" />
                      <span>Export PDF Summary</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <CreateReportModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        childrenList={childrenList}
        onSuccess={loadData}
      />
    </div>
  );
};
