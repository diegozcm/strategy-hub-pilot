import React from 'react';
import { Navigate } from 'react-router-dom';
import { useDefaultRoute } from '@/hooks/useDefaultRoute';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export const ModuleBasedRedirect: React.FC = () => {
  const { getDefaultRoute, loading } = useDefaultRoute();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const defaultRoute = getDefaultRoute();
  console.log('🔀 ModuleBasedRedirect - Redirecting to:', defaultRoute);
  
  return <Navigate to={defaultRoute} replace />;
};
