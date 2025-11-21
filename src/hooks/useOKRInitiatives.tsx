import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useMultiTenant';
import { OKRInitiative, CreateOKRInitiativeData } from '@/types/okr';

/**
 * Hook para gerenciar Initiatives OKR
 */
export const useOKRInitiatives = (keyResultId: string | null) => {
  const [initiatives, setInitiatives] = useState<OKRInitiative[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { company, user } = useAuth();

  /**
   * Carregar initiatives de um key result
   */
  const loadInitiatives = useCallback(async () => {
    if (!keyResultId || !company?.id) {
      setInitiatives([]);
      return;
    }

    // ETAPA 2: Validação okr_enabled
    if (!company.okr_enabled) {
      console.log('📊 [OKR Initiatives] OKR not enabled for company:', company.id);
      setInitiatives([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('📊 [OKR Initiatives] Loading initiatives for key result:', keyResultId);

      const { data, error } = await supabase
        .from('okr_initiatives')
        .select('*')
        .eq('okr_key_result_id', keyResultId)
        .eq('company_id', company.id)
        .order('display_order', { ascending: true });

      if (error) throw error;

      setInitiatives(data as OKRInitiative[]);
    } catch (error) {
      console.error('Error loading OKR initiatives:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar iniciativas',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [keyResultId, company?.id, toast]);

  /**
   * Criar nova initiative
   */
  const createInitiative = useCallback(
    async (data: CreateOKRInitiativeData): Promise<OKRInitiative | null> => {
      if (!company?.id || !user?.id) return null;

      try {
        setLoading(true);

        const { data: newInitiative, error } = await supabase
          .from('okr_initiatives')
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
          description: 'Iniciativa criada com sucesso',
        });

        await loadInitiatives();
        return newInitiative as OKRInitiative;
      } catch (error) {
        console.error('Error creating OKR initiative:', error);
        toast({
          title: 'Erro',
          description: 'Erro ao criar iniciativa',
          variant: 'destructive',
        });
        return null;
      } finally {
        setLoading(false);
      }
    },
    [company?.id, user?.id, toast, loadInitiatives]
  );

  /**
   * Atualizar initiative
   */
  const updateInitiative = useCallback(
    async (initiativeId: string, updates: Partial<OKRInitiative>): Promise<boolean> => {
      try {
        setLoading(true);

        const { error } = await supabase
          .from('okr_initiatives')
          .update(updates)
          .eq('id', initiativeId);

        if (error) throw error;

        toast({
          title: 'Sucesso',
          description: 'Iniciativa atualizada com sucesso',
        });

        await loadInitiatives();
        return true;
      } catch (error) {
        console.error('Error updating OKR initiative:', error);
        toast({
          title: 'Erro',
          description: 'Erro ao atualizar iniciativa',
          variant: 'destructive',
        });
        return false;
      } finally {
        setLoading(false);
      }
    },
    [toast, loadInitiatives]
  );

  /**
   * Deletar initiative
   */
  const deleteInitiative = useCallback(
    async (initiativeId: string): Promise<boolean> => {
      try {
        setLoading(true);

        const { error } = await supabase.from('okr_initiatives').delete().eq('id', initiativeId);

        if (error) throw error;

        toast({
          title: 'Sucesso',
          description: 'Iniciativa deletada com sucesso',
        });

        await loadInitiatives();
        return true;
      } catch (error) {
        console.error('Error deleting OKR initiative:', error);
        toast({
          title: 'Erro',
          description: 'Erro ao deletar iniciativa',
          variant: 'destructive',
        });
        return false;
      } finally {
        setLoading(false);
      }
    },
    [toast, loadInitiatives]
  );

  /**
   * Carregar initiatives ao montar ou quando keyResultId mudar
   */
  useEffect(() => {
    loadInitiatives();
  }, [loadInitiatives]);

  return {
    initiatives,
    loading,
    loadInitiatives,
    createInitiative,
    updateInitiative,
    deleteInitiative,
  };
};
