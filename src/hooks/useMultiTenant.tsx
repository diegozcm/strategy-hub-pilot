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
        .single();

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
        .single();

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
      async (event, session) => {
        console.log('🔐 Auth state change:', event, !!session);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('👤 User found, fetching profile for:', session.user.email);
          const userProfile = await fetchProfile(session.user.id);
          console.log('📋 Profile fetched:', userProfile);
          setProfile(userProfile);
          
          if (userProfile) {
            if (userProfile.role === 'admin') {
              console.log('🔧 Admin detected, loading company...');
              // For admin, load selected company or default
              const savedCompanyId = localStorage.getItem('selectedCompanyId');
              if (savedCompanyId) {
                const companyData = await fetchCompany(savedCompanyId);
                if (companyData) {
                  setCompany(companyData);
                  setSelectedCompanyId(savedCompanyId);
                }
              }
            } else if (userProfile.company_id) {
              console.log('🏢 Loading user company:', userProfile.company_id);
              // For regular users, load their company
              const companyData = await fetchCompany(userProfile.company_id);
              if (companyData) {
                setCompany(companyData);
              }
            }
          }
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
      if (session?.user) {
        console.log('👤 Existing user found:', session.user.email);
        fetchProfile(session.user.id).then(userProfile => {
          console.log('📋 Existing profile fetched:', userProfile);
          setProfile(userProfile);
          
          if (userProfile?.role === 'admin') {
            const savedCompanyId = localStorage.getItem('selectedCompanyId');
            if (savedCompanyId) {
              fetchCompany(savedCompanyId).then(companyData => {
                if (companyData) {
                  setCompany(companyData);
                  setSelectedCompanyId(savedCompanyId);
                }
              });
            }
          } else if (userProfile?.company_id) {
            fetchCompany(userProfile.company_id).then(companyData => {
              if (companyData) {
                setCompany(companyData);
              }
            });
          }
        });
      } else {
        console.log('❌ No existing session found');
      }
      console.log('✅ Initial loading complete, setting loading to false');
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    // Verificar se é uma conta de demonstração que precisa ser criada
    if (email === 'admin@sistema.com' && password === 'admin123') {
      // Criar usuário admin automaticamente
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (signUpError && !signUpError.message.includes('User already registered')) {
        return { error: signUpError };
      }
    }
    
    if (email === 'gestor@empresa.com' && password === 'gestor123') {
      // Criar usuário gestor automaticamente
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (signUpError && !signUpError.message.includes('User already registered')) {
        return { error: signUpError };
      }
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (!error) {
      // Perfis serão criados automaticamente pelo trigger handle_new_user
      
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