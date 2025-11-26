import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useMultiTenant';
import { toast } from 'sonner';

interface ModuleSettings {
  id?: string;
  company_id: string;
  module_slug: string;
  validity_enabled: boolean;
  settings: Record<string, any>;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
}

export const useCompanyModuleSettings = (moduleSlug: string) => {
  const { company, user } = useAuth();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['company-module-settings', company?.id, moduleSlug],
    queryFn: async () => {
      if (!company?.id) return null;

      const { data, error } = await supabase
        .from('company_module_settings')
        .select('*')
        .eq('company_id', company.id)
        .eq('module_slug', moduleSlug)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching module settings:', error);
        throw error;
      }

      return data as ModuleSettings | null;
    },
    enabled: !!company?.id,
  });

  const updateMutation = useMutation({
    mutationFn: async (validityEnabled: boolean) => {
      if (!company?.id || !user?.id) {
        throw new Error('Company or user not found');
      }

      const settingsData = {
        company_id: company.id,
        module_slug: moduleSlug,
        validity_enabled: validityEnabled,
        updated_by: user.id,
      };

      if (settings?.id) {
        // Update existing
        const { data, error } = await supabase
          .from('company_module_settings')
          .update({
            validity_enabled: validityEnabled,
            updated_by: user.id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', settings.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Insert new
        const { data, error } = await supabase
          .from('company_module_settings')
          .insert({
            ...settingsData,
            created_by: user.id,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['company-module-settings', company?.id, moduleSlug],
      });
      toast.success('Configurações atualizadas com sucesso');
    },
    onError: (error) => {
      console.error('Error updating module settings:', error);
      toast.error('Erro ao atualizar configurações');
    },
  });

  const toggleValidity = (enabled: boolean) => {
    updateMutation.mutate(enabled);
  };

  return {
    settings,
    loading: isLoading,
    validityEnabled: settings?.validity_enabled ?? false,
    toggleValidity,
    isUpdating: updateMutation.isPending,
  };
};
