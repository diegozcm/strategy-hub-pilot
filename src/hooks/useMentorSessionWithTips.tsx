import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useMultiTenant';
import { useToast } from '@/hooks/use-toast';
import type { MentoringSession, MentoringTip } from '@/types/mentoring';
import type { Json } from '@/integrations/supabase/types';

export const useMentorSessionWithTips = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sessions, setSessions] = useState<MentoringSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSessionsWithTips = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);

      // First fetch sessions
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('mentoring_sessions')
        .select('*')
        .eq('mentor_id', user.id)
        .order('session_date', { ascending: false });

      if (sessionsError) {
        console.error('Error fetching sessions:', sessionsError);
        setError(sessionsError.message);
        return;
      }

      if (!sessionsData || sessionsData.length === 0) {
        setSessions([]);
        setLoading(false);
        return;
      }

      // Get company names
      const companyIds = [...new Set(sessionsData.map(s => s.startup_company_id))];
      const { data: companies } = await supabase
        .from('companies')
        .select('id, name')
        .in('id', companyIds);

      const companyMap = new Map(companies?.map(c => [c.id, c.name]) || []);

      // Get tips for each session
      const sessionIds = sessionsData.map(s => s.id);
      const { data: tipsData } = await supabase
        .from('mentoring_tips')
        .select('*')
        .in('session_id', sessionIds)
        .order('created_at', { ascending: false });

      // Group tips by session
      const tipsMap = new Map<string, MentoringTip[]>();
      tipsData?.forEach(tip => {
        if (tip.session_id) {
          if (!tipsMap.has(tip.session_id)) {
            tipsMap.set(tip.session_id, []);
          }
          tipsMap.get(tip.session_id)!.push(tip);
        }
      });

      // Combine sessions with tips and company names
      const sessionsWithTips = sessionsData.map(session => ({
        ...session,
        startup_name: companyMap.get(session.startup_company_id) || 'Startup Desconhecida',
        tips: tipsMap.get(session.id) || [],
        tips_count: tipsMap.get(session.id)?.length || 0
      }));

      setSessions(sessionsWithTips);
    } catch (err) {
      console.error('Unexpected error fetching sessions:', err);
      setError('Erro inesperado ao buscar sessões');
    } finally {
      setLoading(false);
    }
  };

  const createSession = async (sessionData: Omit<MentoringSession, 'id' | 'mentor_id' | 'created_at' | 'updated_at' | 'startup_name' | 'tips' | 'tips_count'>) => {
    if (!user) return { error: 'Usuário não autenticado' };

    try {
      const { data, error: insertError } = await supabase
        .from('mentoring_sessions')
        .insert([{
          ...sessionData,
          mentor_id: user.id
        }])
        .select()
        .single();

      if (insertError) {
        console.error('Error creating session:', insertError);
        return { error: insertError.message };
      }

      toast({
        title: "Sessão criada",
        description: "Sessão de mentoria criada com sucesso!"
      });

      await fetchSessionsWithTips();
      return { data };
    } catch (err) {
      console.error('Unexpected error creating session:', err);
      return { error: 'Erro inesperado ao criar sessão' };
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

      if (updateError) {
        console.error('Error updating session:', updateError);
        return { error: updateError.message };
      }

      toast({
        title: "Sessão atualizada",
        description: "Sessão de mentoria atualizada com sucesso!"
      });

      await fetchSessionsWithTips();
      return { data };
    } catch (err) {
      console.error('Unexpected error updating session:', err);
      return { error: 'Erro inesperado ao atualizar sessão' };
    }
  };

  const createTipInSession = async (sessionId: string, tipData: Omit<MentoringTip, 'id' | 'mentor_id' | 'session_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return { error: 'Usuário não autenticado' };

    try {
      // Get session to inherit startup_company_id
      const session = sessions.find(s => s.id === sessionId);
      if (!session) return { error: 'Sessão não encontrada' };

      const { data, error: insertError } = await supabase
        .from('mentoring_tips')
        .insert([{
          ...tipData,
          mentor_id: user.id,
          session_id: sessionId,
          startup_company_id: session.startup_company_id
        }])
        .select()
        .single();

      if (insertError) {
        console.error('Error creating tip:', insertError);
        return { error: insertError.message };
      }

      toast({
        title: "Dica criada",
        description: "Dica adicionada à sessão com sucesso!"
      });

      await fetchSessionsWithTips();
      return { data };
    } catch (err) {
      console.error('Unexpected error creating tip:', err);
      return { error: 'Erro inesperado ao criar dica' };
    }
  };

  const updateTip = async (id: string, updates: Partial<MentoringTip>) => {
    try {
      const { data, error: updateError } = await supabase
        .from('mentoring_tips')
        .update(updates)
        .eq('id', id)
        .eq('mentor_id', user?.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating tip:', updateError);
        return { error: updateError.message };
      }

      toast({
        title: "Dica atualizada",
        description: "Dica atualizada com sucesso!"
      });

      await fetchSessionsWithTips();
      return { data };
    } catch (err) {
      console.error('Unexpected error updating tip:', err);
      return { error: 'Erro inesperado ao atualizar dica' };
    }
  };

  const deleteTip = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('mentoring_tips')
        .delete()
        .eq('id', id)
        .eq('mentor_id', user?.id);

      if (deleteError) {
        console.error('Error deleting tip:', deleteError);
        return { error: deleteError.message };
      }

      toast({
        title: "Dica removida",
        description: "Dica removida da sessão com sucesso!"
      });

      await fetchSessionsWithTips();
      return { success: true };
    } catch (err) {
      console.error('Unexpected error deleting tip:', err);
      return { error: 'Erro inesperado ao remover dica' };
    }
  };

  useEffect(() => {
    fetchSessionsWithTips();
  }, [user]);

  return {
    sessions,
    loading,
    error,
    createSession,
    updateSession,
    createTipInSession,
    updateTip,
    deleteTip,
    refetch: fetchSessionsWithTips
  };
};