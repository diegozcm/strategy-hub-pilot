import { useMemo } from 'react';

export interface KRMetrics {
  ytd: {
    target: number;
    actual: number;
    percentage: number;
  };
  monthly: {
    target: number;
    actual: number;
    percentage: number;
  };
  yearly: {
    target: number;
    actual: number;
    percentage: number;
  };
}

export interface KeyResultWithMetrics {
  id: string;
  title: string;
  // Campos pré-calculados no banco (via trigger)
  ytd_target?: number;
  ytd_actual?: number;
  ytd_percentage?: number;
  current_month_target?: number;
  current_month_actual?: number;
  monthly_percentage?: number;
  yearly_target?: number;
  yearly_actual?: number;
  yearly_percentage?: number;
  target_direction?: 'maximize' | 'minimize';
  unit?: string;
}

/**
 * Hook to access pre-calculated metrics from the database
 * All calculations are done in the database via triggers
 * This hook simply extracts and formats the calculated values
 */
export const useKRMetrics = (keyResult: KeyResultWithMetrics | null | undefined): KRMetrics => {
  return useMemo(() => {
    if (!keyResult) {
      return {
        ytd: { target: 0, actual: 0, percentage: 0 },
        monthly: { target: 0, actual: 0, percentage: 0 },
        yearly: { target: 0, actual: 0, percentage: 0 },
      };
    }

    // Usar campos pré-calculados do banco (mesma lógica que outros componentes)
    return {
      ytd: {
        target: keyResult.ytd_target ?? 0,
        actual: keyResult.ytd_actual ?? 0,
        percentage: keyResult.ytd_percentage ?? 0,
      },
      monthly: {
        target: keyResult.current_month_target ?? 0,
        actual: keyResult.current_month_actual ?? 0,
        percentage: keyResult.monthly_percentage ?? 0,
      },
      yearly: {
        target: keyResult.yearly_target ?? 0,
        actual: keyResult.yearly_actual ?? 0,
        percentage: keyResult.yearly_percentage ?? 0,
      },
    };
  }, [keyResult]);
};

/**
 * Get achievement status based on percentage and target direction
 */
export const getAchievementStatus = (
  percentage: number,
  targetDirection: 'maximize' | 'minimize' = 'maximize'
): 'excellent' | 'success' | 'warning' | 'danger' => {
  if (percentage > 105) return 'excellent';
  if (percentage >= 100) return 'success';
  if (percentage >= 71) return 'warning';
  return 'danger';
};

/**
 * Format metric value with unit
 */
export const formatMetricValue = (value: number, unit?: string): string => {
  if (!unit) return value.toFixed(2);
  
  switch (unit.toLowerCase()) {
    case 'percentage':
    case '%':
      return `${value.toFixed(1)}%`;
    case 'currency':
    case 'r$':
      return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    case 'number':
    default:
      return value.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
  }
};
