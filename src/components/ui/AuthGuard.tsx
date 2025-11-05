import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useMultiTenant';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
  requireActiveProfile?: boolean;
  fallbackPath?: string;
  loadingComponent?: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  requireAuth = true,
  requireAdmin = false,
  requireActiveProfile = true,
  fallbackPath = '/auth',
  loadingComponent
}) => {
  const { user, profile, loading } = useAuth();

  // Show loading spinner while auth state is being determined
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        {loadingComponent || <LoadingSpinner size="lg" />}
      </div>
    );
  }

  // Check authentication requirement
  if (requireAuth && !user) {
    return <Navigate to={fallbackPath} replace />;
  }

  // Check admin requirement (via context)
  if (requireAdmin) {
    const { isSystemAdmin } = useAuth();
    
    if (!isSystemAdmin) {
      return <Navigate to="/auth" replace />;
    }
  }

  // Check active profile requirement
  if (requireActiveProfile && profile?.status === 'pending') {
    // Don't redirect, let the error be handled by parent component
    // This allows forms to show appropriate pending status messages
    return <>{children}</>;
  }

  if (requireActiveProfile && profile?.status === 'inactive') {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};