import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CompanyUser {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  avatar_url?: string;
  role?: string;
}

export const useCompanyUsers = (companyId?: string) => {
  const [users, setUsers] = useState<CompanyUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchAttempted, setFetchAttempted] = useState(false);

  useEffect(() => {
    // Reset quando companyId muda
    setFetchAttempted(false);
    
    if (!companyId) {
      console.log('[useCompanyUsers] No companyId provided, waiting...');
      setUsers([]);
      // NÃO setamos loading: false aqui - mantemos true até ter companyId válido
      return;
    }
    
    const loadUsers = async () => {
      try {
        console.log('[useCompanyUsers] Fetching users for company:', companyId);
        setLoading(true);
        
        const { data, error } = await supabase
          .from('user_company_relations')
          .select(`
            user_id,
            profiles!inner(
              user_id,
              first_name,
              last_name,
              email,
              avatar_url
            )
          `)
          .eq('company_id', companyId);
        
        if (error) throw error;
        
        console.log('[useCompanyUsers] Fetched users:', data?.length || 0, 'for company:', companyId);
        
        // Flatten the structure
        const flattenedUsers: CompanyUser[] = (data || []).map((item: any) => ({
          user_id: item.profiles.user_id,
          first_name: item.profiles.first_name || '',
          last_name: item.profiles.last_name || '',
          email: item.profiles.email || '',
          avatar_url: item.profiles.avatar_url
        }));
        
        console.log('[useCompanyUsers] Flattened users:', flattenedUsers.map(u => `${u.first_name} ${u.last_name}`).join(', '));
        
        setUsers(flattenedUsers);
      } catch (error) {
        console.error('[useCompanyUsers] Error loading company users:', error);
        setUsers([]);
      } finally {
        setLoading(false);
        setFetchAttempted(true);
      }
    };

    loadUsers();
  }, [companyId]);

  return { users, loading };
};
