export type Role = 'PARENT' | 'THERAPIST' | 'ADMIN';

export interface UserSession {
  id: string;
  email: string;
  name: string;
  role: Role;
  avatarUrl?: string;
  phone?: string;
  status?: string;
  parentProfileId?: string;
  therapistProfileId?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  role?: Role;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  name: string;
  role: Role;
  phone?: string;
  child?: {
    name: string;
    dob: string;
    gender: 'Male' | 'Female' | 'Other' | string;
    school?: string;
    grade?: string;
    parent_notes?: string;
  };
}

export interface AuthState {
  user: UserSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}
