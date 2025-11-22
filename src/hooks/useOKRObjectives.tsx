import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useMultiTenant';
import { OKRObjective } from '@/types/okr';

export const useOKRObjectives = (pillarId?: string | null) => {
  const [objectives, setObjectives] = useState<OKRObjective[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { profile, company } = useAuth();

  const fetchObjectives = useCallback(async () => {
    if (!company?.id) return;
    
    try {
      setLoading(true);
      
      let query = supabase
        .from('okr_objectives')
        .select(`
          *
        `)
        .order('created_at', { ascending: false });
      
      if (pillarId) {
        query = query.eq('okr_pillar_id', pillarId);
      }

      const { data, error } = await query;

      if (error) throw error;

      setObjectives(data || []);
    } catch (error) {
      console.error('Error fetching OKR objectives:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar objetivos',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [company?.id, pillarId, toast]);

  const createObjective = useCallback(async (data: Omit<OKRObjective, 'id' | 'created_at' | 'updated_at' | 'owner' | 'key_results' | 'created_by'>) => {
    if (!profile?.user_id) return null;

    try {
      setLoading(true);
      
      const { data: newObjective, error } = await supabase
        .from('okr_objectives')
        .insert({
          ...data,
          owner_id: data.owner_id || profile.user_id,
          created_by: profile.user_id,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Objetivo criado com sucesso',
      });

      await fetchObjectives();
      return newObjective;
    } catch (error) {
      console.error('Error creating OKR objective:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao criar objetivo',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [profile?.user_id, toast, fetchObjectives]);

  const updateObjective = useCallback(async (objectiveId: string, updates: Partial<OKRObjective>) => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('okr_objectives')
        .update(updates)
        .eq('id', objectiveId);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Objetivo atualizado com sucesso',
      });

      await fetchObjectives();
    } catch (error) {
      console.error('Error updating OKR objective:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar objetivo',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast, fetchObjectives]);

  const deleteObjective = useCallback(async (objectiveId: string) => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('okr_objectives')
        .delete()
        .eq('id', objectiveId);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Objetivo deletado com sucesso',
      });

      await fetchObjectives();
    } catch (error) {
      console.error('Error deleting OKR objective:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao deletar objetivo',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast, fetchObjectives]);

  useEffect(() => {
    fetchObjectives();
  }, [fetchObjectives]);

  return {
    objectives,
    loading,
    fetchObjectives,
    createObjective,
    updateObjective,
    deleteObjective,
  };
};
