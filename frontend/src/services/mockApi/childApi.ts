import type { Child, ChildIntakeForm } from '../../types/child';
import { storageService } from '../storage/storageService';

export const childApi = {
  getChildrenByParent: async (parentId: string): Promise<Child[]> => {
    const all = storageService.getChildren();
    return all.filter((c) => c.parentId === parentId);
  },

  getChildById: async (id: string): Promise<Child | null> => {
    const all = storageService.getChildren();
    return all.find((c) => c.id === id) || null;
  },

  getAllChildren: async (): Promise<Child[]> => {
    return storageService.getChildren();
  },

  addChild: async (intake: ChildIntakeForm | any, parentId?: string, parentName?: string): Promise<Child> => {
    const pId = parentId || intake.parentId || 'parent-1';
    const pName = parentName || intake.parentName || 'Parent User';

    const newChild: Child = {
      id: `child-${Date.now()}`,
      parentId: pId,
      parentName: pName,
      name: intake.name,
      dob: intake.dob,
      age: intake.age || 4,
      gender: intake.gender || 'Male',
      supportIndicator: 'LOW',
      therapyStatus: 'NOT_STARTED',
      assessmentStatus: 'PENDING',
      parentNotes: intake.parentNotes,
      school: intake.school,
      grade: intake.grade,
      avatarUrl: `https://images.unsplash.com/photo-1543332164-6e82f355badc?w=150`
    };

    storageService.addChild(newChild);
    return newChild;
  },

  updateSupportIndicator: async (childId: string, level: Child['supportIndicator']): Promise<Child> => {
    const updated = storageService.updateChild(childId, { supportIndicator: level, assessmentStatus: 'COMPLETED' });
    if (!updated) throw new Error('Child not found');
    return updated;
  },

  assignTherapist: async (childId: string, therapistId: string, therapistName: string): Promise<Child> => {
    const updated = storageService.updateChild(childId, {
      assignedTherapistId: therapistId,
      assignedTherapistName: therapistName,
      therapyStatus: 'ACTIVE'
    });
    if (!updated) throw new Error('Child not found');
    return updated;
  }
};
