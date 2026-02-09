import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useMultiTenant';
import { useToast } from '@/hooks/use-toast';
import type { Json } from '@/integrations/supabase/types';

export interface MentoringSession {
  id: string;
  mentor_id: string;
  startup_company_id: string;
  session_date: string;
  duration: number;
  session_type: string;
  notes: string;
  follow_up_date?: string;
  status: string;
  created_at: string;
  updated_at: string;
  startup_name?: string;
  beep_related_items?: Json;
  mentor_name?: string;
  mentor_avatar_url?: string;
  is_own_session?: boolean;
}

export const useMentorSessions = () => {
  const { user, company } = useAuth();
  const { toast } = useToast();
  const [sessions, setSessions] = useState<MentoringSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = async () => {
    if (!user?.id) {
      setLoading(false);
      setSessions([]);
      return;
    }

    try {
      if (sessions.length === 0) {
        setLoading(true);
      }
      setError(null);

      // RLS handles visibility - no need for .eq('mentor_id', user.id)
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('mentoring_sessions')
        .select(`
          *,
          companies!startup_company_id (
            id,
            name
          )
        `)
        .order('session_date', { ascending: false });

      if (sessionsError) throw sessionsError;

      // Get unique mentor IDs and fetch their profiles
      const mentorIds = [...new Set((sessionsData || []).map(s => s.mentor_id))];
      const { data: mentorProfiles } = mentorIds.length > 0
        ? await supabase
            .from('profiles')
            .select('user_id, first_name, last_name, avatar_url')
            .in('user_id', mentorIds)
        : { data: [] };

      const mentorMap = new Map(
        (mentorProfiles || []).map(p => [p.user_id, p])
      );

      const sessionsWithDetails = (sessionsData || []).map((session: any) => {
        const mentor = mentorMap.get(session.mentor_id);
        const mentorName = mentor
          ? [mentor.first_name, mentor.last_name].filter(Boolean).join(' ') || 'Mentor'
          : 'Mentor';

        return {
          ...session,
          startup_name: session.companies?.name || 'Startup',
          mentor_name: mentorName,
          mentor_avatar_url: mentor?.avatar_url || null,
          is_own_session: session.mentor_id === user.id,
        };
      });

      setSessions(sessionsWithDetails);
    } catch (err: any) {
      console.error('Error fetching sessions:', err);
      setError(err.message || 'Erro inesperado ao buscar sessões');
    } finally {
      setLoading(false);
    }
  };

  const createSession = async (sessionData: Omit<MentoringSession, 'id' | 'mentor_id' | 'created_at' | 'updated_at' | 'startup_name'>) => {
    if (!user) return { error: 'Usuário não autenticado' };

    try {
      const { data, error: insertError } = await supabase
        .from('mentoring_sessions')
        .insert([{
          ...sessionData,
          mentor_id: user.id,
          session_date: new Date(sessionData.session_date + 'T12:00:00').toISOString(),
          follow_up_date: sessionData.follow_up_date ? new Date(sessionData.follow_up_date + 'T12:00:00').toISOString() : null
        }])
        .select()
        .single();

      if (insertError) throw insertError;

      await fetchSessions();
      toast({
        title: 'Sessão criada',
        description: 'A sessão foi criada com sucesso.'
      });
      
      return { data };
    } catch (err: any) {
      console.error('Error creating session:', err);
      toast({
        title: 'Erro',
        description: err.message || 'Erro ao criar sessão',
        variant: 'destructive'
      });
      return { error: err.message };
    }
  };

  const updateSession = async (id: string, updates: Partial<MentoringSession>) => {
    try {
      const processedUpdates = {
        ...updates,
        session_date: updates.session_date ? new Date(updates.session_date + 'T12:00:00').toISOString() : updates.session_date,
        follow_up_date: updates.follow_up_date ? new Date(updates.follow_up_date + 'T12:00:00').toISOString() : null
      };

      const { data, error: updateError } = await supabase
        .from('mentoring_sessions')
        .update(processedUpdates)
        .eq('id', id)
        .eq('mentor_id', user?.id)
        .select()
        .single();

      if (updateError) throw updateError;

      await fetchSessions();
      toast({
        title: 'Sessão atualizada',
        description: 'A sessão foi atualizada com sucesso.'
      });
      
      return { data };
    } catch (err: any) {
      console.error('Error updating session:', err);
      toast({
        title: 'Erro',
        description: err.message || 'Erro ao atualizar sessão',
        variant: 'destructive'
      });
      return { error: err.message };
    }
  };

  const deleteSession = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('mentoring_sessions')
        .delete()
        .eq('id', id)
        .eq('mentor_id', user?.id);

      if (deleteError) throw deleteError;

      await fetchSessions();
      toast({
        title: 'Sessão excluída',
        description: 'A sessão foi excluída com sucesso.'
      });
      
      return { success: true };
    } catch (err: any) {
      console.error('Error deleting session:', err);
      toast({
        title: 'Erro',
        description: err.message || 'Erro ao excluir sessão',
        variant: 'destructive'
      });
      return { error: err.message };
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchSessions();
    } else {
      setSessions([]);
      setLoading(false);
    }
  }, [user?.id]);

  return {
    sessions,
    loading,
    error,
    refetch: fetchSessions,
    createSession,
    updateSession,
    deleteSession
  };
};
