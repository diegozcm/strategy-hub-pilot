import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { UserProfile, Company, Permission, AuthContextType, UserRole } from '@/types/auth';
import { FirstLoginModal } from '@/components/ui/FirstLoginModal';
import { logStep } from '@/lib/loginTrace';
import { toast } from 'sonner';

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
  const isLoggingOutRef = useRef(false);

  useEffect(() => {
    isLoggingOutRef.current = isLoggingOut;
  }, [isLoggingOut]);

  // Impersonation state
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [originalAdmin, setOriginalAdmin] = useState<UserProfile | null>(null);
  const [impersonationSession, setImpersonationSession] = useState<any>(null);
  
  const navigate = useNavigate();

  // State for system admin check
  const [isSystemAdmin, setIsSystemAdmin] = useState(false);
  
  /**
   * DEPRECATED: Global permissions based on profiles.role
   * 
   * For module-specific permissions, use:
   * - useCurrentModuleRole() for current module permissions
   * - useModulePermissions() for advanced module permission checks
   * - useIsSystemAdmin() for system admin checks
   * 
   * These global permissions are now derived only from isSystemAdmin.
   * Non-admin users should use module-specific hooks for proper permission checks.
   */
  const permissions: Permission = isSystemAdmin 
    ? { read: true, write: true, delete: true, admin: true }
    : { read: false, write: false, delete: false };
  
  const canEdit = isSystemAdmin;
  const canDelete = isSystemAdmin;
  const canAdmin = isSystemAdmin;
  
  /**
   * DEPRECATED: Use useIsSystemAdmin() hook instead
   * This is kept for backwards compatibility but always returns false for non-admins
   */
  const isCompanyAdmin = isSystemAdmin;

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

  // Check if user is system admin using database function
  const checkIsSystemAdmin = async (userId: string) => {
    try {
      const { data, error } = await supabase.rpc('is_system_admin', {
        _user_id: userId
      });

      if (error) {
        console.error('❌ Error checking system admin status:', error);
        setIsSystemAdmin(false);
        return;
      }

      setIsSystemAdmin(data === true);
      console.log(`🔐 System admin check for ${userId}: ${data === true}`);
    } catch (error) {
      console.error('❌ Unexpected error checking system admin:', error);
      setIsSystemAdmin(false);
    }
  };

  // Log user logout
  const logUserLogout = async (userId: string) => {
    try {
      const { data: activeSession } = await supabase
        .from('user_login_logs')
        .select('id')
        .eq('user_id', userId)
        .is('logout_time', null)
        .order('login_time', { ascending: false })
        .limit(1)
        .single();

      if (activeSession) {
        await supabase
          .from('user_login_logs')
          .update({ logout_time: new Date().toISOString() })
          .eq('id', activeSession.id);
        console.log('✅ Logout logged successfully');
      }
    } catch (error) {
      console.error('❌ Error logging logout:', error);
    }
  };

  // Log user login (with deduplication to prevent inflated counts)
  const logUserLogin = async (userId: string, companyId: string | null) => {
    try {
      // Guard 1: sessionStorage - only one log per browser session
      const SESSION_KEY = `login_logged_${userId}`;
      if (sessionStorage.getItem(SESSION_KEY)) {
        console.log('⏭️ Login already logged this session, skipping');
        return;
      }

      // Guard 2: Check if there's a recent login in the last 5 minutes
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { data: recent } = await supabase
        .from('user_login_logs')
        .select('id')
        .eq('user_id', userId)
        .gte('login_time', fiveMinAgo)
        .limit(1);

      if (recent && recent.length > 0) {
        console.log('⏭️ Login already logged recently, skipping');
        sessionStorage.setItem(SESSION_KEY, 'true');
        return;
      }

      await supabase.from('user_login_logs').insert({
        user_id: userId,
        company_id: companyId,
        login_time: new Date().toISOString(),
        user_agent: navigator.userAgent,
      });
      sessionStorage.setItem(SESSION_KEY, 'true');
      console.log('✅ Login logged successfully');
    } catch (error) {
      console.error('❌ Error logging login:', error);
      // Non-blocking error - continue even if logging fails
    }
  };

  // Load profile data - OPTIMIZED for normal users (no admin checks)
  const loadUserProfileOptimized = async (userId: string, shouldLogLogin: boolean = false) => {
    const startTime = performance.now();
    
    try {
      console.log(`📋 [OPTIMIZED] Loading profile for user ${userId}`);
      logStep('Profile:load:start', { userId });
      
      // Execute 2 queries in parallel
      const [profileResult, companiesResult] = await Promise.all([
        // Query 1: Get user profile
        supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .single(),
        
        // Query 2: Get user companies with JOIN
        supabase
          .from('user_company_relations')
          .select(`
            company_id,
            companies!inner(
              id,
              name,
              status,
              company_type,
              owner_id,
              mission,
              vision,
              values,
              logo_url,
              ai_enabled,
              created_at,
              updated_at
            )
          `)
          .eq('user_id', userId)
          .eq('companies.status', 'active')
      ]);

      const { data: profileData, error: profileError } = profileResult;
      const { data: companiesData, error: companiesError } = companiesResult;

      logStep('Profile:load:results', { 
        hasProfile: !!profileData, 
        companiesCount: companiesData?.length || 0,
        profileError: profileError?.code,
        companiesError: companiesError?.code
      });

      // Handle profile errors
      if (profileError) {
        if (profileError.code === 'PGRST116') {
          console.log('👤 Profile not found');
          logStep('Profile:load:error', { reason: 'not_found' });
          setProfile(null);
          setLoading(false);
          return;
        }
        logStep('Profile:load:error', { reason: 'fetch_error', code: profileError.code });
        throw profileError;
      }

      // Handle companies errors (non-blocking)
      if (companiesError) {
        console.warn('⚠️ Error loading companies:', companiesError);
        logStep('Profile:load:companies_error', { code: companiesError.code });
      }

      setProfile(profileData as UserProfile);
      console.log('📋 Profile loaded successfully');

      // Check if user must change password
      if (profileData?.must_change_password === true) {
        // Check if temporary password has expired
        if (profileData?.temp_reset_expires) {
          const isExpired = new Date(profileData.temp_reset_expires) < new Date();
          if (isExpired) {
            console.log('⏰ Temporary password expired - signing out user');
            await supabase.auth.signOut();
            toast.error('Sua senha temporária expirou. Solicite uma nova ao administrador.');
            setLoading(false);
            return;
          }
        }
        console.log('🔐 User must change password - showing modal');
        setShowFirstLoginModal(true);
        setLoading(false);
        return;
      }

      // Auto-select company if user has only one active company
      const activeCompanies = companiesData || [];

      if (activeCompanies.length === 1) {
        const relation = activeCompanies[0];
        const company = relation.companies;
        
        console.log('✅ Auto-selected single company:', company.name);
        logStep('Company:autoSelect', { companyName: company.name, companyId: company.id });
        
        setCompany({
          ...company,
          active: company.status === 'active'
        } as Company);
        
        setSelectedCompanyId(company.id);
        localStorage.setItem('selectedCompanyId', company.id);

        // Log login with company (only on real SIGNED_IN events)
        if (shouldLogLogin) await logUserLogin(userId, company.id);
      } else if (activeCompanies.length > 1) {
        console.log(`🏢 User has ${activeCompanies.length} companies - will need to select`);
        
        // Check for persisted company
        const persistedCompanyId = localStorage.getItem('selectedCompanyId');
        if (persistedCompanyId) {
          const persistedCompany = activeCompanies.find((c: any) => c.companies.id === persistedCompanyId);
          if (persistedCompany) {
            console.log('✅ Restored persisted company:', persistedCompany.companies.name);
            setCompany({
              ...persistedCompany.companies,
              active: persistedCompany.companies.status === 'active'
            } as Company);
            setSelectedCompanyId(persistedCompany.companies.id);

            // Log login with company (only on real SIGNED_IN events)
            if (shouldLogLogin) await logUserLogin(userId, persistedCompany.companies.id);
          }
        } else {
          // Log login without company (will select later)
          if (shouldLogLogin) await logUserLogin(userId, null);
        }
      } else {
        console.log('⚠️ User has no active companies');
        // Log login without company
        if (shouldLogLogin) await logUserLogin(userId, null);
      }

      setLoading(false);
      
      const endTime = performance.now();
      const durationMs = (endTime - startTime).toFixed(0);
      console.log(`⚡ Profile loaded in ${durationMs}ms`);
      logStep('Profile:load:done', { durationMs });
      
    } catch (error) {
      console.error('Error loading profile:', error);
      setProfile(null);
      setLoading(false);
    }
  };

  // Legacy function kept for admin usage only
  const loadUserProfile = async (userId: string) => {
    try {
      console.log(`📋 Loading profile for user ${userId}`);
      
      // Check system admin status
      await checkIsSystemAdmin(userId);
      
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (profileError) {
        console.error('Profile fetch error:', profileError);
        
        if (profileError.code === 'PGRST116') {
          console.log('👤 Profile not found - may need to be created by system');
          setProfile(null);
          return;
        }
        
        throw profileError;
      }

      console.log('📋 Profile loaded successfully:', profile);
      setProfile(profile as UserProfile);

      if (profile?.must_change_password === true) {
        // Check if temporary password has expired
        if (profile?.temp_reset_expires) {
          const isExpired = new Date(profile.temp_reset_expires) < new Date();
          if (isExpired) {
            console.log('⏰ Temporary password expired - signing out user');
            await supabase.auth.signOut();
            toast.error('Sua senha temporária expirou. Solicite uma nova ao administrador.');
            return;
          }
        }
        console.log('🔐 User must change password - showing modal');
        setShowFirstLoginModal(true);
      }

      const persistedCompanyId = localStorage.getItem('selectedCompanyId');
      if (persistedCompanyId) {
        console.log('🏢 Loading persisted company:', persistedCompanyId);
        const hasAccess = await verifyCompanyAccess(userId, persistedCompanyId);
        if (hasAccess) {
          await loadCompanyById(persistedCompanyId);
        } else {
          console.log('❌ User no longer has access to persisted company, removing from storage');
          localStorage.removeItem('selectedCompanyId');
          await autoRecoverCompany(userId);
        }
      } else {
        await autoRecoverCompany(userId);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfile(null);
    }
  };

  // Auto-recover company if user has access to only one company
  const autoRecoverCompany = async (userId: string) => {
    try {
      console.log('🔄 Attempting auto-recovery of company for user:', userId);
      
      const { data: userCompanies, error } = await supabase
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
        .eq('user_id', userId)
        .eq('companies.status', 'active');

      if (error) {
        console.error('❌ Error fetching user companies for auto-recovery:', error);
        return;
      }

      const activeCompanies = userCompanies?.map(relation => relation.companies).filter(Boolean) || [];
      
      if (activeCompanies.length === 1) {
        const company = activeCompanies[0];
        console.log('✅ Auto-recovering single company:', company.name);
        
        setCompany({
          ...company,
          active: company.status === 'active'
        } as Company);
        setSelectedCompanyId(company.id);
        localStorage.setItem('selectedCompanyId', company.id);
        
        // Update profile with recovered company
        if (profile) {
          setProfile({
            ...profile,
            company_id: company.id,
            company: {
              ...company,
              active: company.status === 'active'
            } as Company
          });
        }
      } else if (activeCompanies.length > 1) {
        console.log(`🏢 User has ${activeCompanies.length} companies, requires manual selection`);
      } else {
        console.log('⚠️ User has no active company associations');
      }
    } catch (error) {
      console.error('❌ Error during auto-recovery:', error);
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
            ai_enabled,
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
            ai_enabled,
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
          // Don't immediately return false - this could be a temporary network issue
          // Let the auth state handler deal with it more gracefully
          return false;
        }
        
        console.log('✅ Session refreshed successfully');
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

  // Clear company selection with reason logging
  const clearCompanySelection = (reason: string = 'manual') => {
    console.log(`🏢 Clearing company selection - Reason: ${reason}`);
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
    if (!user || companyId === company?.id || loading) return;
    
    console.log('🔄 Switching company to:', companyId);
    
    try {
      setLoading(true);
      
      // Add small delay to prevent rapid switching
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Clear current company state first
      setCompany(null);
      
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

      // Add another small delay before setting state
      await new Promise(resolve => setTimeout(resolve, 50));

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
      // Restore previous company if switch fails
      if (company) {
        setCompany(company);
        setSelectedCompanyId(company.id);
      }
      throw error;
    } finally {
      // Ensure loading is reset after a minimum delay
      setTimeout(() => setLoading(false), 200);
    }
  };

  // Initialize auth state
  useEffect(() => {
    console.log('📊 MultiTenantAuthProvider: Initializing...');
    logStep('Auth:provider:init');
    
    // Auth state listener - OPTIMIZED for normal users
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('🔐 Auth state change:', event, !!session);
        logStep('Auth:event', { event, hasSession: !!session, isLoggingOut: isLoggingOutRef.current });
        
        // Prevent processing noisy INITIAL_SESSION during active logout
        if (isLoggingOutRef.current && event === 'INITIAL_SESSION') {
          console.log(`🚪 Ignoring ${event} during logout`);
          logStep('Auth:event:ignored', { event, reason: 'isLoggingOut' });
          return;
        }
        
        if (event === 'SIGNED_IN' && session) {
          console.log('👤 User signed in:', session.user.email);
          setSession(session);
          setUser(session.user);
          loadUserProfileOptimized(session.user.id, true); // true = log login
        } 
        else if (event === 'INITIAL_SESSION' && session) {
          console.log('👤 Initial session found:', session.user.email);
          setSession(session);
          setUser(session.user);
          loadUserProfileOptimized(session.user.id, false); // false = don't log (page refresh)
        }
        else if (event === 'SIGNED_OUT' || !session) {
          console.log('❌ User signed out');
          
          // Log the logout time for the active session
          if (event === 'SIGNED_OUT' && user?.id) {
            logUserLogout(user.id).catch(console.error);
          }
          
          setUser(null);
          setSession(null);
          setProfile(null);
          setCompany(null);
          setSelectedCompanyId(null);
          setIsImpersonating(false);
          setOriginalAdmin(null);
          setImpersonationSession(null);
          setShowFirstLoginModal(false);
          setLoading(false);
          
          if (event === 'SIGNED_OUT') {
            localStorage.removeItem('selectedCompanyId');
          }
        }
        else if (event === 'TOKEN_REFRESHED' && session) {
          console.log('🔄 Token refreshed');
          setSession(session);
          setUser(session.user);
        }
      }
    );

    // Check existing session with validation
    console.log('🔍 Checking existing session...');
    logStep('Auth:existingSession:check:start');
    supabase.auth.getSession()
      .then(async ({ data: { session }, error }) => {
        console.log('🔍 Existing session check result:', !!session);
        logStep('Auth:existingSession:check:result', { hasSession: !!session, hasError: !!error });
        if (error) {
          console.error('❌ Session check error:', error);
          localStorage.removeItem('sb-pdpzxjlnaqwlyqoyoyhr-auth-token');
          // Don't clear selectedCompanyId here - might be temporary error
          console.log('⚠️ Session error, but preserving company selection for recovery');
          setLoading(false);
          return;
        }
        
        if (session) {
          const isValid = await validateSession(session);
          if (!isValid) {
            console.warn('⚠️ Invalid existing session, clearing auth but preserving company for recovery');
            localStorage.removeItem('sb-pdpzxjlnaqwlyqoyoyhr-auth-token');
            // Don't clear selectedCompanyId - user might still have access
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
        // Don't clear selectedCompanyId - might be network issue
        console.log('⚠️ Critical error, but preserving company selection for recovery');
      });

    // Register beforeunload to log logout when user closes tab/window
    const handleBeforeUnload = () => {
      const currentUserId = user?.id;
      if (currentUserId) {
        // Use sendBeacon for reliable delivery on page unload
        const url = `https://pdpzxjlnaqwlyqoyoyhr.supabase.co/rest/v1/rpc/log_user_logout_beacon`;
        // Fallback: just call logUserLogout (may not complete on unload)
        logUserLogout(currentUserId).catch(() => {});
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [navigate]);

  // Sign in for NORMAL USERS (system admins are also allowed here; admin-only console uses AdminLoginPage)
  const signInNormalUser = async (email: string, password: string) => {
    try {
      // Reset logout flag at the start of login
      setIsLoggingOut(false);
      logStep('Auth:signIn:start', { email });
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      logStep('Auth:signIn:result', { ok: !error, userId: data?.user?.id });

      if (error) {
        console.error('❌ Sign in error:', error);
        logStep('Auth:signIn:error', { code: error.code, message: error.message });
        return { error };
      }

      // Previously we blocked system admins from /auth here. This caused issues for
      // multi-company admins like diego@cofound.com.br, so we now allow all users
      // to authenticate via this flow and rely on routing/impersonation to control access.
      logStep('Auth:signIn:success');
      console.log('✅ User sign in successful');
      return { error: null };
    } catch (error) {
      console.error('❌ Unexpected sign in error:', error);
      logStep('Auth:signIn:exception', { error: (error as any)?.message });
      return { error };
    }
  };
  // Legacy signIn kept for admin usage
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
      console.log('🚪 Starting sign out...');
      logStep('Auth:signOut:start');
      
      setIsLoggingOut(true);
      
      // Clear state
      setUser(null);
      setSession(null);
      setProfile(null);
      setCompany(null);
      setSelectedCompanyId(null);
      setIsImpersonating(false);
      setOriginalAdmin(null);
      setImpersonationSession(null);
      setShowFirstLoginModal(false);
      
      // Clear localStorage
      console.log('🧹 Clearing localStorage');
      const allKeys = Object.keys(localStorage);
      allKeys.forEach(key => {
        if (key.includes('sb-') || key.includes('supabase') || key === 'selectedCompanyId') {
          localStorage.removeItem(key);
        }
      });
      
      // Sign out from Supabase
      await supabase.auth.signOut({ scope: 'global' });
      
      console.log('🔓 Logout complete');
      logStep('Auth:signOut:done');
      
      // Always redirect to /auth for normal users
      // (System Admins use separate AdminLoginPage)
      navigate('/auth');
      
    } catch (error) {
      console.error('❌ Sign out error:', error);
      logStep('Auth:signOut:error', { error: (error as any)?.message });
      navigate('/auth');
    } finally {
      // Always reset logout flag in finally to ensure it happens
      setIsLoggingOut(false);
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
      signInNormalUser, // New: blocks System Admins
      signOut,
      updateProfile,
      canEdit,
      canDelete,
      canAdmin,
      isSystemAdmin,
      isCompanyAdmin,
      switchCompany,
      clearCompanySelection,
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