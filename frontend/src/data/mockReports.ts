import type { TherapyReport } from '../types/report';

export const INITIAL_REPORTS: TherapyReport[] = [
  {
    id: 'REP001',
    childId: 'C001',
    childName: 'Aarav Sharma',
    therapistId: 'T001',
    therapistName: 'Dr. Priya Sharma',
    title: 'Q3 Behavioral Milestone Assessment',
    date: '2026-08-08',
    sessionDate: '2026-08-08',
    overallProgressScore: 78,
    observations: 'Aarav demonstrated notable improvement in maintaining eye contact during 1-on-1 visual puzzle solving. Social engagement remains fluctuating during multi-child group sessions.',
    progressNotes: 'Achieved 80% accuracy in identifying emotion flashcards. Successfully used 3-word vocal prompts when requesting break time.',
    recommendations: 'Continue daily 15-minute home joint attention exercises. Maintain visual schedule board for morning routines.',
    nextSessionPlan: 'Introduce turn-taking board games with one peer helper.',
    goalsAchieved: ['Sustained eye contact for 5+ seconds', '3-word phrase requests'],
    nextMilestones: ['Group turn-taking activity'],
    createdAt: '2026-08-08T14:30:00Z'
  },
  {
    id: 'REP002',
    childId: 'C003',
    childName: 'Rahul Mehta',
    therapistId: 'T001',
    therapistName: 'Dr. Priya Sharma',
    title: 'AAC Communication Evaluation',
    date: '2026-08-09',
    sessionDate: '2026-08-09',
    overallProgressScore: 65,
    observations: 'Rahul engaged well with AAC communication tablet. Showed mild agitation when transitioning between clinic sensory room and tabletop tasks.',
    progressNotes: 'Completed 4 multi-step sequencing tasks with minimal physical prompts.',
    recommendations: 'Use 2-minute countdown timer prior to task transitions.',
    nextSessionPlan: 'Practice community social scenarios using AAC board icons.',
    goalsAchieved: ['Independent AAC board usage'],
    nextMilestones: ['Self-regulate during noisy transitions'],
    createdAt: '2026-08-09T17:00:00Z'
  }
];
