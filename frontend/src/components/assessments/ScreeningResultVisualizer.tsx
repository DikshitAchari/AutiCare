import React, { useState } from 'react';
import type { AssessmentResult } from '../../types/assessment';
import { StatusBadge } from '../ui/StatusBadge';
import { Button } from '../ui/Button';
import { ArrowRight, Calendar, Download, CheckCircle2, ShieldAlert, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { predictionApi } from '../../services/api/predictionApi';

export interface ScreeningResultVisualizerProps {
  result: AssessmentResult;
}

export const ScreeningResultVisualizer: React.FC<ScreeningResultVisualizerProps> = ({ result }) => {
  const navigate = useNavigate();
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const handleDownload = async () => {
    if (!result.id) return;
    setIsDownloading(true);
    setDownloadError(null);
    try {
      const blob = await predictionApi.downloadReport(result.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `AutiCare_Clinical_Report_${result.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      console.error('Failed to download report:', err);
      setDownloadError(err?.message || 'Failed to generate report. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const domainScores = result.domainScores.map((domain, index) => ({
    name: domain.categoryName || domain.category,
    score: domain.percentage,
    notAnalyzed: domain.percentage === null || domain.percentage === undefined,
    statusText: domain.statusText || 'Not analyzed by current model',
    color: ['bg-purple-600', 'bg-amber-500', 'bg-indigo-600', 'bg-emerald-500'][index % 4]
  }));

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {downloadError && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl">
          {downloadError}
        </div>
      )}
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">AI Screening Report</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Completed on {new Date(result.completedDate || Date.now()).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleDownload}
            disabled={isDownloading}
            leftIcon={isDownloading ? <Loader2 className="w-4 h-4 animate-spin text-purple-600" /> : <Download className="w-4 h-4" />}
            className="rounded-xl border-slate-200 cursor-pointer font-bold"
          >
            {isDownloading ? 'Generating report...' : 'Download Report'}
          </Button>
          <Button
            onClick={() => navigate('/parent/therapists')}
            leftIcon={<Calendar className="w-4 h-4" />}
            rightIcon={<ArrowRight className="w-4 h-4" />}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md shadow-purple-600/20"
          >
            Book Therapist
          </Button>
        </div>
      </div>

      {/* Main Score Banner Card */}
      <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center font-black text-xl shrink-0">
            {result.percentage}%
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-lg font-black text-slate-900">{result.supportIndicator} Support</h2>
              <StatusBadge status={result.supportIndicator} type="support" />
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Overall score points: {result.totalScore} / {result.maxScore}
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/parent/therapists')}
          className="w-full sm:w-auto px-6 py-3 text-xs font-extrabold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-md shadow-purple-600/20 transition-all cursor-pointer text-center shrink-0"
        >
          Consult Specialist
        </button>
      </div>

      {/* Domain Score Progress Bars Grid */}
      <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-xs space-y-6">
        <h3 className="text-sm font-extrabold text-slate-900">Domain Indicator Breakdown</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {domainScores.map((item) => (
            <div key={item.name} className="space-y-2 p-4 bg-purple-50/30 rounded-2xl border border-purple-100/60">
              <div className="flex justify-between items-center text-xs">
                <span className="font-extrabold text-slate-800">{item.name}</span>
                {item.notAnalyzed ? (
                  <span className="text-[11px] font-semibold text-slate-400 italic bg-slate-100 px-2 py-0.5 rounded-md">
                    {item.statusText}
                  </span>
                ) : (
                  <span className="font-mono font-bold text-purple-700">{item.score}%</span>
                )}
              </div>
              {item.notAnalyzed ? (
                <div className="w-full h-2 bg-slate-100 rounded-full border border-dashed border-slate-200" />
              ) : (
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.color} rounded-full transition-all duration-500`}
                    style={{ width: `${item.score}%` }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Recommended Next Clinical Steps */}
      <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-xs space-y-4">
        <h3 className="text-sm font-extrabold text-slate-900">Recommended Next Steps</h3>
        <div className="space-y-3">
          {result.recommendations.map((rec, idx) => (
            <div key={idx} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs font-semibold text-slate-700 flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
              <span>{rec}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Mandatory Disclaimer Box */}
      <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl text-xs text-amber-950 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <h4 className="font-bold text-amber-900 mb-0.5">Mandatory Clinical Disclaimer</h4>
          <p>{result.disclaimer}</p>
        </div>
      </div>
    </div>
  );
};
