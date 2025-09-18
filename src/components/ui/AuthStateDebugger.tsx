import React, { useEffect } from 'react';
import { useAuth } from '@/hooks/useMultiTenant';

export const AuthStateDebugger: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile, company, loading } = useAuth();

  useEffect(() => {
    const debugInfo = {
      user: !!user,
      userEmail: user?.email,
      profile: !!profile,
      profileStatus: profile?.status,
      company: !!company,
      companyName: company?.name,
      loading
    };

    console.log('🔍 Auth State Debug:', debugInfo);

    // Detect potential blank screen scenarios
    if (!loading && !user && !profile) {
      console.warn('⚠️ Auth State: No user or profile loaded, potential blank screen');
    }

    if (!loading && user && !profile) {
      console.warn('⚠️ Auth State: User exists but no profile loaded, potential blank screen');
    }

    if (loading && Date.now() > (window as any).appStartTime + 10000) {
      console.error('🚨 Auth State: Loading state stuck for more than 10 seconds!');
    }
  }, [user, profile, company, loading]);

  // Add loading timestamp on app start
  useEffect(() => {
    (window as any).appStartTime = Date.now();
  }, []);

  return <>{children}</>;
};