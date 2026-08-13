import type { BehaviorRecord } from '../types/behavior';

export const INITIAL_BEHAVIOR_RECORDS: BehaviorRecord[] = [
  {
    id: 'BEH001',
    childId: 'C001',
    therapistId: 'T001',
    date: '2026-08-08',
    behaviorCategory: 'Social Interaction Avoidance',
    category: 'Social Interaction Avoidance',
    observation: 'Child withdrew to corner during group circle time when asked to share building blocks.',
    frequency: 3,
    severity: 'Moderate',
    trigger: 'Transition to unstructured group activity',
    response: 'Offered 1-on-1 visual task board and guided peer integration',
    notes: 'Responded positively after 5 minutes of parallel play.',
    createdAt: '2026-08-08T11:45:00Z'
  },
  {
    id: 'BEH002',
    childId: 'C001',
    therapistId: 'T001',
    date: '2026-08-09',
    behaviorCategory: 'Sensory Overload',
    category: 'Sensory Overload',
    observation: 'Covered ears and voiced discomfort during high-frequency musical bell exercise.',
    frequency: 2,
    severity: 'Moderate',
    trigger: 'Abrupt loud acoustic stimulation',
    response: 'Reduced sound volume and provided quiet decompression corner',
    notes: 'Recovered within 3 minutes when provided calming tactile toy.',
    createdAt: '2026-08-09T15:10:00Z'
  },
  {
    id: 'BEH003',
    childId: 'C003',
    therapistId: 'T001',
    date: '2026-08-09',
    behaviorCategory: 'Repetitive Motor Stereotypy',
    category: 'Repetitive Motor Stereotypy',
    observation: 'Repetitive hand-flapping observed when excited by animated puzzle completion.',
    frequency: 5,
    severity: 'Low',
    trigger: 'Positive reinforcement / task completion excitement',
    response: 'Acknowledged task achievement without interrupting natural coping regulation',
    notes: 'Harmless self-soothing stimming behavior.',
    createdAt: '2026-08-09T16:30:00Z'
  }
];
