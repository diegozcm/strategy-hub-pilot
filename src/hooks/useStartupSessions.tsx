import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useMultiTenant';
import type { MentoringSession, MentoringTip } from '@/types/mentoring';

export const useStartupSessions = () => {
  console.log('🎯 [useStartupSessions] Hook initialization');
  
  const { user } = useAuth();
  const [sessions, setSessions] = useState<MentoringSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>({});

  console.log('🎯 [useStartupSessions] Initial state:', { 
    hasUser: !!user, 
    userEmail: user?.email,
    userId: user?.id,
    sessionsCount: sessions.length, 
    loading, 
    error 
  });

  const fetchStartupSessionsDirect = async () => {
    console.log('🔄 [useStartupSessions] Trying direct approach...');
    
    try {
      // Try direct query without RPC
      const { data: userCompanies, error: companiesError } = await supabase
        .from('user_company_relations')
        .select('company_id, companies(id, name)')
        .eq('user_id', user!.id)
        .eq('role', 'member');

      if (companiesError) {
        console.error('❌ [Direct] Error fetching user companies:', companiesError);
        return null;
      }

      console.log('🏢 [Direct] User companies:', userCompanies);

      if (!userCompanies || userCompanies.length === 0) {
        console.log('⚠️ [Direct] No companies found');
        return [];
      }

      const companyIds = userCompanies.map(uc => uc.company_id);
      console.log('🏢 [Direct] Company IDs:', companyIds);

      // Get sessions directly
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('mentoring_sessions')
        .select('*')
        .in('startup_company_id', companyIds)
        .order('session_date', { ascending: false });

      if (sessionsError) {
        console.error('❌ [Direct] Error fetching sessions:', sessionsError);
        return null;
      }

      console.log('📅 [Direct] Sessions found:', sessionsData?.length || 0);
      return sessionsData || [];

    } catch (err) {
      console.error('💥 [Direct] Unexpected error:', err);
      return null;
    }
  };

  const fetchStartupSessions = async () => {
    console.log('🔍 [useStartupSessions] Starting fetchStartupSessions');
    
    if (!user) {
      console.log('❌ [useStartupSessions] No user found');
      setLoading(false);
      return;
    }
    
    console.log('👤 [useStartupSessions] User:', user.id, user.email);
    
    try {
      setLoading(true);
      setError(null);
      
      // Update debug info
      setDebugInfo(prev => ({
        ...prev,
        userId: user.id,
        userEmail: user.email,
        timestamp: new Date().toISOString(),
        step: 'starting'
      }));

      // Try RPC first, then fallback to direct
      console.log('🏢 [useStartupSessions] Getting user startup company...');
      let companyId: string | null = null;
      let companyName: string | null = null;
      
      const { data: userCompany, error: companyError } = await supabase.rpc('get_user_startup_company', {
        _user_id: user.id
      });

      console.log('🏢 [useStartupSessions] RPC result:', { userCompany, companyError });

      if (companyError) {
        console.warn('⚠️ [useStartupSessions] RPC failed, trying direct approach:', companyError);
        
        // Try direct approach
        const directSessions = await fetchStartupSessionsDirect();
        if (directSessions === null) {
          setError(`Erro ao buscar empresa: ${companyError.message}`);
          return;
        } else if (directSessions.length === 0) {
          console.log('⚠️ [useStartupSessions] No sessions found via direct approach');
          setSessions([]);
          setDebugInfo(prev => ({ ...prev, step: 'no_sessions_direct', sessions: 0 }));
          return;
        } else {
          // Process direct sessions (simplified without tips/mentors for now)
          const simpleSessions = directSessions.map(session => ({
            ...session,
            mentor_name: 'Mentor',
            tips: [],
            tips_count: 0
          }));
          setSessions(simpleSessions);
          setDebugInfo(prev => ({ 
            ...prev, 
            step: 'success_direct', 
            sessions: simpleSessions.length,
            method: 'direct'
          }));
          return;
        }
      }

      if (!userCompany || userCompany.length === 0) {
        console.log('⚠️ [useStartupSessions] No company found for user');
        setSessions([]);
        setDebugInfo(prev => ({ ...prev, step: 'no_company', sessions: 0 }));
        return;
      }

      companyId = userCompany[0].id;
      companyName = userCompany[0].name;
      console.log('🏢 [useStartupSessions] Company found:', companyId, companyName);

      setDebugInfo(prev => ({ 
        ...prev, 
        step: 'found_company',
        companyId,
        companyName 
      }));

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
        setDebugInfo(prev => ({ ...prev, step: 'error_sessions', error: sessionsError }));
        return;
      }

      if (!sessionsData || sessionsData.length === 0) {
        console.log('⚠️ [useStartupSessions] No sessions found');
        setSessions([]);
        setDebugInfo(prev => ({ ...prev, step: 'no_sessions_found', sessions: 0 }));
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

      // Create mentor map (don't fail if mentors not found)
      const mentorMap = new Map(mentorProfiles?.map(p => [
        p.user_id, 
        `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Mentor'
      ]) || []);

      console.log('👨‍🏫 [useStartupSessions] Mentor map:', Array.from(mentorMap.entries()));

      // Get tips for each session
      const sessionIds = sessionsData?.map(s => s.id) || [];
      let tipsData: MentoringTip[] = [];
      
      if (sessionIds.length > 0) {
        console.log('📝 [useStartupSessions] Fetching tips for sessions:', sessionIds);
        const { data: tips, error: tipsError } = await supabase
          .from('mentoring_tips')
          .select('*')
          .in('session_id', sessionIds)
          .order('created_at', { ascending: false });

        if (tipsError) {
          console.error('👨‍🏫 [useStartupSessions] Error fetching tips:', tipsError);
        } else {
          tipsData = tips || [];
          console.log('📝 [useStartupSessions] Tips fetched:', tipsData.length);
        }
      }

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

      // Combine sessions with mentor profiles and tips
      const sessionsWithMentors = sessionsData.map(session => ({
        ...session,
        mentor_name: mentorMap.get(session.mentor_id) || 'Mentor Desconhecido',
        tips: tipsMap.get(session.id) || [],
        tips_count: tipsMap.get(session.id)?.length || 0
      }));

      console.log('✅ [useStartupSessions] Final sessions with mentors and tips:', 
        sessionsWithMentors.map(s => ({ 
          id: s.id, 
          mentor: s.mentor_name, 
          tipsCount: s.tips_count 
        }))
      );
      
      setSessions(sessionsWithMentors);
      setDebugInfo(prev => ({ 
        ...prev, 
        step: 'success_rpc',
        sessions: sessionsWithMentors.length,
        method: 'rpc',
        mentorIds,
        mentorProfiles: mentorProfiles?.length || 0
      }));
    } catch (err) {
      console.error('💥 [useStartupSessions] Unexpected error:', err);
      setError('Erro inesperado ao buscar sessões');
      setDebugInfo(prev => ({ ...prev, step: 'unexpected_error', error: err }));
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
    debugInfo,
    refetch: fetchStartupSessions
  };
};