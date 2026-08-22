import type { LoginCredentials, RegisterCredentials, UserSession } from '../../types/auth';
import { request } from './apiClient';

interface TokenResponse {
  access_token: string;
  token_type: string;
  user: BackendUser;
}

interface BackendUser {
  id: number;
  email: string;
  name: string;
  role: string;
  phone?: string | null;
  status?: string | null;
}

const toSession = (user: BackendUser): UserSession => ({
  id: String(user.id),
  email: user.email,
  name: user.name,
  role: user.role.toUpperCase() as UserSession['role'],
  phone: user.phone ?? undefined,
  status: user.status ?? undefined
});

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<{ token: string; user: UserSession }> => {
    const response = await request<TokenResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
    return { token: response.access_token, user: toSession(response.user) };
  },

  register: async (credentials: RegisterCredentials): Promise<UserSession> => {
    const response = await request<TokenResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
    return toSession(response.user);
  },

  getCurrentUser: (token: string): Promise<UserSession> =>
    request<BackendUser>('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } }).then(toSession)
};
