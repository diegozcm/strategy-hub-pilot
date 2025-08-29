import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useMultiTenant';

interface MentoringTip {
  id: string;
  mentor_id: string;
  startup_company_id?: string;
  title: string;
  content: string;
  category: string;
  priority: string;
  is_public: boolean;
  status: string;
  created_at: string;
  updated_at: string;
  mentor_profile?: {
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
  };
}

export const useStartupMentoring = () => {
  const { user } = useAuth();
  const [tips, setTips] = useState<MentoringTip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStartupTips = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // First get the user's startup companies
      const { data: userCompanies } = await supabase
        .from('user_company_relations')
        .select('company_id')
        .eq('user_id', user.id);

      if (!userCompanies?.length) {
        setTips([]);
        setLoading(false);
        return;
      }

      const companyIds = userCompanies.map(uc => uc.company_id);

      // Get tips for the user's companies or public tips
      const { data: tipsData, error: fetchError } = await supabase
        .from('mentoring_tips')
        .select('*')
        .or(`startup_company_id.in.(${companyIds.join(',')}),is_public.eq.true`)
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Error fetching startup tips:', fetchError);
        setError(fetchError.message);
        return;
      }

      // Get mentor profiles separately
      const mentorIds = tipsData?.map(tip => tip.mentor_id) || [];
      const { data: mentorProfiles } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, avatar_url')
        .in('user_id', mentorIds);

      // Combine tips with mentor profiles
      const tipsWithProfiles = tipsData?.map(tip => ({
        ...tip,
        mentor_profile: mentorProfiles?.find(p => p.user_id === tip.mentor_id)
      })) || [];

      setTips(tipsWithProfiles);
    } catch (err) {
      console.error('Unexpected error fetching startup tips:', err);
      setError('Erro inesperado ao buscar dicas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStartupTips();
  }, [user]);

  return {
    tips,
    loading,
    error,
    refetch: fetchStartupTips
  };
};