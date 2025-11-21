import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useMultiTenant';
import { OKRKeyResult, CreateOKRKeyResultData } from '@/types/okr';

/**
 * Hook para gerenciar Key Results OKR
 */
export const useOKRKeyResults = (objectiveId: string | null) => {
  const [keyResults, setKeyResults] = useState<OKRKeyResult[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { company, user } = useAuth();

  /**
   * Carregar key results de um objetivo
   */
  const loadKeyResults = useCallback(async () => {
    if (!objectiveId || !company?.id) {
      setKeyResults([]);
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('okr_key_results')
        .select('*')
        .eq('okr_objective_id', objectiveId)
        .eq('company_id', company.id)
        .order('display_order', { ascending: true });

      if (error) throw error;

      setKeyResults(data as OKRKeyResult[]);
    } catch (error) {
      console.error('Error loading OKR key results:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar key results',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [objectiveId, company?.id, toast]);

  /**
   * Criar novo key result
   */
  const createKeyResult = useCallback(
    async (data: CreateOKRKeyResultData): Promise<OKRKeyResult | null> => {
      if (!company?.id || !user?.id) return null;

      try {
        setLoading(true);

        const { data: newKR, error } = await supabase
          .from('okr_key_results')
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
          description: 'Key Result criado com sucesso',
        });

        await loadKeyResults();
        return newKR as OKRKeyResult;
      } catch (error) {
        console.error('Error creating OKR key result:', error);
        toast({
          title: 'Erro',
          description: 'Erro ao criar key result',
          variant: 'destructive',
        });
        return null;
      } finally {
        setLoading(false);
      }
    },
    [company?.id, user?.id, toast, loadKeyResults]
  );

  /**
   * Atualizar key result
   */
  const updateKeyResult = useCallback(
    async (keyResultId: string, updates: Partial<OKRKeyResult>): Promise<boolean> => {
      try {
        setLoading(true);

        const { error } = await supabase
          .from('okr_key_results')
          .update(updates)
          .eq('id', keyResultId);

        if (error) throw error;

        toast({
          title: 'Sucesso',
          description: 'Key Result atualizado com sucesso',
        });

        await loadKeyResults();
        return true;
      } catch (error) {
        console.error('Error updating OKR key result:', error);
        toast({
          title: 'Erro',
          description: 'Erro ao atualizar key result',
          variant: 'destructive',
        });
        return false;
      } finally {
        setLoading(false);
      }
    },
    [toast, loadKeyResults]
  );

  /**
   * Deletar key result
   */
  const deleteKeyResult = useCallback(
    async (keyResultId: string): Promise<boolean> => {
      try {
        setLoading(true);

        const { error } = await supabase.from('okr_key_results').delete().eq('id', keyResultId);

        if (error) throw error;

        toast({
          title: 'Sucesso',
          description: 'Key Result deletado com sucesso',
        });

        await loadKeyResults();
        return true;
      } catch (error) {
        console.error('Error deleting OKR key result:', error);
        toast({
          title: 'Erro',
          description: 'Erro ao deletar key result',
          variant: 'destructive',
        });
        return false;
      } finally {
        setLoading(false);
      }
    },
    [toast, loadKeyResults]
  );

  /**
   * Carregar key results ao montar ou quando objectiveId mudar
   */
  useEffect(() => {
    loadKeyResults();
  }, [loadKeyResults]);

  return {
    keyResults,
    loading,
    loadKeyResults,
    createKeyResult,
    updateKeyResult,
    deleteKeyResult,
  };
};
