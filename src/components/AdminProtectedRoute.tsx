import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useMultiTenant';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

export const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({ children }) => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin-login" replace />;
  }

  // Verificação de acesso admin: hardcoded emails ou perfil admin ativo
  const isSystemAdmin = (
    (user.email === 'admin@example.com' || user.email === 'diego@cofound.com.br') ||
    (profile?.role === 'admin' && profile?.status === 'active')
  );
  
  if (!isSystemAdmin) {
    return <Navigate to="/auth" replace />;
  }
  return <>{children}</>;
};