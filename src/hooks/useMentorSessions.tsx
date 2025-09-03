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
  const { user } = useAuth();
  const { toast } = useToast();
  const [sessions, setSessions] = useState<MentoringSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // First get sessions
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('mentoring_sessions')
        .select('*')
        .eq('mentor_id', user.id)
        .order('session_date', { ascending: false });

      if (sessionsError) throw sessionsError;

      if (!sessionsData || sessionsData.length === 0) {
        setSessions([]);
        return;
      }

      // Get company IDs
      const companyIds = [...new Set(sessionsData.map(s => s.startup_company_id))];

      // Get company names
      const { data: companies, error: companiesError } = await supabase
        .from('companies')
        .select('id, name')
        .in('id', companyIds);

      if (companiesError) throw companiesError;

      // Create company map
      const companyMap = new Map(companies?.map(c => [c.id, c.name]) || []);

      const sessionsWithCompanies = sessionsData.map(session => ({
        ...session,
        startup_name: companyMap.get(session.startup_company_id) || 'Startup Desconhecida'
      }));

      setSessions(sessionsWithCompanies);
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
      const { data, error: updateError } = await supabase
        .from('mentoring_sessions')
        .update(updates)
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
    if (user) {
      fetchSessions();
    } else {
      setSessions([]);
      setLoading(false);
    }
  }, [user]);

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