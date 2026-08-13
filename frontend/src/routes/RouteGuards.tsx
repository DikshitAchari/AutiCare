import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

export const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export const RoleRoute: React.FC<{ allowedRole: 'PARENT' | 'THERAPIST' | 'ADMIN' }> = ({ allowedRole }) => {
  const { user } = useAuth();

  if (!user || user.role !== allowedRole) {
    return <Navigate to={`/${user?.role.toLowerCase() || 'parent'}/dashboard`} replace />;
  }

  return <Outlet />;
};
