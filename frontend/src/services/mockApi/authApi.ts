import type { LoginCredentials, UserSession } from '../../types/auth';
import { mockUsers } from '../../data/mockUsers';
import { storageService } from '../storage/storageService';

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<UserSession> => {
    const user = mockUsers.find(
      (u) => u.email.toLowerCase() === credentials.email.toLowerCase() && u.role === credentials.role
    );

    if (!user) {
      throw new Error(`Invalid credentials or user not found for role ${credentials.role}`);
    }

    if (credentials.password !== '123456') {
      throw new Error('Invalid password. Demo password is 123456');
    }

    const session: UserSession = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatarUrl: user.avatarUrl
    };

    storageService.setUserSession(session);
    return session;
  },

  logout: async (): Promise<void> => {
    storageService.clearUserSession();
  },

  getCurrentSession: (): UserSession | null => {
    return storageService.getUserSession();
  }
};
