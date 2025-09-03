import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useMultiTenant';

export interface MentoringSessionWithMentor {
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
  beep_related_items?: any;
  mentor_name: string;
}

export const useStartupSessions = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<MentoringSessionWithMentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStartupSessions = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);

      // Get user startup company using direct query first
      const { data: userCompanyRelations, error: relationError } = await supabase
        .from('user_company_relations')
        .select(`
          company_id,
          companies!inner(id, name, company_type)
        `)
        .eq('user_id', user.id)
        .eq('companies.company_type', 'startup');

      if (relationError) {
        console.error('Error fetching company relations:', relationError);
        setError(`Erro ao buscar empresa: ${relationError.message}`);
        return;
      }

      if (!userCompanyRelations || userCompanyRelations.length === 0) {
        setSessions([]);
        return;
      }

      const companyId = userCompanyRelations[0].company_id;

      // Get sessions for this startup
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('mentoring_sessions')
        .select('*')
        .eq('startup_company_id', companyId)
        .order('session_date', { ascending: false });

      if (sessionsError) {
        setError(`Erro ao buscar sessões: ${sessionsError.message}`);
        return;
      }

      if (!sessionsData || sessionsData.length === 0) {
        setSessions([]);
        return;
      }

      // Get mentor profiles
      const mentorIds = [...new Set(sessionsData.map(s => s.mentor_id))];
      const { data: mentorProfiles } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name')
        .in('user_id', mentorIds);

      // Create mentor map
      const mentorMap = new Map(mentorProfiles?.map(p => [
        p.user_id, 
        `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Mentor'
      ]) || []);

      // Combine sessions with mentor profiles
      const sessionsWithMentors = sessionsData.map(session => ({
        ...session,
        mentor_name: mentorMap.get(session.mentor_id) || 'Mentor Desconhecido'
      }));
      
      setSessions(sessionsWithMentors);
    } catch (err) {
      setError('Erro inesperado ao buscar sessões');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchStartupSessions();
  }, [fetchStartupSessions]);

  return {
    sessions,
    loading,
    error,
    refetch: fetchStartupSessions
  };
};