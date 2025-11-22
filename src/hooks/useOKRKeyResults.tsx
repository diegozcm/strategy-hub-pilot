import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useMultiTenant';
import { OKRKeyResult, ChecklistItem } from '@/types/okr';

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

      // Parse checklist_items from JSONB
      const parsedData = (data || []).map(kr => ({
        ...kr,
        checklist_items: kr.checklist_items ? (typeof kr.checklist_items === 'string' ? JSON.parse(kr.checklist_items) : kr.checklist_items) : null,
      }));

      setKeyResults(parsedData as OKRKeyResult[]);
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

  const createKeyResult = useCallback(async (data: Omit<OKRKeyResult, 'id' | 'created_at' | 'updated_at' | 'owner' | 'created_by' | 'actions' | 'checklist_completed' | 'checklist_total'>) => {
    if (!profile?.user_id) return null;

    try {
      setLoading(true);
      
      const { data: newKR, error } = await supabase
        .from('okr_key_results')
        .insert({
          okr_objective_id: data.okr_objective_id,
          title: data.title,
          description: data.description,
          tracking_type: data.tracking_type,
          quarter: data.quarter,
          target_value: data.target_value,
          initial_value: data.initial_value,
          current_value: data.current_value,
          unit: data.unit,
          metric_type: data.metric_type || 'number',
          target_direction: data.target_direction,
          checklist_items: data.checklist_items ? JSON.stringify(data.checklist_items) : null,
          status: data.status,
          due_date: data.due_date,
          progress_percentage: data.progress_percentage,
          owner_id: data.owner_id || profile.user_id,
          created_by: profile.user_id,
        } as any)
        .select()
        .single();

      if (error) throw error;

      // Parse checklist_items if present
      const parsedKR = {
        ...newKR,
        checklist_items: newKR.checklist_items ? (typeof newKR.checklist_items === 'string' ? JSON.parse(newKR.checklist_items) : newKR.checklist_items) : null,
      };

      toast({
        title: 'Sucesso',
        description: 'Key Result criado com sucesso',
      });

      await fetchKeyResults();
      return parsedKR as OKRKeyResult;
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
      
      // Prepare updates and stringify checklist_items if present
      const { owner, actions, ...updateData } = updates as any;
      if (updateData.checklist_items) {
        updateData.checklist_items = JSON.stringify(updateData.checklist_items);
      }
      
      const { error } = await supabase
        .from('okr_key_results')
        .update(updateData)
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

  // Method to toggle checklist item
  const toggleChecklistItem = useCallback(async (krId: string, itemId: string) => {
    const kr = keyResults.find(k => k.id === krId);
    if (!kr || kr.tracking_type !== 'checklist' || !kr.checklist_items) return;

    const updatedItems = kr.checklist_items.map(item =>
      item.id === itemId
        ? {
            ...item,
            completed: !item.completed,
            completed_at: !item.completed ? new Date().toISOString() : null,
            completed_by: !item.completed ? profile?.user_id : null,
          }
        : item
    );

    await updateKeyResult(krId, { checklist_items: updatedItems });
  }, [keyResults, profile?.user_id, updateKeyResult]);

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
    toggleChecklistItem,
  };
};
