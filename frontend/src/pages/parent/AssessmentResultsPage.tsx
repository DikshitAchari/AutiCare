import React from 'react';
import { useLocation } from 'react-router-dom';
import { ScreeningResultVisualizer } from '../../components/assessments/ScreeningResultVisualizer';
import type { AssessmentResult } from '../../types/assessment';

export const AssessmentResultsPage: React.FC = () => {
  const location = useLocation();
  const passedResult = (location.state as { result?: AssessmentResult } | null)?.result;

  if (!passedResult) {
    return (
      <div className="p-8 text-center text-sm text-slate-600">
        No assessment result is available. Complete an assessment to view its results.
      </div>
    );
  }

  return (
    <div>
      <ScreeningResultVisualizer result={passedResult} />
    </div>
  );
};
