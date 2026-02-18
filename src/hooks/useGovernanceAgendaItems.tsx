import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useMultiTenant';
import { toast } from 'sonner';

export interface GovernanceAgendaItem {
  id: string;
  meeting_id: string;
  title: string;
  description: string | null;
  responsible_user_id: string | null;
  order_index: number;
  status: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export const useGovernanceAgendaItems = (meetingId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const itemsQuery = useQuery({
    queryKey: ['governance-agenda-items', meetingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('governance_agenda_items')
        .select('*')
        .eq('meeting_id', meetingId!)
        .order('order_index');
      if (error) throw error;
      return data as GovernanceAgendaItem[];
    },
    enabled: !!meetingId,
  });

  const addItem = useMutation({
    mutationFn: async (data: { title: string; description?: string; responsible_user_id?: string }) => {
      const { error } = await supabase.from('governance_agenda_items').insert({
        meeting_id: meetingId!,
        title: data.title,
        description: data.description || null,
        responsible_user_id: data.responsible_user_id || null,
        order_index: (itemsQuery.data?.length || 0),
        created_by: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['governance-agenda-items', meetingId] });
      toast.success('Item de pauta adicionado');
    },
    onError: () => toast.error('Erro ao adicionar item'),
  });

  const updateItem = useMutation({
    mutationFn: async (data: { id: string; title?: string; description?: string; responsible_user_id?: string; status?: string }) => {
      const updateData: any = {};
      if (data.title !== undefined) updateData.title = data.title;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.responsible_user_id !== undefined) updateData.responsible_user_id = data.responsible_user_id || null;
      if (data.status !== undefined) updateData.status = data.status;
      const { error } = await supabase.from('governance_agenda_items').update(updateData).eq('id', data.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['governance-agenda-items', meetingId] });
      toast.success('Item atualizado');
    },
    onError: () => toast.error('Erro ao atualizar item'),
  });

  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('governance_agenda_items').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['governance-agenda-items', meetingId] });
      toast.success('Item removido');
    },
    onError: () => toast.error('Erro ao remover item'),
  });

  return {
    items: itemsQuery.data || [],
    isLoading: itemsQuery.isLoading,
    addItem,
    updateItem,
    deleteItem,
  };
};
