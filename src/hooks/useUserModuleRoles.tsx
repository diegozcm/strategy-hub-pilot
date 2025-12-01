import { useState, useEffect, useCallback } from 'react';
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
        // The RPC returns: { module_id: uuid, roles: app_role[] }
        const rolesMap: ModuleRoles = {};
        if (data && Array.isArray(data)) {
          data.forEach((item: any) => {
            const moduleId = item.module_id;
            const rolesArray = item.roles; // This is already an array from the RPC
            
            if (rolesArray && Array.isArray(rolesArray)) {
              rolesMap[moduleId] = rolesArray as UserRole[];
            }
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

  const getRolesForModuleId = useCallback((moduleId: string | undefined): UserRole[] => {
    if (!moduleId) return [];
    return moduleRoles[moduleId] || [];
  }, [moduleRoles]);

  console.log('[useUserModuleRoles] moduleRoles updated:', moduleRoles);

  return {
    moduleRoles,
    getRolesForModuleId,
    loading,
    error
  };
};
