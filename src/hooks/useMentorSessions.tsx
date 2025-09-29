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
      // Only show loading if we don't have sessions data yet
      if (sessions.length === 0) {
        setLoading(true);
      }
      setError(null);

      // Fetch sessions for all startups where the user is a mentor
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('mentoring_sessions')
        .select(`
          *,
          companies!startup_company_id (
            id,
            name
          )
        `)
        .eq('mentor_id', user.id)
        .order('session_date', { ascending: false });

      if (sessionsError) throw sessionsError;

      // Map company name from the joined companies table
      const sessionsWithCompany = (sessionsData || []).map(session => ({
        ...session,
        startup_name: session.companies?.name || 'Startup'
      }));

      setSessions(sessionsWithCompany);
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
          follow_up_date: sessionData.follow_up_date || null
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
      // Handle empty date fields by converting them to null and ensure proper date formatting
      const processedUpdates = {
        ...updates,
        session_date: updates.session_date ? new Date(updates.session_date + 'T00:00:00').toISOString() : updates.session_date,
        follow_up_date: updates.follow_up_date ? new Date(updates.follow_up_date + 'T00:00:00').toISOString() : null
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