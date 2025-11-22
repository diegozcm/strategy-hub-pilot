import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useMultiTenant';
import { OKRAction } from '@/types/okr';

export const useOKRActions = (keyResultId: string | null) => {
  const [actions, setActions] = useState<OKRAction[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { profile } = useAuth();

  const fetchActions = useCallback(async () => {
    if (!keyResultId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('okr_actions')
        .select('*')
        .eq('okr_key_result_id', keyResultId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setActions((data || []) as OKRAction[]);
    } catch (error) {
      console.error('Error fetching actions:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar ações',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [keyResultId, toast]);

  const createAction = useCallback(async (
    actionData: Omit<OKRAction, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'assigned_user'>
  ) => {
    if (!profile?.user_id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('okr_actions')
        .insert({
          okr_key_result_id: actionData.okr_key_result_id,
          title: actionData.title,
          description: actionData.description,
          assigned_to: actionData.assigned_to,
          status: actionData.status,
          priority: actionData.priority,
          due_date: actionData.due_date,
          created_by: profile.user_id,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Ação criada com sucesso',
      });

      await fetchActions();
      return data as OKRAction;
    } catch (error: any) {
      console.error('Error creating action:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao criar ação',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [profile?.user_id, toast, fetchActions]);

  const updateAction = useCallback(async (
    actionId: string,
    updates: Partial<OKRAction>
  ) => {
    try {
      setLoading(true);
      
      // Remove assigned_user before update
      const { assigned_user, ...updateData } = updates as any;
      
      const { data, error } = await supabase
        .from('okr_actions')
        .update(updateData)
        .eq('id', actionId)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Ação atualizada com sucesso',
      });

      await fetchActions();
      return data as OKRAction;
    } catch (error: any) {
      console.error('Error updating action:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao atualizar ação',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast, fetchActions]);

  const deleteAction = useCallback(async (actionId: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('okr_actions')
        .delete()
        .eq('id', actionId);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Ação excluída com sucesso',
      });

      await fetchActions();
    } catch (error) {
      console.error('Error deleting action:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao excluir ação',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast, fetchActions]);

  const toggleActionStatus = useCallback(async (actionId: string) => {
    const action = actions.find(a => a.id === actionId);
    if (!action) return;

    const newStatus = action.status === 'completed' ? 'in_progress' : 'completed';
    const updates: Partial<OKRAction> = {
      status: newStatus,
      ...(newStatus === 'completed' ? { completed_at: new Date().toISOString() } : { completed_at: undefined }),
    };

    await updateAction(actionId, updates);
  }, [actions, updateAction]);

  return {
    actions,
    loading,
    fetchActions,
    createAction,
    updateAction,
    deleteAction,
    toggleActionStatus,
  };
};
