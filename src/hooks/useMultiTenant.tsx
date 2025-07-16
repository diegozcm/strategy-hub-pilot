import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { UserProfile, Company, Permission, AuthContextType, UserRole } from '@/types/auth';

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

  // Fetch user profile
  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      return data as any;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  };

  // Fetch company for system admin
  const fetchCompany = async (companyId: string) => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching company:', error);
        return null;
      }

      return data as any;
    } catch (error) {
      console.error('Error fetching company:', error);
      return null;
    }
  };

  // Switch company (for system admins)
  const switchCompany = async (companyId: string) => {
    if (!isSystemAdmin) return;
    
    const companyData = await fetchCompany(companyId);
    if (companyData) {
      setSelectedCompanyId(companyId);
      setCompany(companyData);
      localStorage.setItem('selectedCompanyId', companyId);
    }
  };

  useEffect(() => {
    console.log('📊 MultiTenantAuthProvider: Initializing...');
    
    // Auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('🔐 Auth state change:', event, !!session);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('👤 User found, fetching profile for:', session.user.email);
          // Use setTimeout to defer async operations and prevent blocking
          setTimeout(async () => {
            const userProfile = await fetchProfile(session.user.id);
            console.log('📋 Profile fetched:', userProfile);
            
            if (userProfile) {
              // Verificar se o usuário tem empresa associada e se ela está ativa
              let companyData = null;
              
              // Primeiro verificar se há company_id no perfil (método antigo)
              if (userProfile.company_id) {
                companyData = await fetchCompany(userProfile.company_id);
                console.log('🏢 Company data from profile:', companyData);
              } 
              // Se não há company_id no perfil, verificar na tabela user_company_relations
              else {
                console.log('🔍 No company_id in profile, checking user_company_relations...');
                const { data: relations, error } = await supabase
                  .from('user_company_relations')
                  .select('company_id, companies(*)')
                  .eq('user_id', session.user.id)
                  .limit(1)
                  .maybeSingle();
                
                if (!error && relations) {
                  companyData = relations.companies;
                  console.log('🏢 Company data from relations:', companyData);
                }
              }
              
              if (companyData) {
                if (companyData.status === 'inactive') {
                  console.log('❌ Company is inactive, redirecting to error page');
                  navigate('/company-inactive');
                  return;
                }
                setCompany(companyData);
              } else {
                console.log('❌ No company found for user');
              }
              
              setProfile(userProfile);
              
              // Para admins, carregar empresa selecionada
              if (userProfile.role === 'admin') {
                console.log('🔧 Admin detected, loading selected company...');
                const savedCompanyId = localStorage.getItem('selectedCompanyId');
                if (savedCompanyId && savedCompanyId !== userProfile.company_id) {
                  const adminCompanyData = await fetchCompany(savedCompanyId);
                  if (adminCompanyData && adminCompanyData.status === 'active') {
                    setCompany(adminCompanyData);
                    setSelectedCompanyId(savedCompanyId);
                  }
                }
              }
            }
          }, 0);
        } else {
          console.log('❌ No user session, clearing state');
          setProfile(null);
          setCompany(null);
          setSelectedCompanyId(null);
          localStorage.removeItem('selectedCompanyId');
        }
        
        console.log('✅ Setting loading to false');
        setLoading(false);
      }
    );

    // Check existing session
    console.log('🔍 Checking existing session...');
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('🔍 Existing session check result:', !!session);
      if (!session) {
        console.log('❌ No existing session found');
        console.log('✅ Initial loading complete, setting loading to false');
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (!error) {
      navigate('/app');
    }

    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/app`;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });

    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('selectedCompanyId');
    navigate('/auth');
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

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      company,
      loading,
      permissions,
      signIn,
      signUp,
      signOut,
      updateProfile,
      canEdit,
      canDelete,
      canAdmin,
      isSystemAdmin,
      isCompanyAdmin,
      switchCompany: isSystemAdmin ? switchCompany : undefined,
    }}>
      {children}
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