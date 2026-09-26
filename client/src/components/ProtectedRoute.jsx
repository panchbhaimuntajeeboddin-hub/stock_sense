import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert } from 'lucide-react';

export const ProtectedRoute = ({ allowedRoles = [] }) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center space-y-4">
        <div className="p-4 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-2xl">
          <ShieldAlert className="w-12 h-12" />
        </div>
        <h2 className="text-xl font-bold text-white">403 - Access Denied</h2>
        <p className="text-xs text-slate-400 max-w-md">
          Your role (<strong className="text-purple-300">{user?.role}</strong>) does not have permission to access this protected area.
        </p>
      </div>
    );
  }

  return <Outlet />;
};
