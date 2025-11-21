import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { OKRPeriod, Quarter } from '@/types/okr';

/**
 * Hook para gerenciar Períodos (Trimestres) OKR
 */
export const useOKRPeriods = (yearId: string | null) => {
  const [periods, setPeriods] = useState<OKRPeriod[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  /**
   * Carregar todos os trimestres de um ano
   */
  const loadPeriods = useCallback(async () => {
    if (!yearId) {
      setPeriods([]);
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('okr_periods')
        .select('*')
        .eq('okr_year_id', yearId)
        .order('quarter', { ascending: true });

      if (error) throw error;

      setPeriods(data as OKRPeriod[]);
    } catch (error) {
      console.error('Error loading OKR periods:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar trimestres',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [yearId, toast]);

  /**
   * Obter período ativo
   */
  const getActivePeriod = useCallback((): OKRPeriod | null => {
    return periods.find((p) => p.status === 'active') || null;
  }, [periods]);

  /**
   * Obter período por trimestre
   */
  const getPeriodByQuarter = useCallback(
    (quarter: Quarter): OKRPeriod | null => {
      return periods.find((p) => p.quarter === quarter) || null;
    },
    [periods]
  );

  /**
   * Ativar um período específico (admin)
   */
  const activatePeriod = useCallback(
    async (periodId: string): Promise<boolean> => {
      try {
        setLoading(true);

        // Desativar todos os outros períodos do mesmo ano
        const period = periods.find((p) => p.id === periodId);
        if (!period) return false;

        await supabase
          .from('okr_periods')
          .update({ status: 'completed' })
          .eq('okr_year_id', period.okr_year_id)
          .eq('status', 'active');

        // Ativar o período selecionado
        const { error } = await supabase
          .from('okr_periods')
          .update({ status: 'active' })
          .eq('id', periodId);

        if (error) throw error;

        toast({
          title: 'Sucesso',
          description: 'Período ativado com sucesso',
        });

        await loadPeriods();
        return true;
      } catch (error) {
        console.error('Error activating period:', error);
        toast({
          title: 'Erro',
          description: 'Erro ao ativar período',
          variant: 'destructive',
        });
        return false;
      } finally {
        setLoading(false);
      }
    },
    [periods, toast, loadPeriods]
  );

  /**
   * Carregar períodos ao montar ou quando yearId mudar
   */
  useEffect(() => {
    loadPeriods();
  }, [loadPeriods]);

  return {
    periods,
    loading,
    loadPeriods,
    getActivePeriod,
    getPeriodByQuarter,
    activatePeriod,
  };
};
