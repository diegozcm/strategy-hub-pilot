import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  neverLoggedIn: number;
  pendingPasswordChange: number;
  systemAdmins: number;
}

export const useUsersStats = () => {
  return useQuery({
    queryKey: ['users-stats'],
    queryFn: async (): Promise<UserStats> => {
      // Get total and status counts
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('status, first_login_at, must_change_password');
      
      if (profilesError) throw profilesError;

      // Get system admins count
      const { count: adminsCount, error: adminsError } = await supabase
        .from('user_roles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'admin');
      
      if (adminsError) throw adminsError;

      const totalUsers = profiles?.length || 0;
      const activeUsers = profiles?.filter(p => p.status === 'active').length || 0;
      const inactiveUsers = profiles?.filter(p => p.status === 'inactive').length || 0;
      const neverLoggedIn = profiles?.filter(p => !p.first_login_at).length || 0;
      const pendingPasswordChange = profiles?.filter(p => p.must_change_password).length || 0;

      return {
        totalUsers,
        activeUsers,
        inactiveUsers,
        neverLoggedIn,
        pendingPasswordChange,
        systemAdmins: adminsCount || 0
      };
    }
  });
};

export interface UserWithDetails {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  status: string | null;
  company_id: string | null;
  first_login_at: string | null;
  must_change_password: boolean | null;
  created_at: string | null;
  company_name: string | null;
  is_system_admin: boolean;
  avatar_url: string | null;
  company_ids: string[];
}

export const useAllUsers = (filters?: {
  status?: string;
  companyId?: string;
  neverLoggedIn?: boolean;
  pendingPassword?: boolean;
  isAdmin?: boolean;
}) => {
  return useQuery({
    queryKey: ['all-users', filters],
    queryFn: async (): Promise<UserWithDetails[]> => {
      // Get all profiles with company info
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          user_id,
          first_name,
          last_name,
          email,
          status,
          company_id,
          first_login_at,
          must_change_password,
          created_at,
          avatar_url,
          companies!profiles_company_id_fkey(name)
        `)
        .order('created_at', { ascending: false });
      
      if (profilesError) throw profilesError;

      // Get all user_company_relations to support multiple companies
      const { data: companyRelations, error: relationsError } = await supabase
        .from('user_company_relations')
        .select('user_id, company_id');
      
      if (relationsError) throw relationsError;

      // Build a map of user_id -> array of company_ids
      const userCompanyMap = new Map<string, string[]>();
      companyRelations?.forEach(rel => {
        const existing = userCompanyMap.get(rel.user_id) || [];
        if (!existing.includes(rel.company_id)) {
          existing.push(rel.company_id);
        }
        userCompanyMap.set(rel.user_id, existing);
      });

      // Get all system admins
      const { data: adminRoles, error: adminsError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');
      
      if (adminsError) throw adminsError;

      const adminUserIds = new Set(adminRoles?.map(r => r.user_id) || []);

      let users: UserWithDetails[] = (profiles || []).map((p: any) => {
        // Combine primary company_id with relations
        const relatedCompanyIds = userCompanyMap.get(p.user_id) || [];
        const allCompanyIds = p.company_id 
          ? [...new Set([p.company_id, ...relatedCompanyIds])]
          : relatedCompanyIds;

        return {
          user_id: p.user_id,
          first_name: p.first_name,
          last_name: p.last_name,
          email: p.email,
          status: p.status,
          company_id: p.company_id,
          first_login_at: p.first_login_at,
          must_change_password: p.must_change_password,
          created_at: p.created_at,
          company_name: p.companies?.name || null,
          is_system_admin: adminUserIds.has(p.user_id),
          avatar_url: p.avatar_url,
          company_ids: allCompanyIds
        };
      });

      // Apply filters
      if (filters?.status) {
        users = users.filter(u => u.status === filters.status);
      }
      if (filters?.companyId) {
        // Filter users who have access to this company (via primary or relations)
        users = users.filter(u => u.company_ids.includes(filters.companyId!));
      }
      if (filters?.neverLoggedIn) {
        users = users.filter(u => !u.first_login_at);
      }
      if (filters?.pendingPassword) {
        users = users.filter(u => u.must_change_password);
      }
      if (filters?.isAdmin) {
        users = users.filter(u => u.is_system_admin);
      }

      return users;
    }
  });
};

export const useCompaniesForSelect = () => {
  return useQuery({
    queryKey: ['companies-for-select'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name, status')
        .order('name');
      
      if (error) throw error;
      return data || [];
    }
  });
};
