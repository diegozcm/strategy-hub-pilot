import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useMultiTenant';
import { OKRKeyResult } from '@/types/okr';

export const useOKRKeyResults = (objectiveId: string | null) => {
  const [keyResults, setKeyResults] = useState<OKRKeyResult[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { profile } = useAuth();

  const fetchKeyResults = useCallback(async () => {
    if (!objectiveId) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('okr_key_results')
        .select('*')
        .eq('okr_objective_id', objectiveId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setKeyResults(data || []);
    } catch (error) {
      console.error('Error fetching OKR key results:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar resultados-chave',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [objectiveId, toast]);

  const createKeyResult = useCallback(async (data: Omit<OKRKeyResult, 'id' | 'created_at' | 'updated_at' | 'owner' | 'created_by'>) => {
    if (!profile?.user_id) return null;

    try {
      setLoading(true);
      
      const { data: newKR, error } = await supabase
        .from('okr_key_results')
        .insert({
          ...data,
          owner_id: data.owner_id || profile.user_id,
          created_by: profile.user_id,
          metric_type: 'number',
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Key Result criado com sucesso',
      });

      await fetchKeyResults();
      return newKR;
    } catch (error) {
      console.error('Error creating OKR key result:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao criar Key Result',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [profile?.user_id, toast, fetchKeyResults]);

  const updateKeyResult = useCallback(async (krId: string, updates: Partial<OKRKeyResult>) => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('okr_key_results')
        .update(updates)
        .eq('id', krId);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Key Result atualizado com sucesso',
      });

      await fetchKeyResults();
    } catch (error) {
      console.error('Error updating OKR key result:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar Key Result',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast, fetchKeyResults]);

  const deleteKeyResult = useCallback(async (krId: string) => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('okr_key_results')
        .delete()
        .eq('id', krId);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Key Result deletado com sucesso',
      });

      await fetchKeyResults();
    } catch (error) {
      console.error('Error deleting OKR key result:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao deletar Key Result',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast, fetchKeyResults]);

  useEffect(() => {
    fetchKeyResults();
  }, [fetchKeyResults]);

  return {
    keyResults,
    loading,
    fetchKeyResults,
    createKeyResult,
    updateKeyResult,
    deleteKeyResult,
  };
};
