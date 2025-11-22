import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { OKRQuarter } from '@/types/okr';

export const useOKRQuarters = (yearId: string | null) => {
  const [quarters, setQuarters] = useState<OKRQuarter[]>([]);
  const [currentQuarter, setCurrentQuarter] = useState<OKRQuarter | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchQuarters = useCallback(async () => {
    if (!yearId) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('okr_quarters')
        .select('*')
        .eq('okr_year_id', yearId)
        .order('quarter', { ascending: true });

      if (error) throw error;

      setQuarters(data || []);
      
      // Auto-select Q1 if no quarter is selected
      if (data && data.length > 0 && !currentQuarter) {
        setCurrentQuarter(data[0]);
      }
    } catch (error) {
      console.error('Error fetching OKR quarters:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar trimestres',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [yearId, currentQuarter, toast]);

  const updateQuarter = useCallback(async (quarterId: string, updates: Partial<OKRQuarter>) => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('okr_quarters')
        .update(updates)
        .eq('id', quarterId);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Trimestre atualizado com sucesso',
      });

      await fetchQuarters();
    } catch (error) {
      console.error('Error updating OKR quarter:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar trimestre',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast, fetchQuarters]);

  useEffect(() => {
    fetchQuarters();
  }, [fetchQuarters]);

  return {
    quarters,
    currentQuarter,
    setCurrentQuarter,
    loading,
    fetchQuarters,
    updateQuarter,
  };
};
