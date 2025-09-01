import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useMultiTenant';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

export const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({ children }) => {
  const { user, profile, loading } = useAuth();

  console.log('AdminProtectedRoute - Auth state:', { 
    user: !!user, 
    userEmail: user?.email,
    profile: !!profile, 
    profileRole: profile?.role, 
    loading 
  });

  if (loading) {
    console.log('AdminProtectedRoute - Still loading...');
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    console.log('AdminProtectedRoute - No user, redirecting to admin login');
    return <Navigate to="/admin-login" replace />;
  }

  // Verificação robusta: admins hardcoded têm prioridade sobre perfil
  const isHardcodedAdmin = user.email === 'admin@example.com' || user.email === 'diego@cofound.com.br';
  const isProfileAdmin = profile?.role === 'admin';
  const isAdmin = isHardcodedAdmin || isProfileAdmin;

  console.log('AdminProtectedRoute - Admin check:', { 
    isHardcodedAdmin, 
    isProfileAdmin, 
    isAdmin,
    userEmail: user.email 
  });

  if (!isAdmin) {
    console.log('AdminProtectedRoute - User is not admin, redirecting to regular auth');
    return <Navigate to="/auth" replace />;
  }

  console.log('AdminProtectedRoute - Admin access granted');
  return <>{children}</>;
};