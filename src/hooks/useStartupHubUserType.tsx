import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useMultiTenant';

export type StartupHubUserType = 'startup' | 'mentor' | 'unknown';

export const useStartupHubUserType = () => {
  const { user } = useAuth();
  const [userType, setUserType] = useState<StartupHubUserType>('unknown');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserType = async () => {
      if (!user) {
        setUserType('unknown');
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('startup_hub_profiles')
          .select('type')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .maybeSingle();

        if (error || !data) {
          setUserType('unknown');
        } else {
          setUserType(data.type as StartupHubUserType);
        }
      } catch (err) {
        console.error('Error fetching user type:', err);
        setUserType('unknown');
      } finally {
        setLoading(false);
      }
    };

    fetchUserType();
  }, [user]);

  return { userType, loading };
};