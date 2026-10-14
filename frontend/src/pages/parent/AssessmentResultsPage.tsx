import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  BehaviorAnalysisReport,
  ScreeningResultVisualizer
} from '../../components/assessments/ScreeningResultVisualizer';
import type { AssessmentResult } from '../../types/assessment';
import { predictionApi, type PredictionResult } from '../../services/api/predictionApi';
import { Loader2 } from 'lucide-react';
import type { SupportIndicatorLevel } from '../../types/child';

const toSupportIndicator = (value?: string | null): SupportIndicatorLevel => {
  if (value === 'LOW' || value === 'MODERATE' || value === 'HIGH' || value === 'NOT_ASSESSED') {
    return value;
  }
  return 'MODERATE';
};

const toAssessmentResult = (p: PredictionResult): AssessmentResult => {
  const percentage = p.percentage ?? 0;
  return {
    id: p.id || '1',
    childId: p.childId,
    childName: 'Child Profile',
    completedDate: p.createdAt || new Date().toISOString(),
    totalScore: percentage,
    maxScore: 100,
    percentage,
    confidenceScore: p.confidenceScore ?? undefined,
    supportIndicator: toSupportIndicator(p.supportIndicator),
    summary: p.summary,
    recommendations: p.recommendations,
    disclaimer: p.disclaimer,
    domainScores: [
      { category: 'Repetitive Behaviour', categoryName: 'Restricted & Repetitive Behaviors', percentage },
      { category: 'Social Interaction', categoryName: 'Social Interaction & Response', percentage: Math.max(20, percentage - 10) },
      { category: 'Communication', categoryName: 'Non-Verbal Communication', percentage: Math.max(15, percentage - 15) },
      { category: 'Sensory Responses', categoryName: 'Sensory Adaptation', percentage: Math.max(25, percentage - 5) }
    ]
  };
};

export const AssessmentResultsPage: React.FC = () => {
  const location = useLocation();
  const stateResult = (
    location.state as { result?: AssessmentResult | PredictionResult } | null
  )?.result;

  const [activeResult, setActiveResult] = useState<AssessmentResult | PredictionResult | null>(() => {
    if (!stateResult) return null;
    if ('source' in stateResult && stateResult.source === 'video') {
      return stateResult as PredictionResult;
    }
    if ('behaviorAnalysis' in stateResult && stateResult.behaviorAnalysis) {
      return stateResult;
    }
    if ('domainScores' in stateResult) {
      return stateResult;
    }
    return toAssessmentResult(stateResult);
  });
  const [loading, setLoading] = useState(!stateResult);
  const poseAnalysisData =
    activeResult && 'poseAnalysis' in activeResult
      ? (activeResult as PredictionResult).poseAnalysis
      : undefined;
  const poseChannels = poseAnalysisData?.channels
    ? Object.entries(poseAnalysisData.channels)
    : [];
  const topPoseChannels = [...poseChannels]
    .filter(([, value]) => value && typeof value === 'object')
    .sort(([, left], [, right]) => {
      const a = Number((left as { periodicity_score?: number })?.periodicity_score ?? 0);
      const b = Number((right as { periodicity_score?: number })?.periodicity_score ?? 0);
      return b - a;
    })
    .slice(0, 4);

  useEffect(() => {
    if (!activeResult) {
      predictionApi.getPredictionResults()
        .then((list) => {
          if (list.length > 0) {
            const latestResult = list[0];
            setActiveResult(
              latestResult.source === 'video' || latestResult.behaviorAnalysis
                ? latestResult
                : toAssessmentResult(latestResult)
            );
          }
        })
        .catch((err) => console.error('Failed to load analysis history:', err))
        .finally(() => setLoading(false));
    }
  }, [activeResult]);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-12 min-h-[300px]">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!activeResult) {
    return (
      <div className="p-12 text-center text-sm font-semibold text-slate-600 bg-white rounded-3xl border border-slate-100 max-w-md mx-auto my-8">
        No video analysis or screening result found. Please complete an AI screening or upload a video clip to view clinical results.
      </div>
    );
  }

  if (
    'source' in activeResult &&
    activeResult.source === 'video' &&
    !activeResult.behaviorAnalysis
  ) {
    return (
      <div className="mx-auto my-8 max-w-2xl space-y-3 rounded-3xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-950">
        <h1 className="font-extrabold">Video behavior analysis unavailable</h1>
        <p>
          This saved video result does not contain the structured behavior findings required for a
          reliable report. Run a new analysis with the current pbr4RRB integration.
        </p>
        <p>{activeResult.disclaimer}</p>
      </div>
    );
  }

  if ('behaviorAnalysis' in activeResult && activeResult.behaviorAnalysis) {
    return (
      <div className="space-y-6">
        <BehaviorAnalysisReport
          analysis={activeResult.behaviorAnalysis}
          completedDate={activeResult.createdAt}
          disclaimer={activeResult.disclaimer}
        />

        {'poseAnalysis' in activeResult && activeResult.poseAnalysis && Object.keys(activeResult.poseAnalysis.channels ?? {}).length > 0 && (
          <section className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-slate-900">Experimental movement analysis</h2>
                <p className="text-xs text-slate-500">AutiCare stage 7 pose-temporal summary</p>
              </div>
              {activeResult.poseAnalysis.engine && (
                <span className="rounded-full bg-purple-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-purple-700">
                  {activeResult.poseAnalysis.engine}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {topPoseChannels.map(([name, channel]) => (
                <div key={name} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-slate-900">{name}</span>
                    <span className="text-xs font-semibold text-slate-600">
                      {Number((channel as { periodicity_score?: number })?.periodicity_score ?? 0).toFixed(3)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">
                    {(channel as { interpretation?: string })?.interpretation ?? 'No strong repetitive pattern measured'}
                  </p>
                  <p className="mt-2 text-[11px] text-slate-500">
                    Coverage {Number((channel as { coverage_percent?: number })?.coverage_percent ?? 0).toFixed(0)}% • {
                      (channel as { quality_status?: string })?.quality_status ?? 'UNKNOWN'
                    }
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    );
  }

  return (
    <div>
      <ScreeningResultVisualizer
        result={'domainScores' in activeResult ? activeResult : toAssessmentResult(activeResult)}
      />
    </div>
  );
};
