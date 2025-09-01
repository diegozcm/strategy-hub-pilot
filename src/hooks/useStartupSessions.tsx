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
  console.log('🎯 [useStartupSessions] Hook initialization');
  
  const { user } = useAuth();
  const [sessions, setSessions] = useState<MentoringSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  console.log('🎯 [useStartupSessions] Initial state:', { 
    hasUser: !!user, 
    userEmail: user?.email,
    sessionsCount: sessions.length, 
    loading, 
    error 
  });

  const fetchStartupSessions = async () => {
    console.log('🔍 [useStartupSessions] Starting fetchStartupSessions');
    
    if (!user) {
      console.log('❌ [useStartupSessions] No user found');
      return;
    }
    
    console.log('👤 [useStartupSessions] User:', user.id, user.email);
    
    try {
      setLoading(true);
      setError(null);

      // First, get user's startup company
      console.log('🏢 [useStartupSessions] Getting user startup company...');
      const { data: userCompany, error: companyError } = await supabase.rpc('get_user_startup_company', {
        _user_id: user.id
      });

      console.log('🏢 [useStartupSessions] User company result:', { userCompany, companyError });

      if (companyError) {
        console.error('❌ [useStartupSessions] Error getting user company:', companyError);
        setError(`Erro ao buscar empresa: ${companyError.message}`);
        return;
      }

      if (!userCompany || userCompany.length === 0) {
        console.log('⚠️ [useStartupSessions] No company found for user');
        setSessions([]);
        setLoading(false);
        return;
      }

      const companyId = userCompany[0].id;
      console.log('🏢 [useStartupSessions] Company found:', companyId, userCompany[0].name);

      // Get sessions for this startup
      console.log('📅 [useStartupSessions] Fetching sessions for company:', companyId);
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('mentoring_sessions')
        .select('*')
        .eq('startup_company_id', companyId)
        .order('session_date', { ascending: false });

      console.log('📅 [useStartupSessions] Sessions result:', { 
        sessionsData, 
        sessionsError,
        count: sessionsData?.length || 0 
      });

      if (sessionsError) {
        console.error('❌ [useStartupSessions] Error fetching sessions:', sessionsError);
        setError(`Erro ao buscar sessões: ${sessionsError.message}`);
        return;
      }

      if (!sessionsData || sessionsData.length === 0) {
        console.log('⚠️ [useStartupSessions] No sessions found');
        setSessions([]);
        setLoading(false);
        return;
      }

      console.log('📅 [useStartupSessions] Found sessions:', sessionsData.length);

      // Get mentor profiles
      const mentorIds = [...new Set(sessionsData.map(s => s.mentor_id))];
      console.log('👨‍🏫 [useStartupSessions] Mentor IDs to fetch:', mentorIds);

      const { data: mentorProfiles, error: mentorError } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name')
        .in('user_id', mentorIds);

      console.log('👨‍🏫 [useStartupSessions] Mentor profiles result:', { mentorProfiles, mentorError });

      if (mentorError) {
        console.error('❌ [useStartupSessions] Error fetching mentor profiles:', mentorError);
        setError(`Erro ao buscar perfis dos mentores: ${mentorError.message}`);
        return;
      }

      // Create mentor map
      const mentorMap = new Map(mentorProfiles?.map(p => [
        p.user_id, 
        `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Mentor'
      ]) || []);

      console.log('👨‍🏫 [useStartupSessions] Mentor map:', Array.from(mentorMap.entries()));

      const sessionsWithMentors = sessionsData.map(session => ({
        ...session,
        mentor_name: mentorMap.get(session.mentor_id) || 'Mentor Desconhecido'
      }));

      console.log('✅ [useStartupSessions] Final sessions with mentors:', sessionsWithMentors);
      setSessions(sessionsWithMentors);
    } catch (err) {
      console.error('💥 [useStartupSessions] Unexpected error:', err);
      setError('Erro inesperado ao buscar sessões');
    } finally {
      setLoading(false);
      console.log('🏁 [useStartupSessions] Fetch complete');
    }
  };

  useEffect(() => {
    console.log('🔄 [useStartupSessions] useEffect triggered, user changed:', { 
      hasUser: !!user, 
      userEmail: user?.email 
    });
    fetchStartupSessions();
  }, [user]);

  return {
    sessions,
    loading,
    error,
    refetch: fetchStartupSessions
  };
};