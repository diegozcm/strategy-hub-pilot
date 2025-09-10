import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface KeyResultHistoryEntry {
  id: string;
  key_result_id: string;
  changed_by: string;
  changed_at: string;
  change_reason?: string;
  previous_title?: string;
  previous_description?: string;
  previous_target_value?: number;
  previous_current_value?: number;
  previous_status?: string;
  previous_monthly_targets?: any;
  previous_monthly_actual?: any;
  previous_yearly_target?: number;
  previous_yearly_actual?: number;
  profiles?: {
    user_id: string;
    first_name: string | null;
    last_name: string | null;
  } | null;
}

export const useKeyResultHistory = () => {
  const [history, setHistory] = useState<KeyResultHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const loadHistory = useCallback(async (keyResultId: string) => {
    if (!keyResultId) return;

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('key_results_history')
        .select('*')
        .eq('key_result_id', keyResultId)
        .order('changed_at', { ascending: false });

      if (error) throw error;
      
      // Fetch user profiles for all changed_by IDs
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(entry => entry.changed_by))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, first_name, last_name')
          .in('user_id', userIds);

        // Map profiles to history entries
        const historyWithProfiles = data.map(entry => ({
          ...entry,
          profiles: profiles?.find(p => p.user_id === entry.changed_by) || null
        }));

        setHistory(historyWithProfiles);
      } else {
        setHistory(data || []);
      }
    } catch (error) {
      console.error('Error loading key result history:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar histórico do resultado-chave',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return {
    history,
    loading,
    loadHistory,
  };
};