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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!companyId) {
      setUsers([]);
      return;
    }
    
    const loadUsers = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('user_company_relations')
          .select(`
            user_id,
            role,
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
        
        // Flatten the structure
        const flattenedUsers: CompanyUser[] = (data || []).map((item: any) => ({
          user_id: item.profiles.user_id,
          first_name: item.profiles.first_name || '',
          last_name: item.profiles.last_name || '',
          email: item.profiles.email || '',
          avatar_url: item.profiles.avatar_url,
          role: item.role
        }));
        
        setUsers(flattenedUsers);
      } catch (error) {
        console.error('Error loading company users:', error);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, [companyId]);

  return { users, loading };
};
