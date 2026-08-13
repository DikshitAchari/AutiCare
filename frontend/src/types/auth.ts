export type Role = 'PARENT' | 'THERAPIST' | 'ADMIN';

export interface UserSession {
  id: string;
  email: string;
  name: string;
  role: Role;
  avatarUrl?: string;
  parentProfileId?: string;
  therapistProfileId?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  role?: Role;
}

export interface AuthState {
  user: UserSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}
