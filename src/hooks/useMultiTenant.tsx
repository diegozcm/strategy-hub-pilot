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
      case 'system_admin':
        return { read: true, write: true, delete: true, admin: true };
      case 'company_admin':
        return { read: true, write: true, delete: true, admin: true };
      case 'manager':
        return { read: true, write: true, delete: true };
      case 'collaborator':
        return { read: true, write: false, delete: false };
      default:
        return { read: false, write: false, delete: false };
    }
  };

  const permissions = profile ? getPermissions(profile.role) : { read: false, write: false, delete: false };

  const canEdit = permissions.write;
  const canDelete = permissions.delete;
  const canAdmin = permissions.admin || false;
  const isSystemAdmin = profile?.role === 'system_admin';
  const isCompanyAdmin = profile?.role === 'company_admin';

  // Fetch user profile
  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          company:companies(*)
        `)
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
    // Auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          const userProfile = await fetchProfile(session.user.id);
          setProfile(userProfile);
          
          if (userProfile) {
            if (userProfile.role === 'system_admin') {
              // For system admin, load selected company or default
              const savedCompanyId = localStorage.getItem('selectedCompanyId');
              if (savedCompanyId) {
                const companyData = await fetchCompany(savedCompanyId);
                if (companyData) {
                  setCompany(companyData);
                  setSelectedCompanyId(savedCompanyId);
                }
              }
            } else if (userProfile.company) {
              // For regular users, use their company
              setCompany(userProfile.company);
            }
          }
        } else {
          setProfile(null);
          setCompany(null);
          setSelectedCompanyId(null);
          localStorage.removeItem('selectedCompanyId');
        }
        
        setLoading(false);
      }
    );

    // Check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchProfile(session.user.id).then(userProfile => {
          setProfile(userProfile);
          
          if (userProfile?.role === 'system_admin') {
            const savedCompanyId = localStorage.getItem('selectedCompanyId');
            if (savedCompanyId) {
              fetchCompany(savedCompanyId).then(companyData => {
                if (companyData) {
                  setCompany(companyData);
                  setSelectedCompanyId(savedCompanyId);
                }
              });
            }
          } else if (userProfile?.company) {
            setCompany(userProfile.company);
          }
        });
      }
      setLoading(false);
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