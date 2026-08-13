import React, { createContext, useContext, useState } from 'react';
import type { AuthState, UserSession, LoginCredentials } from '../types/auth';
import { authApi } from '../services/mockApi/authApi';
import { storageService } from '../services/storage/storageService';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<UserSession>;
  logout: () => void;
  quickSwitchRole: (role: 'PARENT' | 'THERAPIST' | 'ADMIN') => Promise<UserSession>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>(() => {
    const savedUser = storageService.get<UserSession | null>(storageService.KEYS.AUTH_USER, null);
    return {
      user: savedUser,
      isAuthenticated: !!savedUser,
      isLoading: false,
      error: null
    };
  });

  const login = async (credentials: LoginCredentials): Promise<UserSession> => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const session = await authApi.login(credentials);
      storageService.set(storageService.KEYS.AUTH_USER, session);
      setState({
        user: session,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });
      return session;
    } catch (err: any) {
      const errMsg = err?.message || 'Login failed';
      setState((prev) => ({ ...prev, isLoading: false, error: errMsg }));
      throw err;
    }
  };

  const logout = () => {
    storageService.set(storageService.KEYS.AUTH_USER, null);
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null
    });
  };

  const quickSwitchRole = async (role: 'PARENT' | 'THERAPIST' | 'ADMIN'): Promise<UserSession> => {
    const emails = {
      PARENT: 'parent@test.com',
      THERAPIST: 'therapist@test.com',
      ADMIN: 'admin@test.com'
    };
    return login({ email: emails[role], password: '123456', role });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout, quickSwitchRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
