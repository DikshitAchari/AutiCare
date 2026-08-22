import React, { createContext, useContext, useEffect, useState } from 'react';
import type { AuthState, UserSession, LoginCredentials, RegisterCredentials } from '../types/auth';
import { authApi } from '../services/api/authApi';
import { storageService } from '../services/storage/storageService';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<UserSession>;
  register: (credentials: RegisterCredentials) => Promise<UserSession>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>(() => {
    const savedUser = storageService.getAuthToken() ? storageService.getUserSession() : null;
    return {
      user: savedUser,
      isAuthenticated: !!savedUser,
      isLoading: !!storageService.getAuthToken(),
      error: null
    };
  });

  const login = async (credentials: LoginCredentials): Promise<UserSession> => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await authApi.login(credentials);
      const session = await authApi.getCurrentUser(response.token);
      storageService.setAuthToken(response.token);
      storageService.setUserSession(session);
      setState({
        user: session,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });
      return session;
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Login failed';
      setState((prev) => ({ ...prev, isLoading: false, error: errMsg }));
      throw err;
    }
  };

  const register = async (credentials: RegisterCredentials): Promise<UserSession> => authApi.register(credentials);

  useEffect(() => {
    const token = storageService.getAuthToken();
    if (!token) return;

    authApi.getCurrentUser(token).then((user) => {
      storageService.setUserSession(user);
      setState({ user, isAuthenticated: true, isLoading: false, error: null });
    }).catch(() => {
      storageService.clearAuthToken();
      storageService.clearUserSession();
      setState({ user: null, isAuthenticated: false, isLoading: false, error: null });
    });
  }, []);

  const logout = () => {
    storageService.clearAuthToken();
    storageService.clearUserSession();
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null
    });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
