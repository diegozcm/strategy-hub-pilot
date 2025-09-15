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

  // Criar nova ação (agora exige FCA)
  const createAction = async (actionData: Omit<KRMonthlyAction, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
    try {
      setLoading(true);

      // Validação básica
      if (!actionData.fca_id) {
        throw new Error('FCA é obrigatório para criar uma ação');
      }

      if (!actionData.key_result_id) {
        throw new Error('Resultado chave é obrigatório');
      }

      if (!actionData.action_title?.trim()) {
        throw new Error('Título da ação é obrigatório');
      }

      if (!actionData.month_year) {
        throw new Error('Mês/ano é obrigatório');
      }

      // Verificar se o usuário está autenticado
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('Usuário não autenticado');
      }

      // Preparar dados para inserção
      const actionToInsert = {
        key_result_id: actionData.key_result_id,
        fca_id: actionData.fca_id,
        month_year: actionData.month_year,
        action_title: actionData.action_title.trim(),
        action_description: actionData.action_description?.trim() || null,
        planned_value: actionData.planned_value || null,
        actual_value: actionData.actual_value || null,
        completion_percentage: actionData.completion_percentage || 0,
        status: actionData.status || 'planned',
        priority: actionData.priority || 'medium',
        responsible: actionData.responsible?.trim() || null,
        start_date: actionData.start_date || null,
        end_date: actionData.end_date || null,
        evidence_links: actionData.evidence_links || null,
        notes: actionData.notes?.trim() || null,
        created_by: user.id,
      };

      // Criar a ação (o banco agora garante integridade via FK composto e trigger)
      const { data, error } = await supabase
        .from('kr_monthly_actions')
        .insert(actionToInsert)
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      // Recarregar ações para manter sincronização
      if (keyResultId) {
        await loadActions();
      }

      toast({
        title: "Sucesso",
        description: "Ação criada com sucesso",
      });

      return data;
    } catch (error: any) {
      console.error('Error creating action:', error);
      
      // Mensagens de erro mais específicas e em português
      let errorMessage = 'Erro ao criar ação';
      
      if (error.code === '23505') {
        errorMessage = 'Já existe uma ação com este título neste mês para este Resultado Chave';
      } else if (error.code === '23503') {
        errorMessage = 'O FCA selecionado não existe ou não pertence a este Resultado Chave. Verifique se o FCA está ativo e tente novamente.';
      } else if (error.code === '42501') {
        errorMessage = 'Você não tem permissão para criar ações neste FCA ou empresa';
      } else if (error.message) {
        // Mensagens do trigger e funções personalizadas já em português
        errorMessage = error.message;
      }

      toast({
        title: "Erro ao Criar Ação",
        description: errorMessage,
        variant: "destructive",
      });
      
      throw error;
    } finally {
      setLoading(false);
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
        .eq('id', actionId)
        .eq('key_result_id', keyResultId as string);

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

  // Validar se FCA existe e pertence ao KR (versão melhorada)
  const validateFCAExists = async (fcaId: string, keyResultId?: string) => {
    try {
      const query = supabase
        .from('kr_fca')
        .select('id, key_result_id, status')
        .eq('id', fcaId);

      if (keyResultId) {
        query.eq('key_result_id', keyResultId);
      }

      const { data, error } = await supabase
        .from('kr_fca')
        .select('id, key_result_id, status')
        .eq('id', fcaId)
        .maybeSingle();

      if (error) {
        console.error('Error validating FCA:', error);
        throw new Error(`Erro ao validar FCA: ${error.message}`);
      }

      if (!data) {
        throw new Error('FCA não encontrado');
      }

      if (keyResultId && data.key_result_id !== keyResultId) {
        throw new Error('FCA não pertence ao Resultado Chave especificado');
      }

      if (data.status !== 'active') {
        throw new Error('FCA não está ativo');
      }

      return true;
    } catch (error) {
      console.error('Error validating FCA:', error);
      throw error;
    }
  };

  // Obter ações por FCA
  const getActionsByFCA = (fcaId: string) => {
    return actions.filter(action => action.fca_id === fcaId);
  };

  // Atribuir ação a um FCA
  const assignActionToFCA = async (actionId: string, fcaId: string | null) => {
    try {
      const { data, error } = await supabase
        .from('kr_monthly_actions')
        .update({ fca_id: fcaId })
        .eq('id', actionId)
        .select()
        .single();

      if (error) throw error;

      setActions(prev => prev.map(action => 
        action.id === actionId ? { ...action, fca_id: fcaId } : action
      ));

      toast({
        title: "Sucesso",
        description: fcaId ? "Ação vinculada ao FCA" : "Ação desvinculada do FCA",
      });

      return data;
    } catch (error) {
      console.error('Error assigning action to FCA:', error);
      toast({
        title: "Erro",
        description: "Erro ao vincular ação ao FCA",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Carregar ações com filtro de FCA
  const loadActionsByFCA = async (fcaId?: string) => {
    if (!keyResultId) return;
    
    setLoading(true);
    try {
      let query = supabase
        .from('kr_monthly_actions')
        .select('*')
        .eq('key_result_id', keyResultId);

      if (fcaId) {
        query = query.eq('fca_id', fcaId);
      } else if (fcaId === null) {
        query = query.is('fca_id', null);
      }

      const { data, error } = await query.order('month_year', { ascending: false });

      if (error) throw error;
      setActions((data || []).map(item => ({
        ...item,
        status: item.status as 'planned' | 'in_progress' | 'completed' | 'cancelled',
        priority: item.priority as 'low' | 'medium' | 'high',
      })));
    } catch (error) {
      console.error('Error loading KR actions by FCA:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar ações do KR",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
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
    loadActionsByFCA,
    loadHistory,
    getActionsByMonth,
    getActionsByFCA,
    assignActionToFCA,
    getActionStats,
    validateFCAExists,
  };
};