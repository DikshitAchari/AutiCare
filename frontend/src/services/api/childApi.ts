import type { Child, ChildIntakeForm } from '../../types/child';
import { request } from './apiClient';

interface BackendChild {
  id: number;
  parent_id: number;
  name: string;
  dob: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  school?: string | null;
  grade?: string | null;
  parent_notes?: string | null;
  support_indicator?: Child['supportIndicator'];
  therapy_status?: Child['therapyStatus'];
  assessment_status?: Child['assessmentStatus'];
  last_assessment_date?: string | null;
}

const toChild = (child: BackendChild): Child => ({
  id: String(child.id),
  parentId: String(child.parent_id),
  parentName: '',
  name: child.name,
  dob: child.dob,
  age: child.age,
  gender: child.gender,
  school: child.school ?? undefined,
  grade: child.grade ?? undefined,
  parentNotes: child.parent_notes ?? undefined,
  supportIndicator: child.support_indicator ?? 'NOT_ASSESSED',
  therapyStatus: child.therapy_status ?? 'NOT_STARTED',
  assessmentStatus: child.assessment_status ?? 'PENDING',
  lastAssessmentDate: child.last_assessment_date ?? undefined
});

export const childApi = {
  getChildrenByParent: async (_parentId: string): Promise<Child[]> =>
    request<BackendChild[]>('/api/children').then((children) => children.map(toChild)),

  getChildById: async (id: string): Promise<Child | null> => {
    const children = await request<BackendChild[]>('/api/children');
    return children.map(toChild).find((child) => child.id === id) ?? null;
  },

  getAllChildren: async (): Promise<Child[]> =>
    request<BackendChild[]>('/api/children').then((children) => children.map(toChild)),

  addChild: async (intake: ChildIntakeForm, _parentId?: string, _parentName?: string): Promise<Child> => {
    const child = await request<BackendChild>('/api/children', {
      method: 'POST',
      body: JSON.stringify({
        name: intake.name,
        dob: intake.dob,
        gender: intake.gender,
        school: intake.school,
        grade: intake.grade,
        parent_notes: intake.parentNotes
      })
    });
    return toChild(child);
  }
};