
import React from 'react';
// Prevent admins from accessing normal app - redirect to admin panel
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useMultiTenant';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, profile, company, loading, session } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user || !session) {
    return <Navigate to="/auth" replace />;
  }

  if (!profile) {
    return <Navigate to="/auth" replace />;
  }

  // Additional session validation
  if (session && session.expires_at && session.expires_at * 1000 < Date.now()) {
    console.warn('⚠️ Expired session detected in ProtectedRoute');
    return <Navigate to="/auth" replace />;
  }

  // Check if user needs to select a company
  if (!company && profile.status === 'active') {
    return <Navigate to="/company-selection" replace />;
  }

  return <>{children}</>;
};
