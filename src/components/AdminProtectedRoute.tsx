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
  const [mfaStatus, setMfaStatus] = useState<'loading' | 'no-factors' | 'needs-verify' | 'verified'>('loading');

  useEffect(() => {
    const checkMFAStatus = async () => {
      if (!user) {
        setMfaStatus('loading');
        return;
      }

      try {
        // Check if user has any verified MFA factors
        const { data: factorsData } = await supabase.auth.mfa.listFactors();
        const verifiedFactors = factorsData?.totp?.filter(f => f.status === 'verified') || [];

        if (verifiedFactors.length === 0) {
          // Admin has no MFA configured - must set up
          setMfaStatus('no-factors');
          return;
        }

        // Has factors, check if verified in this session
        const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        
        if (aalData?.currentLevel !== 'aal2') {
          // Has MFA but needs to verify in this session
          setMfaStatus('needs-verify');
        } else {
          // Fully authenticated with MFA
          setMfaStatus('verified');
        }
      } catch (err) {
        console.error('Error checking MFA status:', err);
        setMfaStatus('no-factors');
      }
    };

    checkMFAStatus();
  }, [user]);

  const loading = authLoading || adminCheckLoading || mfaStatus === 'loading';

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

  // Admin without MFA configured - force setup
  if (mfaStatus === 'no-factors') {
    return <Navigate to="/admin-mfa-setup" replace />;
  }

  // Admin with MFA but needs to verify in this session
  if (mfaStatus === 'needs-verify') {
    return <Navigate to="/admin-mfa-verify" replace />;
  }

  return <>{children}</>;
};