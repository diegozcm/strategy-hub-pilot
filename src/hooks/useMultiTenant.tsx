import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { UserProfile, Company, Permission, AuthContextType, UserRole } from '@/types/auth';
import { FirstLoginModal } from '@/components/ui/FirstLoginModal';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const MultiTenantAuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [showFirstLoginModal, setShowFirstLoginModal] = useState(false);
  
  // Logout state to prevent automatic re-login
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  // Impersonation state
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [originalAdmin, setOriginalAdmin] = useState<UserProfile | null>(null);
  const [impersonationSession, setImpersonationSession] = useState<any>(null);
  
  const navigate = useNavigate();

  // Calculate permissions based on role
  const getPermissions = (role: UserRole): Permission => {
    switch (role) {
      case 'admin':
        return { read: true, write: true, delete: true, admin: true };
      case 'manager':
        return { read: true, write: true, delete: true };
      case 'member':
        return { read: true, write: false, delete: false };
      default:
        return { read: false, write: false, delete: false };
    }
  };

  const permissions = profile ? getPermissions(profile.role) : { read: false, write: false, delete: false };
  const canEdit = permissions.write;
  const canDelete = permissions.delete;
  const canAdmin = permissions.admin || false;
  const isSystemAdmin = profile?.role === 'admin';
  const isCompanyAdmin = profile?.role === 'admin';

  // Handle first login password change
  const handleFirstLoginPasswordChange = () => {
    console.log('✅ Password changed successfully - refreshing profile');
    setShowFirstLoginModal(false);
    
    // Refresh profile to get updated must_change_password flag
    if (user) {
      loadUserProfile(user.id);
    }
  };

  // Handle first login modal close (logout user)
  const handleFirstLoginModalClose = () => {
    console.log('❌ First login modal closed without password change - logging out');
    setShowFirstLoginModal(false);
    signOut();
  };

  // Load profile data - simplified version without auth.users access
  const loadUserProfile = async (userId: string) => {
    try {
      console.log(`📋 Loading profile for user ${userId}`);
      
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (profileError) {
        console.error('Profile fetch error:', profileError);
        
        // If profile not found, user needs to be created by trigger
        if (profileError.code === 'PGRST116') {
          console.log('👤 Profile not found - may need to be created by system');
          setProfile(null);
          return;
        }
        
        throw profileError;
      }

      console.log('📋 Profile loaded successfully:', profile);
      setProfile(profile as UserProfile);

      // Check if user must change password
      if (profile?.must_change_password === true) {
        console.log('🔐 User must change password - showing modal');
        setShowFirstLoginModal(true);
      }

      // Check if there's a persisted company selection
      const persistedCompanyId = localStorage.getItem('selectedCompanyId');
      if (persistedCompanyId) {
        console.log('🏢 Loading persisted company:', persistedCompanyId);
        // Verify user still has access to this company
        const hasAccess = await verifyCompanyAccess(userId, persistedCompanyId);
        if (hasAccess) {
          await loadCompanyById(persistedCompanyId);
        } else {
          console.log('❌ User no longer has access to persisted company');
          localStorage.removeItem('selectedCompanyId');
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfile(null);
    }
  };

  // Verify if user has access to a specific company
  const verifyCompanyAccess = async (userId: string, companyId: string) => {
    try {
      const { data } = await supabase
        .from('user_company_relations')
        .select('company_id')
        .eq('user_id', userId)
        .eq('company_id', companyId)
        .single();

      return !!data;
    } catch (error) {
      console.error('Error verifying company access:', error);
      return false;
    }
  };

  // Load company by ID
  const loadCompanyById = async (companyId: string) => {
    try {
      const { data: companyData, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single();

      if (error) {
        console.error('Error fetching company:', error);
        return;
      }

      if (companyData.status === 'inactive') {
        console.log('❌ Company is inactive, redirecting to error page');
        navigate('/company-inactive');
        return;
      }

      setCompany({
        ...companyData,
        active: companyData.status === 'active'
      } as Company);
    } catch (error) {
      console.error('Error loading company:', error);
    }
  };

  // Fetch companies by type for the current user
  const fetchCompaniesByType = async (companyType: 'startup' | 'regular') => {
    if (!user) return [];

    try {
      // Para admins, buscar todas as empresas do tipo solicitado
      if (isSystemAdmin) {
        const { data, error } = await supabase
          .from('companies')
          .select('*')
          .eq('status', 'active')
          .eq('company_type', companyType)
          .order('name');

        if (error) throw error;
        return data || [];
      }

      // Para usuários não-admin, buscar apenas empresas às quais têm acesso
      const { data, error } = await supabase
        .from('user_company_relations')
        .select(`
          company_id,
          companies!inner (
            id,
            name,
            status,
            company_type,
            owner_id,
            mission,
            vision,
            values,
            logo_url,
            created_at,
            updated_at
          )
        `)
        .eq('user_id', user.id)
        .eq('companies.status', 'active')
        .eq('companies.company_type', companyType);

      if (error) throw error;
      
      return data?.map(relation => relation.companies).filter(Boolean) || [];
    } catch (error) {
      console.error('Error fetching companies by type:', error);
      return [];
    }
  };

  // Fetch all companies for the current user (for modules like StrategyHUB)
  const fetchAllUserCompanies = async () => {
    if (!user) return [];

    try {
      // Para admins, buscar todas as empresas
      if (isSystemAdmin) {
        const { data, error } = await supabase
          .from('companies')
          .select('*')
          .eq('status', 'active')
          .order('name');

        if (error) throw error;
        return data || [];
      }

      // Para usuários não-admin, buscar todas as empresas às quais têm acesso
      const { data, error } = await supabase
        .from('user_company_relations')
        .select(`
          company_id,
          companies!inner (
            id,
            name,
            status,
            company_type,
            owner_id,
            mission,
            vision,
            values,
            logo_url,
            created_at,
            updated_at
          )
        `)
        .eq('user_id', user.id)
        .eq('companies.status', 'active');

      if (error) throw error;
      
      return data?.map(relation => relation.companies).filter(Boolean) || [];
    } catch (error) {
      console.error('Error fetching all user companies:', error);
      return [];
    }
  };

  // Validate session token
  const validateSession = async (session: any): Promise<boolean> => {
    try {
      if (!session?.access_token) return false;
      
      // Check if token is expired
      const tokenExpiry = session.expires_at * 1000;
      const now = Date.now();
      const bufferTime = 60 * 1000; // 1 minute buffer
      
      if (now >= (tokenExpiry - bufferTime)) {
        console.log('🔄 Token expiring soon, refreshing...');
        const { data: { session: newSession }, error } = await supabase.auth.refreshSession();
        
        if (error || !newSession) {
          console.error('❌ Session refresh failed:', error?.message);
          return false;
        }
        
        setSession(newSession);
        setUser(newSession.user);
        return true;
      }
      
      return true;
    } catch (error) {
      console.error('❌ Session validation error:', error);
      return false;
    }
  };

  // Clear company selection without logout
  const clearCompanySelection = () => {
    console.log('🏢 Clearing company selection');
    setCompany(null);
    setSelectedCompanyId(null);
    localStorage.removeItem('selectedCompanyId');
    
    if (profile) {
      setProfile({
        ...profile,
        company_id: undefined,
        company: undefined
      });
    }
  };

  // Switch company (for system admins and users with multiple companies)
  const switchCompany = async (companyId: string) => {
    try {
      console.log('🏢 Switching to company:', companyId);
      setLoading(true);
      
      // Update the user's current company in the profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ company_id: companyId })
        .eq('id', profile?.id);

      if (updateError) {
        console.error('❌ Error updating profile company:', updateError);
        throw updateError;
      }

      // Fetch the company data
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single();

      if (companyError) {
        console.error('❌ Error fetching company:', companyError);
        throw companyError;
      }

      // Update states
      setCompany({
        ...companyData,
        active: companyData.status === 'active'
      } as Company);
      setSelectedCompanyId(companyId);
      
      // Update profile with new company
      if (profile) {
        setProfile({
          ...profile,
          company_id: companyId,
          company: {
            ...companyData,
            active: companyData.status === 'active'
          } as Company
        });
      }

      // Update localStorage
      localStorage.setItem('selectedCompanyId', companyId);

      console.log('✅ Successfully switched to company:', companyData.name);
      
    } catch (error) {
      console.error('❌ Error switching company:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Initialize auth state
  useEffect(() => {
    console.log('📊 MultiTenantAuthProvider: Initializing...');
    
    // Auth state listener - improved with validation and logout prevention
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 Auth state change:', event, !!session);
        
        // Prevent automatic re-login during logout process
        if (isLoggingOut && event === 'INITIAL_SESSION') {
          console.log('🚪 Ignoring INITIAL_SESSION during logout process');
          return;
        }
        
        if (event === 'SIGNED_IN' && session) {
          console.log('👤 User found, loading profile for:', session.user.email);
          const isValid = await validateSession(session);
          
          if (isValid) {
            setSession(session);
            setUser(session.user);
            setTimeout(() => {
              loadUserProfile(session.user.id);
            }, 100);
          } else {
            console.warn('⚠️ Invalid session on SIGNED_IN, signing out');
            await signOut();
            return;
          }
        } else if (event === 'SIGNED_OUT' || !session) {
          console.log('❌ No user session, clearing state');
          setUser(null);
          setSession(null);
          setProfile(null);
          setCompany(null);
          setSelectedCompanyId(null);
          setIsImpersonating(false);
          setOriginalAdmin(null);
          setImpersonationSession(null);
          setShowFirstLoginModal(false);
          localStorage.removeItem('selectedCompanyId');
        } else if (event === 'TOKEN_REFRESHED' && session) {
          console.log('🔄 Token refreshed');
          setSession(session);
          setUser(session.user);
        } else if (event === 'INITIAL_SESSION' && session) {
          console.log('👤 User found, loading profile for:', session.user.email);
          const isValid = await validateSession(session);
          
          if (isValid) {
            setSession(session);
            setUser(session.user);
            setTimeout(() => {
              loadUserProfile(session.user.id);
            }, 100);
          } else {
            console.warn('⚠️ Invalid initial session, signing out');
            await signOut();
            return;
          }
        }
        
        setLoading(false);
      }
    );

    // Check existing session with validation
    console.log('🔍 Checking existing session...');
    supabase.auth.getSession()
      .then(async ({ data: { session }, error }) => {
        console.log('🔍 Existing session check result:', !!session);
        if (error) {
          console.error('❌ Session check error:', error);
          localStorage.removeItem('sb-pdpzxjlnaqwlyqoyoyhr-auth-token');
          localStorage.removeItem('selectedCompanyId');
          setLoading(false);
          return;
        }
        
        if (session) {
          const isValid = await validateSession(session);
          if (!isValid) {
            console.warn('⚠️ Invalid existing session, clearing');
            localStorage.removeItem('sb-pdpzxjlnaqwlyqoyoyhr-auth-token');
            localStorage.removeItem('selectedCompanyId');
            setLoading(false);
            return;
          }
        } else {
          console.log('❌ No existing session found');
          setLoading(false);
        }
        // If session exists and is valid, the auth state listener will handle it
      })
      .catch((error) => {
        console.error('❌ Critical session check error:', error);
        setLoading(false);
        localStorage.removeItem('sb-pdpzxjlnaqwlyqoyoyhr-auth-token');
        localStorage.removeItem('selectedCompanyId');
      });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ Sign in error:', error);
        return { error };
      }

      console.log('✅ Sign in successful');
      return { error: null };
    } catch (error) {
      console.error('❌ Unexpected sign in error:', error);
      return { error };
    }
  };

  const signUp = async (email: string, password: string) => {
    // Remover emailRedirectTo - não precisamos mais de confirmação por email
    const { error } = await supabase.auth.signUp({
      email,
      password
    });

    return { error };
  };

  const signOut = async () => {
    try {
      console.log('🚪 Starting sign out process...');
      
      // Set logout flag to prevent automatic re-login
      setIsLoggingOut(true);
      
      // Determine user type for appropriate redirect
      const isAdmin = profile?.role === 'admin';
      const redirectPath = isAdmin ? '/admin-login' : '/auth';
      
      // Clear local state first
      setUser(null);
      setSession(null);
      setProfile(null);
      setCompany(null);
      setSelectedCompanyId(null);
      setIsImpersonating(false);
      setOriginalAdmin(null);
      setImpersonationSession(null);
      setShowFirstLoginModal(false);
      
      // Clear ALL Supabase-related localStorage keys
      const keysToRemove = [
        'selectedCompanyId',
        'sb-pdpzxjlnaqwlyqoyoyhr-auth-token',
        'supabase.auth.token',
        'sb-auth-token'
      ];
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        console.log(`🧹 Cleared localStorage key: ${key}`);
      });
      
      // Sign out from Supabase with local scope to force complete logout
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      
      if (error) {
        console.warn('⚠️ Supabase sign out error (continuing anyway):', error);
      } else {
        console.log('✅ Supabase sign out successful');
      }
      
      // Reset logout flag after a delay to allow for navigation
      setTimeout(() => {
        setIsLoggingOut(false);
      }, 1000);
      
      // Always navigate regardless of errors
      console.log(`🔄 Redirecting to ${redirectPath}`);
      navigate(redirectPath);
      
    } catch (error) {
      console.error('❌ Unexpected sign out error:', error);
      // Reset logout flag and force navigation even on unexpected errors
      setIsLoggingOut(false);
      const redirectPath = profile?.role === 'admin' ? '/admin-login' : '/auth';
      navigate(redirectPath);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return { error: new Error('No user logged in') };

    const { error } = await supabase
      .from('profiles')
      .update(updates as any)
      .eq('user_id', user.id);

    if (!error && profile) {
      setProfile({ ...profile, ...updates });
    }

    return { error };
  };

  // Start impersonation (admin only)
  const startImpersonation = async (targetUserId: string) => {
    if (!user || !isSystemAdmin) {
      return { error: new Error('Only admins can start impersonation') };
    }

    try {
      console.log('🎭 Starting impersonation of user:', targetUserId);
      
      // Call Supabase function to create impersonation session
      const { data: sessionId, error } = await supabase.rpc('start_impersonation', {
        _admin_id: user.id,
        _target_user_id: targetUserId
      });

      if (error) throw error;

      // Fetch target user profile
      const { data: targetProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', targetUserId)
        .single();

      if (profileError || !targetProfile) {
        throw new Error('Target user profile not found');
      }

      // Store current admin profile
      setOriginalAdmin(profile);
      
      // Switch to impersonated user
      setProfile(targetProfile as UserProfile);
      setIsImpersonating(true);
      setImpersonationSession({ id: sessionId, admin_user_id: user.id, impersonated_user_id: targetUserId });

      console.log('✅ Impersonation started successfully');
      return { error: null };
    } catch (error) {
      console.error('❌ Error starting impersonation:', error);
      return { error };
    }
  };

  // End impersonation
  const endImpersonation = async () => {
    if (!user || !isImpersonating || !originalAdmin) {
      return { error: new Error('No active impersonation session') };
    }

    try {
      console.log('🎭 Ending impersonation...');
      
      // Call Supabase function to end impersonation session
      const { error } = await supabase.rpc('end_impersonation', {
        _admin_id: user.id
      });

      if (error) throw error;

      // Restore original admin profile
      setProfile(originalAdmin);
      setIsImpersonating(false);
      setOriginalAdmin(null);
      setImpersonationSession(null);

      console.log('✅ Impersonation ended successfully');
      return { error: null };
    } catch (error) {
      console.error('❌ Error ending impersonation:', error);
      return { error };
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      company,
      loading,
      permissions,
      signIn,
      // signUp removed - admin creates users
      // signUp removed
      signOut,
      updateProfile,
      canEdit,
      canDelete,
      canAdmin,
      isSystemAdmin,
      isCompanyAdmin,
      switchCompany,
      fetchCompaniesByType,
      fetchAllUserCompanies,
      // Impersonation properties
      isImpersonating,
      originalAdmin,
      impersonationSession,
      startImpersonation: isSystemAdmin ? startImpersonation : undefined,
      endImpersonation: isSystemAdmin ? endImpersonation : undefined,
    }}>
      {children}
      
      <FirstLoginModal 
        isOpen={showFirstLoginModal}
        userEmail={profile?.email || user?.email || ''}
        onPasswordChanged={handleFirstLoginPasswordChange}
        onClose={handleFirstLoginModalClose}
      />
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within a MultiTenantAuthProvider');
  }
  return context;
};