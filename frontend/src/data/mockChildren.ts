import type { Child } from '../types/child';

export const INITIAL_CHILDREN: Child[] = [
  {
    id: 'C001',
    parentId: 'P001',
    parentName: 'Sunita Sharma',
    name: 'Aarav Sharma',
    dob: '2020-04-12',
    age: 6,
    gender: 'Male',
    school: 'St. Xavier Junior Academy',
    grade: 'Kindergarten',
    parentNotes: 'Responds well to visual cues. Experiences sensory overload in loud environments.',
    avatarUrl: 'https://images.unsplash.com/photo-1543332164-6e82f355badc?w=150&auto=format&fit=crop&q=80',
    assignedTherapistId: 'T001',
    assignedTherapistName: 'Dr. Priya Sharma',
    supportIndicator: 'MODERATE',
    therapyStatus: 'ACTIVE',
    assessmentStatus: 'COMPLETED',
    lastAssessmentDate: '2026-08-05',
    lastSessionDate: '2026-08-10',
    milestones: [
      { id: 'M1', title: 'Maintains eye contact for 5+ seconds during play', date: '2026-07-15', category: 'Social', achieved: true },
      { id: 'M2', title: 'Uses 3-word phrase to request items', date: '2026-07-28', category: 'Communication', achieved: true },
      { id: 'M3', title: 'Participates in group turn-taking activity', date: '2026-08-08', category: 'Social', achieved: false },
    ]
  },
  {
    id: 'C002',
    parentId: 'P001',
    parentName: 'Sunita Sharma',
    name: 'Ananya Sharma',
    dob: '2022-09-20',
    age: 4,
    gender: 'Female',
    school: 'Little Steps Preschool',
    grade: 'Nursery',
    parentNotes: 'Very curious, energetic. Loves building blocks and rhythmic music.',
    avatarUrl: 'https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?w=150&auto=format&fit=crop&q=80',
    assignedTherapistId: undefined,
    assignedTherapistName: undefined,
    supportIndicator: 'LOW',
    therapyStatus: 'NOT_STARTED',
    assessmentStatus: 'COMPLETED',
    lastAssessmentDate: '2026-08-01',
    milestones: [
      { id: 'M4', title: 'Responds immediately when name is called', date: '2026-07-10', category: 'Communication', achieved: true },
    ]
  },
  {
    id: 'C003',
    parentId: 'P002',
    parentName: 'Vikram Mehta',
    name: 'Rahul Mehta',
    dob: '2019-11-05',
    age: 7,
    gender: 'Male',
    school: 'Modern Public School',
    grade: 'Grade 1',
    parentNotes: 'Enjoys structured schedules. Struggles with sudden routine transitions.',
    avatarUrl: 'https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=150&auto=format&fit=crop&q=80',
    assignedTherapistId: 'T001',
    assignedTherapistName: 'Dr. Priya Sharma',
    supportIndicator: 'HIGH',
    therapyStatus: 'ACTIVE',
    assessmentStatus: 'COMPLETED',
    lastAssessmentDate: '2026-07-20',
    lastSessionDate: '2026-08-09',
    milestones: [
      { id: 'M5', title: 'Uses AAC communication board independently', date: '2026-06-12', category: 'Communication', achieved: true },
      { id: 'M6', title: 'Self-regulates during noisy transitions', date: '2026-08-02', category: 'Motor', achieved: false }
    ]
  }
];
