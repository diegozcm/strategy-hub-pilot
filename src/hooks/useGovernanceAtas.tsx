import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useMultiTenant';
import { toast } from 'sonner';

export interface GovernanceAta {
  id: string;
  meeting_id: string;
  content: string | null;
  decisions: string | null;
  participants: string[];
  approved: boolean;
  approved_by: string | null;
  approved_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export const useGovernanceAtas = (meetingId?: string) => {
  const { user, company } = useAuth();
  const queryClient = useQueryClient();
  const companyId = company?.id;

  // When meetingId provided, get atas for that meeting; otherwise get all for company
  const atasQuery = useQuery({
    queryKey: ['governance-atas', meetingId || companyId],
    queryFn: async () => {
      let query = supabase.from('governance_atas').select('*, governance_meetings!inner(title, scheduled_date, company_id)');
      if (meetingId) {
        query = query.eq('meeting_id', meetingId);
      } else {
        query = query.eq('governance_meetings.company_id', companyId!);
      }
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data as (GovernanceAta & { governance_meetings: { title: string; scheduled_date: string; company_id: string } })[];
    },
    enabled: !!(meetingId || companyId),
  });

  const addAta = useMutation({
    mutationFn: async (data: { meeting_id: string; content?: string; decisions?: string; participants?: string[] }) => {
      const { error } = await supabase.from('governance_atas').insert({
        meeting_id: data.meeting_id,
        content: data.content || null,
        decisions: data.decisions || null,
        participants: data.participants || [],
        created_by: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['governance-atas'] });
      toast.success('ATA criada');
    },
    onError: () => toast.error('Erro ao criar ATA'),
  });

  const updateAta = useMutation({
    mutationFn: async (data: { id: string; content?: string; decisions?: string; participants?: string[] }) => {
      const updateData: any = {};
      if (data.content !== undefined) updateData.content = data.content;
      if (data.decisions !== undefined) updateData.decisions = data.decisions;
      if (data.participants !== undefined) updateData.participants = data.participants;
      const { error } = await supabase.from('governance_atas').update(updateData).eq('id', data.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['governance-atas'] });
      toast.success('ATA atualizada');
    },
    onError: () => toast.error('Erro ao atualizar ATA'),
  });

  const approveAta = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('governance_atas').update({
        approved: true,
        approved_by: user.id,
        approved_at: new Date().toISOString(),
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['governance-atas'] });
      toast.success('ATA aprovada');
    },
    onError: () => toast.error('Erro ao aprovar ATA'),
  });

  const deleteAta = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('governance_atas').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['governance-atas'] });
      toast.success('ATA removida');
    },
    onError: () => toast.error('Erro ao remover ATA'),
  });

  return {
    atas: atasQuery.data || [],
    isLoading: atasQuery.isLoading,
    addAta,
    updateAta,
    approveAta,
    deleteAta,
  };
};
