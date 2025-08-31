import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useMultiTenant';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

export const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({ children }) => {
  const { user, profile, loading } = useAuth();

  console.log('AdminProtectedRoute - Auth state:', { user: !!user, profile: !!profile, profileRole: profile?.role, loading });

  if (loading) {
    console.log('AdminProtectedRoute - Still loading...');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    console.log('AdminProtectedRoute - No user, redirecting to admin login');
    return <Navigate to="/admin-login" replace />;
  }

  // Verificação dupla: perfil carregado E por email como fallback
  const isAdmin = profile?.role === 'admin' || 
                  user.email === 'admin@example.com' || 
                  user.email === 'diego@cofound.com.br';

  if (!isAdmin) {
    console.log('AdminProtectedRoute - User is not admin, redirecting to regular auth');
    return <Navigate to="/auth" replace />;
  }

  console.log('AdminProtectedRoute - Admin access granted');
  return <>{children}</>;
};