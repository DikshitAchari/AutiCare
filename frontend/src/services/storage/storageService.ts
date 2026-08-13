import { INITIAL_APPOINTMENTS } from '../../data/mockAppointments';
import { INITIAL_CHILDREN } from '../../data/mockChildren';
import { INITIAL_BEHAVIOR_RECORDS } from '../../data/mockBehaviors';
import { INITIAL_REPORTS } from '../../data/mockReports';
import { INITIAL_NOTIFICATIONS } from '../../data/mockNotifications';
import { INITIAL_THREADS, INITIAL_MESSAGES } from '../../data/mockMessages';
import { MOCK_PARENTS, MOCK_THERAPISTS } from '../../data/mockUsers';
import type { Child } from '../../types/child';
import type { TherapistUser } from '../../types/user';
import type { UserSession } from '../../types/auth';
import type { AssessmentResult } from '../../types/assessment';

const STORAGE_KEYS = {
  AUTH_USER: 'autism_system_auth_user',
  APPOINTMENTS: 'autism_system_appointments',
  CHILDREN: 'autism_system_children',
  BEHAVIORS: 'autism_system_behaviors',
  REPORTS: 'autism_system_reports',
  NOTIFICATIONS: 'autism_system_notifications',
  THREADS: 'autism_system_chat_threads',
  MESSAGES: 'autism_system_chat_messages',
  THERAPISTS: 'autism_system_therapists',
  PARENTS: 'autism_system_parents',
  ASSESSMENTS: 'autism_system_assessments'
};

export const storageService = {
  get: <T>(key: string, fallback: T): T => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : fallback;
    } catch (e) {
      console.warn(`Error reading localStorage key "${key}":`, e);
      return fallback;
    }
  },

  set: <T>(key: string, value: T): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn(`Error setting localStorage key "${key}":`, e);
    }
  },

  // Auth session
  getUserSession: (): UserSession | null => storageService.get<UserSession | null>(STORAGE_KEYS.AUTH_USER, null),
  setUserSession: (session: UserSession) => storageService.set(STORAGE_KEYS.AUTH_USER, session),
  clearUserSession: () => localStorage.removeItem(STORAGE_KEYS.AUTH_USER),

  // Appointments
  getAppointments: () => storageService.get(STORAGE_KEYS.APPOINTMENTS, INITIAL_APPOINTMENTS),
  saveAppointments: (data: typeof INITIAL_APPOINTMENTS) => storageService.set(STORAGE_KEYS.APPOINTMENTS, data),

  // Children
  getChildren: (): Child[] => storageService.get(STORAGE_KEYS.CHILDREN, INITIAL_CHILDREN),
  saveChildren: (data: Child[]) => storageService.set(STORAGE_KEYS.CHILDREN, data),
  addChild: (child: Child) => {
    const current = storageService.getChildren();
    storageService.saveChildren([...current, child]);
  },
  updateChild: (id: string, partial: Partial<Child>): Child | null => {
    const current = storageService.getChildren();
    const idx = current.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    const updated = { ...current[idx], ...partial };
    current[idx] = updated;
    storageService.saveChildren(current);
    return updated;
  },

  // Therapists
  getTherapists: (): TherapistUser[] => storageService.get(STORAGE_KEYS.THERAPISTS, MOCK_THERAPISTS),
  saveTherapists: (data: TherapistUser[]) => storageService.set(STORAGE_KEYS.THERAPISTS, data),
  updateTherapist: (id: string, partial: Partial<TherapistUser>): TherapistUser | null => {
    const current = storageService.getTherapists();
    const idx = current.findIndex((t) => t.id === id);
    if (idx === -1) return null;
    const updated = { ...current[idx], ...partial };
    current[idx] = updated;
    storageService.saveTherapists(current);
    return updated;
  },

  // Assessment Results
  getAssessmentResults: (): AssessmentResult[] => storageService.get(STORAGE_KEYS.ASSESSMENTS, []),
  addAssessmentResult: (result: AssessmentResult) => {
    const current = storageService.getAssessmentResults();
    storageService.set(STORAGE_KEYS.ASSESSMENTS, [result, ...current]);
  },

  // Other entities
  getBehaviors: () => storageService.get(STORAGE_KEYS.BEHAVIORS, INITIAL_BEHAVIOR_RECORDS),
  saveBehaviors: (data: typeof INITIAL_BEHAVIOR_RECORDS) => storageService.set(STORAGE_KEYS.BEHAVIORS, data),

  getReports: () => storageService.get(STORAGE_KEYS.REPORTS, INITIAL_REPORTS),
  saveReports: (data: typeof INITIAL_REPORTS) => storageService.set(STORAGE_KEYS.REPORTS, data),

  getNotifications: () => storageService.get(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS),
  saveNotifications: (data: typeof INITIAL_NOTIFICATIONS) => storageService.set(STORAGE_KEYS.NOTIFICATIONS, data),

  getThreads: () => storageService.get(STORAGE_KEYS.THREADS, INITIAL_THREADS),
  saveThreads: (data: typeof INITIAL_THREADS) => storageService.set(STORAGE_KEYS.THREADS, data),

  getMessages: () => storageService.get(STORAGE_KEYS.MESSAGES, INITIAL_MESSAGES),
  saveMessages: (data: typeof INITIAL_MESSAGES) => storageService.set(STORAGE_KEYS.MESSAGES, data),

  getParents: () => storageService.get(STORAGE_KEYS.PARENTS, MOCK_PARENTS),
  saveParents: (data: typeof MOCK_PARENTS) => storageService.set(STORAGE_KEYS.PARENTS, data),

  resetAll: () => {
    Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
  },

  KEYS: STORAGE_KEYS
};
