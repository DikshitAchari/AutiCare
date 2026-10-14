import React from 'react';
import type { AssessmentResult, BehaviorAnalysis } from '../../types/assessment';
import type { Child } from '../../types/child';
import type { TherapistRecommendation } from '../../services/api/therapistApi';
import { StatusBadge } from '../ui/StatusBadge';
import { Button } from '../ui/Button';
import { ArrowRight, Calendar, Download, CheckCircle2, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export interface ScreeningResultVisualizerProps {
  result: AssessmentResult;
  child?: Child | null;
  recommendations?: TherapistRecommendation[];
}

export const ScreeningResultVisualizer: React.FC<ScreeningResultVisualizerProps> = ({
  result,
  child,
  recommendations = []
}) => {
  const navigate = useNavigate();

  const domainScores = result.domainScores.map((domain, index) => ({
    name: domain.categoryName || domain.category,
    score: domain.percentage ?? domain.scorePercentage ?? 0,
    color: ['bg-purple-600', 'bg-amber-500', 'bg-indigo-600', 'bg-emerald-500'][index % 4]
  }));

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-black tracking-widest uppercase text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded-full">
              AUTICARE
            </span>
            <span className="text-xs text-slate-400 font-semibold">• Clinical Screening Report</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Behavioral Screening & Support Report</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Completed on {new Date(result.completedDate).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-2 print:hidden">
          <Button
            variant="outline"
            onClick={() => window.print()}
            leftIcon={<Download className="w-4 h-4" />}
            className="rounded-xl border-slate-200"
          >
            Print / PDF
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

      {/* Child Information */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <h2 className="text-sm font-black uppercase tracking-wider text-purple-700 border-b border-slate-100 pb-2">
          Child Information
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="block font-bold text-slate-400 uppercase text-[10px]">Name</span>
            <span className="font-extrabold text-slate-900 text-sm">{child?.name || result.childName || 'Child Profile'}</span>
          </div>
          <div>
            <span className="block font-bold text-slate-400 uppercase text-[10px]">Age</span>
            <span className="font-extrabold text-slate-900 text-sm">{child ? `${child.age} years` : 'N/A'}</span>
          </div>
          <div>
            <span className="block font-bold text-slate-400 uppercase text-[10px]">Gender</span>
            <span className="font-extrabold text-slate-900 text-sm">{child?.gender || 'N/A'}</span>
          </div>
          <div>
            <span className="block font-bold text-slate-400 uppercase text-[10px]">Assessment Date</span>
            <span className="font-extrabold text-slate-900 text-sm">
              {new Date(result.completedDate).toLocaleDateString()}
            </span>
          </div>
        </div>
      </section>

      {/* Screening Assessment Score Banner */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <h2 className="text-sm font-black uppercase tracking-wider text-purple-700 border-b border-slate-100 pb-2">
          Screening Assessment
        </h2>
        <div className="p-4 rounded-2xl bg-purple-50/40 border border-purple-100 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white border border-purple-200 text-purple-700 flex items-center justify-center font-black text-xl shrink-0 shadow-xs">
              {result.percentage}%
            </div>
            <div>
              <span className="block font-bold text-slate-500 uppercase text-[10px]">Assessment Result</span>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-black text-slate-900">{result.supportIndicator} Support</h3>
                <StatusBadge status={result.supportIndicator} type="support" />
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Overall score points: {result.totalScore} / {result.maxScore}
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/parent/therapists')}
            className="w-full sm:w-auto px-6 py-3 text-xs font-extrabold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-md shadow-purple-600/20 transition-all cursor-pointer text-center shrink-0 print:hidden"
          >
            Consult Specialist
          </button>
        </div>
      </section>

      {/* Domain Score Breakdown */}
      <section className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-6">
        <h3 className="text-sm font-extrabold text-slate-900">Domain Indicator Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {domainScores.map((item) => (
            <div key={item.name} className="space-y-2 p-4 bg-purple-50/30 rounded-2xl border border-purple-100/60">
              <div className="flex justify-between items-center text-xs">
                <span className="font-extrabold text-slate-800">{item.name}</span>
                <span className="font-mono font-bold text-purple-700">{item.score}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${item.color} rounded-full transition-all duration-500`}
                  style={{ width: `${item.score}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Recommended Next Clinical Steps */}
      <section className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-extrabold text-slate-900">Recommended Next Steps</h3>
        <div className="space-y-3">
          {result.recommendations.map((rec, idx) => (
            <div key={idx} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs font-semibold text-slate-700 flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
              <span>{rec}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Therapist Recommendations */}
      {recommendations.length > 0 && (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
            <h2 className="text-sm font-black uppercase tracking-wider text-purple-700">
              Therapist Recommendations
            </h2>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              Recommendation Method: Rule-Based Matching
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendations.slice(0, 4).map((rec, idx) => (
              <div key={rec.therapist.id || idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-900">
                    {idx + 1}. {rec.therapist.title ? `${rec.therapist.title} ` : ''}{rec.therapist.name}
                  </h3>
                  {rec.therapist.rating && (
                    <span className="text-xs font-bold text-amber-600">★ {rec.therapist.rating.toFixed(1)}</span>
                  )}
                </div>
                <div className="text-xs space-y-1 text-slate-600">
                  <p><strong className="text-slate-700">Specialization:</strong> {(rec.therapist.specializations || []).join(', ') || rec.therapist.title || 'Pediatric Clinical Therapy'}</p>
                  <p><strong className="text-slate-700">Experience:</strong> {rec.therapist.experienceYears} years ({rec.therapist.qualification})</p>
                  <p><strong className="text-slate-700">Consultation Mode:</strong> {rec.therapist.location ? `${rec.therapist.location} • In-Person & Teletherapy` : 'In-Person & Teletherapy'}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Clinical Notice */}
      <section className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl text-xs text-amber-950 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed space-y-1">
          <h4 className="font-bold text-amber-900 uppercase text-[11px] tracking-wider">Clinical Notice</h4>
          <p>
            AutiCare is an assistive screening and behavior-analysis platform. Results from automated video analysis represent model-based behavior classification and do not constitute an autism diagnosis. Clinical evaluation should be performed by qualified healthcare professionals.
          </p>
        </div>
      </section>
    </div>
  );
};

export interface BehaviorAnalysisReportProps {
  analysis: BehaviorAnalysis;
  completedDate?: string;
  disclaimer: string;
  child?: Child | null;
  screeningAssessment?: AssessmentResult | null;
  recommendations?: TherapistRecommendation[];
}

export const BehaviorAnalysisReport: React.FC<BehaviorAnalysisReportProps> = ({
  analysis,
  completedDate,
  child,
  screeningAssessment,
  recommendations = []
}) => {
  const navigate = useNavigate();

  const isNotAnalyzable =
    analysis.status === 'not_analyzable' || analysis.reason === 'no_person_detected';

  // ONLY extract behaviors genuinely detected by the model
  const detectedBehaviors = isNotAnalyzable
    ? []
    : analysis.detected_behaviors && analysis.detected_behaviors.length > 0
    ? analysis.detected_behaviors.map((item) => ({
        name: item.behavior,
        status: 'detected' as const,
        confidence: item.confidence ?? null,
        model: 'AI4ASD-pbr4RRB',
        segments: item.segments || []
      }))
    : [
        ...(analysis.behaviors || []).filter((f) => f.status === 'detected'),
        ...(analysis.additional_observations || []).filter((f) => f.status === 'detected')
      ];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-black tracking-widest uppercase text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded-full">
              AUTICARE
            </span>
            <span className="text-xs text-slate-400 font-semibold">• Clinical Behavior Report</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            {isNotAnalyzable ? 'Video Analysis Report' : 'Behavioral Screening & Support Report'}
          </h1>
          <p className="mt-0.5 text-xs font-medium text-slate-500">
            Report generated on {completedDate ? new Date(completedDate).toLocaleDateString() : new Date().toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-2 print:hidden">
          <Button
            variant="outline"
            onClick={() => window.print()}
            leftIcon={<Download className="w-4 h-4" />}
            className="rounded-xl border-slate-200"
          >
            Print / PDF
          </Button>
          {!isNotAnalyzable && (
            <Button
              onClick={() => navigate('/parent/therapists')}
              leftIcon={<Calendar className="w-4 h-4" />}
              rightIcon={<ArrowRight className="w-4 h-4" />}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md shadow-purple-600/20"
            >
              Book Therapist
            </Button>
          )}
        </div>
      </header>

      {/* Child Information */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <h2 className="text-sm font-black uppercase tracking-wider text-purple-700 border-b border-slate-100 pb-2">
          Child Information
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="block font-bold text-slate-400 uppercase text-[10px]">Name</span>
            <span className="font-extrabold text-slate-900 text-sm">{child?.name || 'Child Profile'}</span>
          </div>
          <div>
            <span className="block font-bold text-slate-400 uppercase text-[10px]">Age</span>
            <span className="font-extrabold text-slate-900 text-sm">{child ? `${child.age} years` : 'N/A'}</span>
          </div>
          <div>
            <span className="block font-bold text-slate-400 uppercase text-[10px]">Gender</span>
            <span className="font-extrabold text-slate-900 text-sm">{child?.gender || 'N/A'}</span>
          </div>
          <div>
            <span className="block font-bold text-slate-400 uppercase text-[10px]">Assessment Date</span>
            <span className="font-extrabold text-slate-900 text-sm">
              {completedDate ? new Date(completedDate).toLocaleDateString() : new Date().toLocaleDateString()}
            </span>
          </div>
        </div>
      </section>

      {/* Screening Assessment (only when analyzable and screening assessment exists) */}
      {!isNotAnalyzable && screeningAssessment && (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-black uppercase tracking-wider text-purple-700 border-b border-slate-100 pb-2">
            Screening Assessment
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-purple-50/40 border border-purple-100 space-y-1">
              <span className="block font-bold text-slate-500 uppercase text-[10px]">Assessment Result</span>
              <p className="font-extrabold text-slate-900 text-sm">
                {screeningAssessment.summary || 'Standardized developmental questionnaire completed'}
              </p>
              <p className="text-slate-600 font-medium">
                Screening score: {screeningAssessment.totalScore} / {screeningAssessment.maxScore}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-purple-50/40 border border-purple-100 space-y-1">
              <span className="block font-bold text-slate-500 uppercase text-[10px]">Risk Category</span>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-black text-slate-900 text-base">
                  {screeningAssessment.supportIndicator} Support
                </span>
                <StatusBadge status={screeningAssessment.supportIndicator} type="support" />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Video / Behavior Analysis */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
          <h2 className="text-sm font-black uppercase tracking-wider text-purple-700">
            {isNotAnalyzable ? 'VIDEO ANALYSIS' : 'BEHAVIOR ANALYSIS'}
          </h2>
          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
            {isNotAnalyzable ? 'Human Presence Gate' : 'AI4ASD-pbr4RRB Model'}
          </span>
        </div>

        {isNotAnalyzable ? (
          <div className="p-5 rounded-2xl border border-amber-200 bg-amber-50/60 space-y-4">
            <div>
              <span className="block text-[11px] font-extrabold uppercase tracking-wider text-amber-900 mb-1">
                Status:
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black bg-amber-200/90 text-amber-950 border border-amber-300">
                Unable to Analyze
              </span>
            </div>

            <div>
              <span className="block text-[11px] font-extrabold uppercase tracking-wider text-amber-900 mb-1">
                Reason:
              </span>
              <p className="text-sm font-bold text-slate-800">
                No analyzable person was detected in the uploaded video.
              </p>
            </div>

            <div className="pt-2 border-t border-amber-200/60">
              <span className="block text-[11px] font-extrabold uppercase tracking-wider text-amber-900 mb-1">
                Guidance:
              </span>
              <p className="text-xs font-semibold text-slate-700">
                Please upload a clear video with the person's body visible for behavioral analysis.
              </p>
            </div>
          </div>
        ) : detectedBehaviors.length > 0 ? (
          <div className="space-y-3">
            <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              {detectedBehaviors.length > 1 ? 'Detected Behaviors' : 'Detected Behavior'}
            </span>
            {detectedBehaviors.map((finding, idx) => (
              <div key={finding.name} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-base font-black text-slate-900 mt-0.5">
                      {detectedBehaviors.length > 1 ? `${idx + 1}. ` : ''}{finding.name}
                    </h3>
                  </div>
                  {finding.confidence !== null && (
                    <div className="text-left sm:text-right">
                      <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                        Behavior Classification Confidence
                      </span>
                      <span className="text-base font-black text-purple-700">
                        {(finding.confidence * 100).toFixed(2)}%
                      </span>
                    </div>
                  )}
                </div>

                {finding.segments && finding.segments.length > 0 && (
                  <div className="pt-2 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 font-medium">
                    <span>
                      Detected segment frame range{finding.segments.length === 1 ? '' : 's'}:{' '}
                      <strong className="text-slate-700">
                        {finding.segments.map((s) => `${s.start_frame}–${s.end_frame}`).join(', ')}
                      </strong>
                    </span>
                    {finding.model && <span>Model: {finding.model}</span>}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-4">
            <div>
              <span className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                Result:
              </span>
              <p className="text-sm font-bold text-slate-800">
                No supported repetitive behavior was confidently detected.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-200/60">
              <span className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                Recommendation:
              </span>
              <p className="text-xs font-semibold text-slate-600">
                For further confirmation or if developmental concerns remain, consider consulting a qualified therapist or healthcare professional.
              </p>
            </div>
          </div>
        )}
      </section>

      {/* Therapist Recommendations - RULE-BASED MATCHING (only if analyzable) */}
      {!isNotAnalyzable && recommendations.length > 0 && (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
            <h2 className="text-sm font-black uppercase tracking-wider text-purple-700">
              Therapist Recommendations
            </h2>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              Recommendation Method: Rule-Based Matching
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendations.slice(0, 4).map((rec, idx) => (
              <div key={rec.therapist.id || idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-900">
                    {idx + 1}. {rec.therapist.title ? `${rec.therapist.title} ` : ''}{rec.therapist.name}
                  </h3>
                  {rec.therapist.rating && (
                    <span className="text-xs font-bold text-amber-600">★ {rec.therapist.rating.toFixed(1)}</span>
                  )}
                </div>
                <div className="text-xs space-y-1 text-slate-600">
                  <p><strong className="text-slate-700">Specialization:</strong> {(rec.therapist.specializations || []).join(', ') || rec.therapist.title || 'Pediatric Clinical Therapy'}</p>
                  <p><strong className="text-slate-700">Experience:</strong> {rec.therapist.experienceYears} years ({rec.therapist.qualification})</p>
                  <p><strong className="text-slate-700">Consultation Mode:</strong> {rec.therapist.location ? `${rec.therapist.location} • In-Person & Teletherapy` : 'In-Person & Teletherapy'}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Clinical Notice */}
      <section className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-xs text-amber-950 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed space-y-1">
          <h3 className="font-black text-amber-900 uppercase text-[11px] tracking-wider">Clinical Notice</h3>
          <p>
            AutiCare is an assistive screening and behavior-analysis platform. Results from automated video analysis represent model-based behavior classification and do not constitute an autism diagnosis. Clinical evaluation should be performed by qualified healthcare professionals.
          </p>
        </div>
      </section>
    </div>
  );
};

