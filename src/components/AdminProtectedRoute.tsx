import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useMultiTenant';
import { useIsSystemAdmin } from '@/hooks/useIsSystemAdmin';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { AdminLoginPage } from '@/components/admin/AdminLoginPage';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

export const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const { data: isSystemAdmin, isLoading: adminCheckLoading } = useIsSystemAdmin();

  const loading = authLoading || adminCheckLoading;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Renderizar AdminLoginPage inline se não houver usuário
  if (!user) {
    return <AdminLoginPage />;
  }

  if (!isSystemAdmin) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};