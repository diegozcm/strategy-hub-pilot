import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useMultiTenant';
import { useIsSystemAdmin } from '@/hooks/useIsSystemAdmin';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { AdminLoginPage } from '@/components/admin/AdminLoginPage';
import { supabase } from '@/integrations/supabase/client';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

export const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const { data: isSystemAdmin, isLoading: adminCheckLoading } = useIsSystemAdmin();
  const [mfaRequired, setMfaRequired] = useState<boolean | null>(null);
  const [checkingMFA, setCheckingMFA] = useState(true);

  useEffect(() => {
    const checkMFAStatus = async () => {
      if (!user) {
        setCheckingMFA(false);
        return;
      }

      try {
        const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        
        // Check if user has MFA enabled but hasn't verified yet
        if (aalData?.nextLevel === 'aal2' && aalData?.currentLevel !== 'aal2') {
          setMfaRequired(true);
        } else {
          setMfaRequired(false);
        }
      } catch (err) {
        console.error('Error checking MFA status:', err);
        setMfaRequired(false);
      } finally {
        setCheckingMFA(false);
      }
    };

    checkMFAStatus();
  }, [user]);

  const loading = authLoading || adminCheckLoading || checkingMFA;

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

  // Redirect to MFA verification if required
  if (mfaRequired) {
    return <Navigate to="/admin-mfa-verify" replace />;
  }

  return <>{children}</>;
};