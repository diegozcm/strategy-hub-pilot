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
        
        // Use RPC with SECURITY DEFINER to bypass RLS recursion issues
        const { data, error } = await supabase
          .rpc('get_company_users', { _company_id: companyId });
        
        if (error) throw error;
        
        console.log('[useCompanyUsers] Fetched users:', data?.length || 0, 'for company:', companyId);
        
        // Data already comes in the correct format from RPC
        const companyUsers: CompanyUser[] = (data || []).map((user: any) => ({
          user_id: user.user_id,
          first_name: user.first_name || '',
          last_name: user.last_name || '',
          email: user.email || '',
          avatar_url: user.avatar_url
        }));
        
        console.log('[useCompanyUsers] Company users:', companyUsers.map(u => `${u.first_name} ${u.last_name}`).join(', '));
        
        setUsers(companyUsers);
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
