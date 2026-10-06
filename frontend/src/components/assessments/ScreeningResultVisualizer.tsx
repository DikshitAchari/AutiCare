import React, { useState } from 'react';
import type { AssessmentResult } from '../../types/assessment';
import { StatusBadge } from '../ui/StatusBadge';
import { Button } from '../ui/Button';
import {
  ArrowRight,
  Calendar,
  Download,
  CheckCircle2,
  ShieldAlert,
  Loader2,
  Cpu,
  UserCheck,
  Activity,
  Layers,
  Sparkles
} from 'lucide-react';
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

  const models = result.models || {};
  const therapistRecs = result.therapistRecommendations || [];

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
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-700 flex items-center gap-1.5">
              <Layers className="w-3 h-3" /> Multi-Modal Fusion Pipeline
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600">
              AI-Assisted Behavioral Screening
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">AI Behavioral Screening Report</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Generated on {new Date(result.completedDate || Date.now()).toLocaleDateString()} &bull; Research & Clinical Support
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
              <h2 className="text-lg font-black text-slate-900">{result.supportIndicator} Support Level</h2>
              <StatusBadge status={result.supportIndicator} type="support" />
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Behavioral Screening Indicator &bull; Model Confidence: {result.confidenceScore || 0}%
            </p>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">
              Project Screening Indicator (Non-Diagnostic Behavioral Screening Estimate)
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/parent/therapists')}
          className="w-full sm:w-auto px-6 py-3 text-xs font-extrabold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-md shadow-purple-600/20 transition-all cursor-pointer text-center shrink-0"
        >
          Consult Matched Specialist
        </button>
      </div>

      {/* Multi-Model Fusion Pipeline Status */}
      <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-purple-600" /> Independent AI Models Output (Multi-Model Architecture)
          </h3>
          <span className="text-[11px] font-semibold text-slate-400">3 Model Interfaces &bull; Same Uploaded Video</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 1. AI4ASD PBR4RRB */}
          {(() => {
            const pbr4 = result.videoAnalysis?.pbr4rrb;
            const isCompleted = pbr4?.status === 'completed' || (models.pbr4ai && pbr4?.status !== 'failed');
            const isFailed = pbr4?.status === 'failed';
            const output = pbr4?.output || result.rawModelMetrics || {};
            const rawMetrics = output.raw_model_metrics || output;

            return (
              <div className={`p-4 rounded-2xl border space-y-2.5 ${isCompleted ? 'bg-emerald-50/50 border-emerald-200/70' : isFailed ? 'bg-red-50/50 border-red-200/70' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-900">1. AI4ASD PBR4RRB</span>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${isCompleted ? 'bg-emerald-100 text-emerald-800' : isFailed ? 'bg-red-100 text-red-800' : 'bg-slate-200 text-slate-700'}`}>
                    {isCompleted ? 'COMPLETED' : isFailed ? 'FAILED' : 'NOT_CONFIGURED'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                  RepDetectNet & Swin-3D Transformer for restricted & repetitive motor behavior classification.
                </p>
                {isCompleted && (
                  <div className="space-y-1 pt-1 text-[11px] font-semibold text-emerald-950 bg-white/70 p-2.5 rounded-xl border border-emerald-100">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Detected Action:</span>
                      <span className="font-bold">{rawMetrics.top_action || output.top_action || 'None'}</span>
                    </div>
                    {rawMetrics.action_probabilities && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Top Confidence:</span>
                        <span className="font-bold font-mono">{((rawMetrics.action_probabilities[rawMetrics.top_action] || 0) * 100).toFixed(1)}%</span>
                      </div>
                    )}
                    {rawMetrics.peak_oscillation_power !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Oscillation Power:</span>
                        <span className="font-bold font-mono">{Number(rawMetrics.peak_oscillation_power).toFixed(3)}</span>
                      </div>
                    )}
                  </div>
                )}
                {isFailed && pbr4?.error && (
                  <p className="text-[10px] text-red-700 bg-red-100/60 p-2 rounded-lg font-mono break-all">{pbr4.error}</p>
                )}
              </div>
            );
          })()}

          {/* 2. ASDMotion */}
          {(() => {
            const asd = result.videoAnalysis?.asd_motion;
            const isCompleted = asd?.status === 'completed';
            const isFailed = asd?.status === 'failed';
            const output = asd?.output || {};

            return (
              <div className={`p-4 rounded-2xl border space-y-2.5 ${isCompleted ? 'bg-indigo-50/50 border-indigo-200/70' : isFailed ? 'bg-red-50/50 border-red-200/70' : 'bg-amber-50/40 border-amber-200/50'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-900">2. ASDMotion (PoseC3D)</span>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${isCompleted ? 'bg-indigo-100 text-indigo-800' : isFailed ? 'bg-red-100 text-red-800' : 'bg-slate-200 text-slate-700'}`}>
                    {isCompleted ? 'COMPLETED' : isFailed ? 'FAILED' : 'NOT_AVAILABLE'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                  OpenPose 25-Keypoint + PoseC3D ResNet-3D for stereotypical motor movement (SMM) detection.
                </p>
                {isCompleted && (
                  <div className="space-y-1 pt-1 text-[11px] font-semibold text-indigo-950 bg-white/70 p-2.5 rounded-xl border border-indigo-100">
                    <div className="flex justify-between">
                      <span className="text-slate-500">SMM Movement:</span>
                      <span className="font-bold">{output.smm_detected ? 'Stereotypical Detected' : 'No SMM Movement'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Avg Motion Score:</span>
                      <span className="font-bold font-mono">{Number(output.average_stereotypical_score || 0).toFixed(5)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Peak Motion Score:</span>
                      <span className="font-bold font-mono">{Number(output.max_stereotypical_score || 0).toFixed(5)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">SMM Segments:</span>
                      <span className="font-bold font-mono">{output.smm_count || 0}</span>
                    </div>
                  </div>
                )}
                {isFailed && asd?.error && (
                  <p className="text-[10px] text-red-700 bg-red-100/60 p-2 rounded-lg font-mono break-all">{asd.error}</p>
                )}
              </div>
            );
          })()}

          {/* 3. AV-ASD */}
          {(() => {
            const av = result.videoAnalysis?.av_asd;
            const isCompleted = av?.status === 'completed';
            const isFailed = av?.status === 'failed';

            return (
              <div className={`p-4 rounded-2xl border space-y-2.5 ${isCompleted ? 'bg-emerald-50/50 border-emerald-200/70' : isFailed ? 'bg-red-50/50 border-red-200/70' : 'bg-slate-50 border-slate-200/80'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-800">3. AV-ASD (Audio-Visual)</span>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${isCompleted ? 'bg-emerald-100 text-emerald-800' : isFailed ? 'bg-red-100 text-red-800' : 'bg-slate-200 text-slate-700'}`}>
                    {isCompleted ? 'COMPLETED' : isFailed ? 'FAILED' : 'NOT_AVAILABLE'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                  Audio-visual congruence & speech-gesture synchronization interface.
                </p>
                <div className="p-2.5 bg-white/70 rounded-xl border border-slate-200/60 text-[11px] text-slate-500 font-medium">
                  {av?.reason || 'AV-ASD model weights/architecture are not currently available in the repository.'}
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Domain Score Progress Bars Grid */}
      <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-xs space-y-6">
        <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
          <Activity className="w-4 h-4 text-purple-600" /> Developmental Domain Indicators
        </h3>

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

      {/* Recommended Specialist Referrals */}
      {therapistRecs.length > 0 && (
        <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-purple-600" /> Recommended Clinical Specialist Referrals
            </h3>
            <button
              onClick={() => navigate('/parent/therapists')}
              className="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1 cursor-pointer"
            >
              Browse Directory <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {therapistRecs.map((rec, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-purple-50/40 border border-purple-100 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-purple-950">{rec.specialization}</span>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-purple-100 text-purple-800">
                    {rec.priority || 'RECOMMENDED'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                  {rec.rationale}
                </p>
                {rec.suggested_focus && rec.suggested_focus.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {rec.suggested_focus.map((f, fIdx) => (
                      <span key={fIdx} className="text-[10px] bg-white border border-purple-200 text-purple-700 px-2 py-0.5 rounded-md font-semibold">
                        {f}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommended Next Clinical Steps */}
      <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-xs space-y-4">
        <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-600" /> Actionable Next Steps
        </h3>
        <div className="space-y-2.5">
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
