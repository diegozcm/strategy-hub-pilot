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

  // Verificação simplificada: hardcoded ou profile admin
  const isHardcodedAdmin = user.email === 'admin@example.com' || user.email === 'diego@cofound.com.br';
  const isProfileAdmin = profile?.role === 'admin';
  
  if (!isHardcodedAdmin && !isProfileAdmin) {
    return <Navigate to="/auth" replace />;
  }
  return <>{children}</>;
};