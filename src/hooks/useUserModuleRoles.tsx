import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useMultiTenant';

export type UserRole = 'admin' | 'manager' | 'member';

interface ModuleRoles {
  [moduleId: string]: UserRole[];
}

export const useUserModuleRoles = () => {
  const { user } = useAuth();
  const [moduleRoles, setModuleRoles] = useState<ModuleRoles>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    const fetchUserModuleRoles = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: rpcError } = await supabase.rpc('get_user_module_roles', {
          _user_id: user.id
        });

        if (rpcError) throw rpcError;

        // Build a map: moduleId -> roles[]
        const rolesMap: ModuleRoles = {};
        if (data && Array.isArray(data)) {
          data.forEach((item: any) => {
            const moduleId = item.module_id;
            const role = item.role as UserRole;
            
            if (!rolesMap[moduleId]) {
              rolesMap[moduleId] = [];
            }
            rolesMap[moduleId].push(role);
          });
        }

        setModuleRoles(rolesMap);
      } catch (err) {
        console.error('Error fetching user module roles:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch module roles'));
      } finally {
        setLoading(false);
      }
    };

    fetchUserModuleRoles();
  }, [user?.id]);

  const getRolesForModuleId = (moduleId: string | undefined): UserRole[] => {
    if (!moduleId) return [];
    return moduleRoles[moduleId] || [];
  };

  return {
    moduleRoles,
    getRolesForModuleId,
    loading,
    error
  };
};
