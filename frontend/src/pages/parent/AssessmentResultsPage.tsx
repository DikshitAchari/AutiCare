import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ScreeningResultVisualizer } from '../../components/assessments/ScreeningResultVisualizer';
import type { AssessmentResult } from '../../types/assessment';
import { predictionApi, type PredictionResult } from '../../services/api/predictionApi';
import { Loader2 } from 'lucide-react';

const toAssessmentResult = (p: PredictionResult): AssessmentResult => ({
  id: p.id || '1',
  childId: p.childId,
  childName: 'Child Profile',
  completedDate: p.createdAt || new Date().toISOString(),
  totalScore: p.percentage,
  maxScore: 100,
  percentage: p.percentage,
  confidenceScore: p.confidenceScore,
  supportIndicator: (p.supportIndicator as any) || 'MODERATE',
  summary: p.summary,
  recommendations: p.recommendations,
  disclaimer: p.disclaimer,
  domainScores: [
    { category: 'Repetitive Behaviour', categoryName: 'Restricted & Repetitive Behaviors', percentage: p.percentage },
    { category: 'Social Interaction', categoryName: 'Social Interaction & Response', percentage: Math.max(20, p.percentage - 10) },
    { category: 'Communication', categoryName: 'Non-Verbal Communication', percentage: Math.max(15, p.percentage - 15) },
    { category: 'Sensory Responses', categoryName: 'Sensory Adaptation', percentage: Math.max(25, p.percentage - 5) }
  ]
});

export const AssessmentResultsPage: React.FC = () => {
  const location = useLocation();
  const stateResult = (location.state as { result?: any } | null)?.result;

  const [activeResult, setActiveResult] = useState<AssessmentResult | null>(() => {
    if (!stateResult) return null;
    if (stateResult.supportIndicator && stateResult.domainScores) {
      return stateResult as AssessmentResult;
    }
    return toAssessmentResult(stateResult as PredictionResult);
  });
  const [loading, setLoading] = useState(!stateResult);

  useEffect(() => {
    if (!activeResult) {
      predictionApi.getPredictionResults()
        .then((list) => {
          if (list.length > 0) {
            setActiveResult(toAssessmentResult(list[0]));
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

  return (
    <div>
      <ScreeningResultVisualizer result={activeResult} />
    </div>
  );
};
