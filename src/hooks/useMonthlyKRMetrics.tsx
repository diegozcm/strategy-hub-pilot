import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface MonthlyMetrics {
  target: number;
  actual: number;
  percentage: number;
}

/**
 * Hook to fetch KR metrics for a specific month
 * Uses the database function calculate_kr_metrics_for_month
 */
export const useMonthlyKRMetrics = (
  keyResultId: string | undefined,
  year: number,
  month: number
) => {
  return useQuery({
    queryKey: ['kr-monthly-metrics', keyResultId, year, month],
    queryFn: async (): Promise<MonthlyMetrics> => {
      if (!keyResultId) {
        return { target: 0, actual: 0, percentage: 0 };
      }

      const { data, error } = await supabase.rpc('calculate_kr_metrics_for_month', {
        p_kr_id: keyResultId,
        p_year: year,
        p_month: month,
      });

      if (error) {
        console.error('Error fetching monthly metrics:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        return { target: 0, actual: 0, percentage: 0 };
      }

      return {
        target: data[0].month_target || 0,
        actual: data[0].month_actual || 0,
        percentage: data[0].month_percentage || 0,
      };
    },
    enabled: !!keyResultId && year > 0 && month > 0 && month <= 12,
  });
};
