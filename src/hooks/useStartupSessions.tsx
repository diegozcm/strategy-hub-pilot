import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useMultiTenant';
import type { Json } from '@/integrations/supabase/types';

interface MentoringSession {
  id: string;
  mentor_id: string;
  startup_company_id: string;
  session_date: string;
  duration: number;
  session_type: string;
  notes: string;
  action_items: Json;
  follow_up_date?: string;
  status: string;
  created_at: string;
  mentor_name?: string;
  mentor_profile?: {
    first_name: string;
    last_name: string;
  };
}

export const useStartupSessions = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<MentoringSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStartupSessions = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);

      // First, get user's startup company
      const { data: userCompany } = await supabase.rpc('get_user_startup_company', {
        _user_id: user.id
      });

      if (!userCompany || userCompany.length === 0) {
        setSessions([]);
        setLoading(false);
        return;
      }

      const companyId = userCompany[0].id;

      // Get sessions for this startup
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('mentoring_sessions')
        .select('*')
        .eq('startup_company_id', companyId)
        .order('session_date', { ascending: false });

      if (sessionsError) {
        console.error('Error fetching startup sessions:', sessionsError);
        setError(sessionsError.message);
        return;
      }

      if (!sessionsData || sessionsData.length === 0) {
        setSessions([]);
        setLoading(false);
        return;
      }

      // Get mentor profiles
      const mentorIds = [...new Set(sessionsData.map(s => s.mentor_id))];

      const { data: mentorProfiles, error: mentorError } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name')
        .in('user_id', mentorIds);

      if (mentorError) {
        console.error('Error fetching mentor profiles:', mentorError);
        setError(mentorError.message);
        return;
      }

      // Create mentor map
      const mentorMap = new Map(mentorProfiles?.map(p => [
        p.user_id, 
        `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Mentor'
      ]) || []);

      const sessionsWithMentors = sessionsData.map(session => ({
        ...session,
        mentor_name: mentorMap.get(session.mentor_id) || 'Mentor Desconhecido'
      }));

      setSessions(sessionsWithMentors);
    } catch (err) {
      console.error('Unexpected error fetching startup sessions:', err);
      setError('Erro inesperado ao buscar sessões');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStartupSessions();
  }, [user]);

  return {
    sessions,
    loading,
    error,
    refetch: fetchStartupSessions
  };
};