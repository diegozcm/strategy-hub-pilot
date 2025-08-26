
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useMultiTenant';
import { toast } from 'sonner';

export type StartupProfileType = 'startup' | 'mentor';

export interface StartupProfile {
  id: string;
  user_id: string;
  type: StartupProfileType;
  status: 'active' | 'inactive';
  startup_name?: string;
  website?: string;
  bio?: string;
  areas_of_expertise?: string[];
  created_at: string;
  updated_at: string;
}

export const useStartupProfile = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch user's startup profile
  const { data: profile, isLoading } = useQuery({
    queryKey: ['startup-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('startup_hub_profiles')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      
      return data as StartupProfile | null;
    },
    enabled: !!user?.id
  });

  // Create or update startup profile
  const createProfileMutation = useMutation({
    mutationFn: async ({ type, data }: { 
      type: StartupProfileType; 
      data: Partial<StartupProfile> 
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const profileData = {
        user_id: user.id,
        type,
        status: 'active' as const,
        ...data
      };

      const { data: result, error } = await supabase
        .from('startup_hub_profiles')
        .upsert(profileData, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) throw error;
      return result as StartupProfile;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['startup-profile', user?.id], data);
      toast.success('Perfil atualizado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao atualizar perfil: ${error.message}`);
    }
  });

  const isStartup = profile?.type === 'startup';
  const isMentor = profile?.type === 'mentor';
  const hasProfile = !!profile;

  return {
    profile,
    isLoading,
    isStartup,
    isMentor,
    hasProfile,
    createProfile: createProfileMutation.mutate,
    isCreatingProfile: createProfileMutation.isPending
  };
};
