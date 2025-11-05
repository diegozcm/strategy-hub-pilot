import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useMultiTenant';

/**
 * Hook para verificar se o usuário atual é System Admin
 * Usa a função is_system_admin() do banco como fonte única da verdade
 */
export const useIsSystemAdmin = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['is-system-admin', user?.id],
    queryFn: async () => {
      if (!user?.id) return false;

      const { data, error } = await supabase.rpc('is_system_admin', {
        _user_id: user.id
      });

      if (error) {
        console.error('❌ Error checking system admin status:', error);
        return false;
      }

      return data === true;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos (anteriormente cacheTime)
  });
};
