import React from 'react';
import { useLocation } from 'react-router-dom';
import { ScreeningResultVisualizer } from '../../components/assessments/ScreeningResultVisualizer';
import type { AssessmentResult } from '../../types/assessment';

export const AssessmentResultsPage: React.FC = () => {
  const location = useLocation();
  const passedResult = (location.state as any)?.result as AssessmentResult | undefined;

  const defaultResult: AssessmentResult = {
    id: 'res-default-01',
    childId: 'c1',
    childName: 'Aarav Sharma',
    completedDate: '2025-05-04',
    totalScore: 54,
    maxScore: 100,
    percentage: 78,
    confidenceScore: 78,
    supportIndicator: 'MODERATE',
    domainScores: [
      { category: 'Communication', percentage: 65, riskLevel: 'Needs Attention' },
      { category: 'Social Interaction', percentage: 70, riskLevel: 'Moderate' },
      { category: 'Behavior Patterns', percentage: 45, riskLevel: 'Low Risk' },
      { category: 'Sensory Response', percentage: 58, riskLevel: 'Moderate' }
    ],
    summary: 'Based on the screening test and video analysis, your child shows signs associated with Moderate Risk of Autism Spectrum Disorder. We recommend consulting a specialist for further evaluation.',
    recommendations: [
      'Consult a child psychologist',
      'Early intervention therapy',
      'Regular follow-up assessments',
      'Encourage social interaction',
      'Monitor behavior patterns'
    ],
    disclaimer: 'This AI screening tool provides preliminary developmental indicators. It does not constitute a clinical medical diagnosis. Please consult a qualified clinical specialist for formal diagnosis.'
  };

  const resultToDisplay = passedResult || defaultResult;

  return (
    <div>
      <ScreeningResultVisualizer result={resultToDisplay} />
    </div>
  );
};
