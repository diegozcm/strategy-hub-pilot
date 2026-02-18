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
  const { user, company } = useAuth();
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

  // Fetch agenda items from OTHER meetings (for import feature)
  const otherItemsQuery = useQuery({
    queryKey: ['governance-agenda-items-other', meetingId, company?.id],
    queryFn: async () => {
      // First get meetings for this company
      const { data: meetings, error: mErr } = await supabase
        .from('governance_meetings')
        .select('id, title, scheduled_date, meeting_type')
        .eq('company_id', company!.id)
        .neq('id', meetingId!)
        .order('scheduled_date', { ascending: false });
      if (mErr) throw mErr;

      if (!meetings?.length) return [];

      const meetingIds = meetings.map(m => m.id);
      const { data: items, error: iErr } = await supabase
        .from('governance_agenda_items')
        .select('*')
        .in('meeting_id', meetingIds)
        .order('order_index');
      if (iErr) throw iErr;

      return (items || []).map(item => ({
        ...item,
        _meeting: meetings.find(m => m.id === item.meeting_id),
      })) as (GovernanceAgendaItem & { _meeting?: { id: string; title: string; scheduled_date: string; meeting_type: string } })[];
    },
    enabled: !!meetingId && !!company?.id,
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

  const importItems = useMutation({
    mutationFn: async (sourceItems: { title: string; description: string | null; responsible_user_id: string | null }[]) => {
      const currentCount = itemsQuery.data?.length || 0;
      const inserts = sourceItems.map((item, idx) => ({
        meeting_id: meetingId!,
        title: item.title,
        description: item.description,
        responsible_user_id: item.responsible_user_id,
        order_index: currentCount + idx,
        created_by: user.id,
        status: 'pending',
      }));
      const { error } = await supabase.from('governance_agenda_items').insert(inserts);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['governance-agenda-items', meetingId] });
      toast.success('Pautas importadas com sucesso');
    },
    onError: () => toast.error('Erro ao importar pautas'),
  });

  return {
    items: itemsQuery.data || [],
    otherItems: otherItemsQuery.data || [],
    isLoading: itemsQuery.isLoading,
    addItem,
    updateItem,
    deleteItem,
    importItems,
  };
};
