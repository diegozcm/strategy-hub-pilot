import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { KRMonthlyAction, KRActionsHistory } from '@/types/strategic-map';
import { useToast } from '@/hooks/use-toast';

export const useKRActions = (keyResultId?: string) => {
  const [actions, setActions] = useState<KRMonthlyAction[]>([]);
  const [history, setHistory] = useState<KRActionsHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Carregar ações do KR
  const loadActions = async () => {
    if (!keyResultId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('kr_monthly_actions')
        .select('*')
        .eq('key_result_id', keyResultId)
        .order('month_year', { ascending: false });

      if (error) throw error;
      setActions((data || []).map(item => ({
        ...item,
        status: item.status as 'planned' | 'in_progress' | 'completed' | 'cancelled',
        priority: item.priority as 'low' | 'medium' | 'high',
      })));
    } catch (error) {
      console.error('Error loading KR actions:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar ações do KR",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Carregar histórico de ações
  const loadHistory = async (actionId?: string) => {
    try {
      const query = supabase
        .from('kr_actions_history')
        .select('*')
        .order('changed_at', { ascending: false });

      if (actionId) {
        query.eq('action_id', actionId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setHistory((data || []).map(item => ({
        ...item,
        change_type: item.change_type as 'created' | 'updated' | 'status_changed' | 'completed',
      })));
    } catch (error) {
      console.error('Error loading actions history:', error);
    }
  };

  // Criar nova ação
  const createAction = async (actionData: Omit<KRMonthlyAction, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('kr_monthly_actions')
        .insert([{
          ...actionData,
          created_by: user.id,
        }])
        .select()
        .single();

      if (error) throw error;

      setActions(prev => [data as KRMonthlyAction, ...prev]);
      toast({
        title: "Sucesso",
        description: "Ação criada com sucesso",
      });

      return data;
    } catch (error) {
      console.error('Error creating action:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar ação",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Atualizar ação
  const updateAction = async (actionId: string, updates: any) => {
    try {
      const { data, error } = await supabase
        .from('kr_monthly_actions')
        .update(updates)
        .eq('id', actionId)
        .select()
        .single();

      if (error) throw error;

      setActions(prev => prev.map(action => 
        action.id === actionId ? { ...action, ...data } as KRMonthlyAction : action
      ));

      toast({
        title: "Sucesso",
        description: "Ação atualizada com sucesso",
      });

      return data;
    } catch (error) {
      console.error('Error updating action:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar ação",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Deletar ação
  const deleteAction = async (actionId: string) => {
    try {
      const { error } = await supabase
        .from('kr_monthly_actions')
        .delete()
        .eq('id', actionId);

      if (error) throw error;

      setActions(prev => prev.filter(action => action.id !== actionId));
      toast({
        title: "Sucesso",
        description: "Ação deletada com sucesso",
      });
    } catch (error) {
      console.error('Error deleting action:', error);
      toast({
        title: "Erro",
        description: "Erro ao deletar ação",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Obter ações por mês
  const getActionsByMonth = (monthYear: string) => {
    return actions.filter(action => action.month_year === monthYear);
  };

  // Obter estatísticas
  const getActionStats = () => {
    const total = actions.length;
    const completed = actions.filter(a => a.status === 'completed').length;
    const inProgress = actions.filter(a => a.status === 'in_progress').length;
    const planned = actions.filter(a => a.status === 'planned').length;
    const cancelled = actions.filter(a => a.status === 'cancelled').length;

    const completionRate = total > 0 ? (completed / total) * 100 : 0;
    const avgCompletion = total > 0 
      ? actions.reduce((sum, action) => sum + action.completion_percentage, 0) / total 
      : 0;

    return {
      total,
      completed,
      inProgress,
      planned,
      cancelled,
      completionRate,
      avgCompletion
    };
  };

  // Carregar ações quando keyResultId mudar
  useEffect(() => {
    if (keyResultId) {
      loadActions();
    }
  }, [keyResultId]);

  return {
    actions,
    history,
    loading,
    createAction,
    updateAction,
    deleteAction,
    loadActions,
    loadHistory,
    getActionsByMonth,
    getActionStats,
  };
};