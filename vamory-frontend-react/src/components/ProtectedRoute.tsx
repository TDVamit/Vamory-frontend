import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth0Custom } from '../hooks/useAuth0';

interface ProtectedRouteProps {
  children: ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading } = useAuth0Custom();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen surface-dark flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-400 bg-gray-800/30 backdrop-blur-sm px-6 py-3 rounded-xl border border-gray-600/20">
          <div className="w-8 h-8 border-2 border-gray-500/30 border-t-gray-400 rounded-full animate-spin" />
          <span className="text-lg font-medium">Loading Vamory...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to home page with return url
    return <Navigate to="/home" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}; 