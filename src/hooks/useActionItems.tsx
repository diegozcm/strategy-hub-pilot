import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useMultiTenant';
import { useToast } from '@/hooks/use-toast';

export interface ActionItem {
  id: string;
  session_id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  due_date?: string;
  created_by: string;
  creator_name?: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
}

export const useActionItems = (sessionId?: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActionItems = async () => {
    if (!user || !sessionId) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);

      // Buscar itens de ação
      const { data, error: fetchError } = await supabase
        .from('action_items')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false});

      if (fetchError) {
        console.error('Error fetching action items:', fetchError);
        setError(fetchError.message);
        return;
      }

      // Se não há itens, retornar array vazio
      if (!data || data.length === 0) {
        setActionItems([]);
        return;
      }

      // Buscar perfis dos criadores
      const creatorIds = [...new Set(data.map(item => item.created_by))];
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name')
        .in('user_id', creatorIds);

      if (profilesError) {
        console.error('Error fetching creator profiles:', profilesError);
        // Continuar sem os nomes dos criadores
        setActionItems(data as ActionItem[]);
        return;
      }

      // Combinar dados dos itens com os nomes dos criadores
      const itemsWithCreatorNames = data.map(item => ({
        ...item,
        creator_name: (() => {
          const profile = profiles?.find(p => p.user_id === item.created_by);
          if (profile?.first_name && profile?.last_name) {
            return `${profile.first_name} ${profile.last_name}`.trim();
          }
          return 'Usuário';
        })()
      }));

      setActionItems(itemsWithCreatorNames as ActionItem[]);
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('Erro inesperado ao buscar itens de ação');
    } finally {
      setLoading(false);
    }
  };

  const createActionItem = async (itemData: Omit<ActionItem, 'id' | 'created_by' | 'created_at' | 'updated_at'>) => {
    if (!user) {
      toast({
        title: 'Erro',
        description: 'Usuário não autenticado',
        variant: 'destructive'
      });
      return { error: 'Usuário não autenticado' };
    }

    try {
      const { data, error: insertError } = await supabase
        .from('action_items')
        .insert([{
          ...itemData,
          created_by: user.id
        }])
        .select()
        .single();

      if (insertError) {
        console.error('Error creating action item:', insertError);
        toast({
          title: 'Erro',
          description: insertError.message || 'Erro ao criar item de ação',
          variant: 'destructive'
        });
        return { error: insertError.message };
      }

      await fetchActionItems();
      toast({
        title: 'Item criado',
        description: 'Item de ação criado com sucesso'
      });
      
      return { data };
    } catch (err: any) {
      console.error('Unexpected error:', err);
      const errorMsg = 'Erro inesperado ao criar item de ação';
      toast({
        title: 'Erro',
        description: errorMsg,
        variant: 'destructive'
      });
      return { error: errorMsg };
    }
  };

  const updateActionItem = async (id: string, updates: Partial<ActionItem>) => {
    try {
      const { data, error: updateError } = await supabase
        .from('action_items')
        .update(updates)
        .eq('id', id)
        .select()
        .maybeSingle();

      if (updateError) {
        console.error('Error updating action item:', updateError);
        toast({
          title: 'Erro',
          description: updateError.message || 'Erro ao atualizar item de ação',
          variant: 'destructive'
        });
        return { error: updateError.message };
      }

      await fetchActionItems();
      toast({
        title: 'Item atualizado',
        description: 'Item de ação atualizado com sucesso'
      });
      
      return { data };
    } catch (err: any) {
      console.error('Unexpected error:', err);
      const errorMsg = 'Erro inesperado ao atualizar item de ação';
      toast({
        title: 'Erro',
        description: errorMsg,
        variant: 'destructive'
      });
      return { error: errorMsg };
    }
  };

  const deleteActionItem = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('action_items')
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.error('Error deleting action item:', deleteError);
        toast({
          title: 'Erro',
          description: deleteError.message || 'Erro ao excluir item de ação',
          variant: 'destructive'
        });
        return { error: deleteError.message };
      }

      await fetchActionItems();
      toast({
        title: 'Item excluído',
        description: 'Item de ação excluído com sucesso'
      });
      
      return { success: true };
    } catch (err: any) {
      console.error('Unexpected error:', err);
      const errorMsg = 'Erro inesperado ao excluir item de ação';
      toast({
        title: 'Erro',
        description: errorMsg,
        variant: 'destructive'
      });
      return { error: errorMsg };
    }
  };

  useEffect(() => {
    if (sessionId) {
      fetchActionItems();
    }
  }, [user, sessionId]);

  // Separar itens ativos e concluídos
  const activeItems = actionItems.filter(item => item.status !== 'completed');
  const completedItems = actionItems.filter(item => item.status === 'completed');

  return {
    actionItems,
    activeItems,
    completedItems,
    loading,
    error,
    refetch: fetchActionItems,
    createActionItem,
    updateActionItem,
    deleteActionItem
  };
};