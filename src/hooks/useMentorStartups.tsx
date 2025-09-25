import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useMultiTenant';

interface StartupCompany {
  id: string;
  name: string;
  mission?: string;
  vision?: string;
  logo_url?: string;
  created_at: string;
}

interface MentorStartupRelation {
  id: string;
  startup_company_id: string;
  assigned_at: string;
  status: string;
  company: StartupCompany;
}

export const useMentorStartups = () => {
  const { user } = useAuth();
  const [startups, setStartups] = useState<MentorStartupRelation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMentorStartups = async () => {
    if (!user?.id) return;
    
    try {
      // Only show loading if we don't have startups data yet
      if (startups.length === 0) {
        setLoading(true);
      }
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('mentor_startup_relations')
        .select(`
          id,
          startup_company_id,
          assigned_at,
          status,
          company:companies!startup_company_id (
            id,
            name,
            mission,
            vision,
            logo_url,
            created_at
          )
        `)
        .eq('mentor_id', user.id)
        .eq('status', 'active')
        .order('assigned_at', { ascending: false });

      if (fetchError) {
        console.error('Error fetching mentor startups:', fetchError);
        setError(fetchError.message);
        return;
      }

      setStartups(data || []);
    } catch (err) {
      console.error('Unexpected error fetching mentor startups:', err);
      setError('Erro inesperado ao buscar startups');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMentorStartups();
  }, [user?.id]);

  return {
    startups,
    loading,
    error,
    refetch: fetchMentorStartups
  };
};