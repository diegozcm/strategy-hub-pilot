import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useMultiTenant';

export interface ActivePlan {
  id: string;
  name: string;
  company_id: string;
  period_start: string;
  period_end: string;
  status: string;
  mission?: string;
  vision?: string;
  created_at: string;
  updated_at: string;
}

export const useActivePlan = () => {
  const { company } = useAuth();
  const [activePlan, setActivePlan] = useState<ActivePlan | null>(null);
  const [loading, setLoading] = useState(true);

  const loadActivePlan = useCallback(async () => {
    if (!company?.id) {
      setActivePlan(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('strategic_plans')
        .select('*')
        .eq('company_id', company.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error loading active plan:', error);
        setActivePlan(null);
      } else {
        setActivePlan(data);
      }
    } catch (error) {
      console.error('Error loading active plan:', error);
      setActivePlan(null);
    } finally {
      setLoading(false);
    }
  }, [company?.id]);

  useEffect(() => {
    loadActivePlan();
  }, [loadActivePlan]);

  return {
    activePlan,
    loading,
    hasActivePlan: !!activePlan,
    refreshActivePlan: loadActivePlan,
  };
};
