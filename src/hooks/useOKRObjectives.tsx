import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useMultiTenant';
import { OKRObjective, CreateOKRObjectiveData } from '@/types/okr';

/**
 * Hook para gerenciar Objetivos OKR
 */
export const useOKRObjectives = (periodId: string | null) => {
  const [objectives, setObjectives] = useState<OKRObjective[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { company, user } = useAuth();

  /**
   * Carregar objetivos de um período
   */
  const loadObjectives = useCallback(async () => {
    if (!periodId || !company?.id) {
      setObjectives([]);
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('okr_objectives')
        .select('*')
        .eq('okr_period_id', periodId)
        .eq('company_id', company.id)
        .order('display_order', { ascending: true });

      if (error) throw error;

      setObjectives(data as OKRObjective[]);
    } catch (error) {
      console.error('Error loading OKR objectives:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar objetivos OKR',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [periodId, company?.id, toast]);

  /**
   * Criar novo objetivo
   */
  const createObjective = useCallback(
    async (data: CreateOKRObjectiveData): Promise<OKRObjective | null> => {
      if (!company?.id || !user?.id) return null;

      try {
        setLoading(true);

        const { data: newObjective, error } = await supabase
          .from('okr_objectives')
          .insert({
            ...data,
            company_id: company.id,
            created_by: user.id,
          })
          .select()
          .single();

        if (error) throw error;

        toast({
          title: 'Sucesso',
          description: 'Objetivo OKR criado com sucesso',
        });

        await loadObjectives();
        return newObjective as OKRObjective;
      } catch (error) {
        console.error('Error creating OKR objective:', error);
        toast({
          title: 'Erro',
          description: 'Erro ao criar objetivo OKR',
          variant: 'destructive',
        });
        return null;
      } finally {
        setLoading(false);
      }
    },
    [company?.id, user?.id, toast, loadObjectives]
  );

  /**
   * Atualizar objetivo
   */
  const updateObjective = useCallback(
    async (objectiveId: string, updates: Partial<OKRObjective>): Promise<boolean> => {
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

        await loadObjectives();
        return true;
      } catch (error) {
        console.error('Error updating OKR objective:', error);
        toast({
          title: 'Erro',
          description: 'Erro ao atualizar objetivo',
          variant: 'destructive',
        });
        return false;
      } finally {
        setLoading(false);
      }
    },
    [toast, loadObjectives]
  );

  /**
   * Deletar objetivo
   */
  const deleteObjective = useCallback(
    async (objectiveId: string): Promise<boolean> => {
      try {
        setLoading(true);

        const { error } = await supabase.from('okr_objectives').delete().eq('id', objectiveId);

        if (error) throw error;

        toast({
          title: 'Sucesso',
          description: 'Objetivo deletado com sucesso',
        });

        await loadObjectives();
        return true;
      } catch (error) {
        console.error('Error deleting OKR objective:', error);
        toast({
          title: 'Erro',
          description: 'Erro ao deletar objetivo',
          variant: 'destructive',
        });
        return false;
      } finally {
        setLoading(false);
      }
    },
    [toast, loadObjectives]
  );

  /**
   * Carregar objetivos ao montar ou quando periodId mudar
   */
  useEffect(() => {
    loadObjectives();
  }, [loadObjectives]);

  return {
    objectives,
    loading,
    loadObjectives,
    createObjective,
    updateObjective,
    deleteObjective,
  };
};
