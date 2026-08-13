import type { AssessmentQuestion, ScreeningResult } from '../types/assessment';

export const ASSESSMENT_QUESTIONS: AssessmentQuestion[] = [
  {
    id: 'Q1',
    category: 'Social Interaction',
    questionText: 'Does your child make direct eye contact when interacting or conversing with family members?',
    options: [
      { label: 'Always / Consistently', value: 'ALWAYS', score: 0 },
      { label: 'Sometimes', value: 'SOMETIMES', score: 1 },
      { label: 'Rarely / Needs Prompting', value: 'RARELY', score: 2 },
      { label: 'Never / Avoids Eye Contact', value: 'NEVER', score: 3 }
    ]
  },
  {
    id: 'Q2',
    category: 'Social Interaction',
    questionText: 'Does your child respond with a smile or vocalization when you smile at them?',
    options: [
      { label: 'Always', value: 'ALWAYS', score: 0 },
      { label: 'Sometimes', value: 'SOMETIMES', score: 1 },
      { label: 'Rarely', value: 'RARELY', score: 2 },
      { label: 'Never', value: 'NEVER', score: 3 }
    ]
  },
  {
    id: 'Q3',
    category: 'Communication',
    questionText: 'Does your child respond promptly when their name is called from across the room?',
    options: [
      { label: 'Always', value: 'ALWAYS', score: 0 },
      { label: 'Sometimes', value: 'SOMETIMES', score: 1 },
      { label: 'Rarely', value: 'RARELY', score: 2 },
      { label: 'Never / Appears Hard of Hearing', value: 'NEVER', score: 3 }
    ]
  },
  {
    id: 'Q4',
    category: 'Communication',
    questionText: 'Does your child use gestures (e.g., pointing, waving, nodding) to express needs or direct your attention?',
    options: [
      { label: 'Always', value: 'ALWAYS', score: 0 },
      { label: 'Sometimes', value: 'SOMETIMES', score: 1 },
      { label: 'Rarely', value: 'RARELY', score: 2 },
      { label: 'Never', value: 'NEVER', score: 3 }
    ]
  },
  {
    id: 'Q5',
    category: 'Repetitive Behaviour',
    questionText: 'Does your child engage in repetitive physical movements (e.g., hand-flapping, spinning, rocking)?',
    options: [
      { label: 'Never', value: 'NEVER', score: 0 },
      { label: 'Rarely', value: 'RARELY', score: 1 },
      { label: 'Sometimes', value: 'SOMETIMES', score: 2 },
      { label: 'Always / Frequently', value: 'ALWAYS', score: 3 }
    ]
  },
  {
    id: 'Q6',
    category: 'Repetitive Behaviour',
    questionText: 'Does your child display intense distress or resistance when daily routines are slightly modified?',
    options: [
      { label: 'Never', value: 'NEVER', score: 0 },
      { label: 'Rarely', value: 'RARELY', score: 1 },
      { label: 'Sometimes', value: 'SOMETIMES', score: 2 },
      { label: 'Always', value: 'ALWAYS', score: 3 }
    ]
  },
  {
    id: 'Q7',
    category: 'Sensory Responses',
    questionText: 'Does your child show unusually strong reactions to specific everyday sounds, textures, or bright lights?',
    options: [
      { label: 'Never', value: 'NEVER', score: 0 },
      { label: 'Rarely', value: 'RARELY', score: 1 },
      { label: 'Sometimes', value: 'SOMETIMES', score: 2 },
      { label: 'Always', value: 'ALWAYS', score: 3 }
    ]
  },
  {
    id: 'Q8',
    category: 'Attention & Focus',
    questionText: 'Does your child become hyper-focused on specific objects or mechanical details (e.g., spinning wheels) for long periods?',
    options: [
      { label: 'Never', value: 'NEVER', score: 0 },
      { label: 'Rarely', value: 'RARELY', score: 1 },
      { label: 'Sometimes', value: 'SOMETIMES', score: 2 },
      { label: 'Always', value: 'ALWAYS', score: 3 }
    ]
  }
];

export const MOCK_SCREENING_RESULTS: Record<string, ScreeningResult> = {
  'C001': {
    id: 'RES001',
    assessmentId: 'ASM001',
    childId: 'C001',
    childName: 'Aarav Sharma',
    date: '2026-08-05',
    completedDate: '2026-08-05',
    totalScore: 14,
    maxScore: 24,
    percentage: 58,
    supportIndicator: 'MODERATE',
    overallSupportIndicator: 'MODERATE',
    confidenceScore: 87,
    domainScores: [
      { category: 'Social Interaction', scorePercentage: 65, riskLevel: 'Moderate' },
      { category: 'Communication', scorePercentage: 72, riskLevel: 'Low' },
      { category: 'Repetitive Behaviour', scorePercentage: 48, riskLevel: 'Moderate' },
      { category: 'Sensory Responses', scorePercentage: 55, riskLevel: 'Moderate' },
      { category: 'Attention & Focus', scorePercentage: 70, riskLevel: 'Low' }
    ],
    summary: 'Moderate support indicator across social interaction and sensory response domains.',
    recommendations: [
      'Schedule an in-person behavioral evaluation with a certified pediatric specialist.',
      'Incorporate visual schedule cards to ease daily routine transitions.',
      'Engage in structured 1-on-1 joint attention play activities for 15 minutes daily.',
      'Explore sensory-friendly noise-canceling headphones for crowded outdoor settings.'
    ],
    disclaimer: 'IMPORTANT DISCLAIMER: This AI behavioral screening is intended only as an educational and preliminary support indicator tool. It does NOT constitute a medical or clinical diagnosis of Autism Spectrum Disorder (ASD). Please consult a qualified developmental pediatrician or board-certified behavioral analyst.'
  }
};
