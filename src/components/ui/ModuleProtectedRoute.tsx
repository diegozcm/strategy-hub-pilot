import React from 'react';
import { Navigate } from 'react-router-dom';
import { useModules } from '@/hooks/useModules';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface ModuleProtectedRouteProps {
  children: React.ReactNode;
  requiredModule: string;
  fallbackPath?: string;
}

export const ModuleProtectedRoute: React.FC<ModuleProtectedRouteProps> = ({
  children,
  requiredModule,
  fallbackPath = '/app/dashboard'
}) => {
  const { hasModuleAccess, loading } = useModules();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!hasModuleAccess(requiredModule)) {
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
};