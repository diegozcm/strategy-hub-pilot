import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useMultiTenant';
import { toast } from 'sonner';

export interface GovernanceMeeting {
  id: string;
  company_id: string;
  title: string;
  meeting_type: string;
  scheduled_date: string;
  scheduled_time: string | null;
  duration_minutes: number | null;
  location: string | null;
  status: string;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface MeetingFormData {
  title: string;
  meeting_type: string;
  scheduled_date: string;
  scheduled_time?: string;
  duration_minutes?: number;
  location?: string;
  notes?: string;
}

export const useGovernanceMeetings = () => {
  const { company, user } = useAuth();
  const queryClient = useQueryClient();
  const companyId = company?.id;

  const meetingsQuery = useQuery({
    queryKey: ['governance-meetings', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('governance_meetings')
        .select('*')
        .eq('company_id', companyId!)
        .order('scheduled_date', { ascending: false });
      if (error) throw error;
      return data as GovernanceMeeting[];
    },
    enabled: !!companyId,
  });

  const addMeeting = useMutation({
    mutationFn: async (data: MeetingFormData) => {
      const { error } = await supabase.from('governance_meetings').insert({
        company_id: companyId!,
        title: data.title,
        meeting_type: data.meeting_type,
        scheduled_date: data.scheduled_date,
        scheduled_time: data.scheduled_time || null,
        duration_minutes: data.duration_minutes || 60,
        location: data.location || null,
        notes: data.notes || null,
        created_by: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['governance-meetings', companyId] });
      toast.success('Reunião agendada');
    },
    onError: () => toast.error('Erro ao agendar reunião'),
  });

  const updateMeeting = useMutation({
    mutationFn: async ({ id, ...data }: MeetingFormData & { id: string }) => {
      const { error } = await supabase.from('governance_meetings').update({
        title: data.title,
        meeting_type: data.meeting_type,
        scheduled_date: data.scheduled_date,
        scheduled_time: data.scheduled_time || null,
        duration_minutes: data.duration_minutes || 60,
        location: data.location || null,
        notes: data.notes || null,
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['governance-meetings', companyId] });
      toast.success('Reunião atualizada');
    },
    onError: () => toast.error('Erro ao atualizar reunião'),
  });

  const updateMeetingStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from('governance_meetings').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['governance-meetings', companyId] });
    },
  });

  const deleteMeeting = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('governance_meetings').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['governance-meetings', companyId] });
      toast.success('Reunião removida');
    },
    onError: () => toast.error('Erro ao remover reunião'),
  });

  return {
    meetings: meetingsQuery.data || [],
    isLoading: meetingsQuery.isLoading,
    addMeeting,
    updateMeeting,
    updateMeetingStatus,
    deleteMeeting,
  };
};
