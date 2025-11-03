import { useMemo } from 'react';
import { calculateKRStatus } from '@/lib/krHelpers';

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
  monthly_targets?: Record<string, number>;
  monthly_actual?: Record<string, number>;
  current_month_target?: number;
  current_month_actual?: number;
  monthly_percentage?: number;
  target_direction?: 'maximize' | 'minimize';
  unit?: string;
}

/**
 * Hook to calculate metrics from monthly data
 * Calculates YTD (Jan to current month) and Yearly (all 12 months) by summing monthly values
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

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1; // 1-12
    const monthlyTargets = keyResult.monthly_targets || {};
    const monthlyActual = keyResult.monthly_actual || {};
    const targetDirection = keyResult.target_direction || 'maximize';

    // Calculate YTD (January to current month)
    let ytdTarget = 0;
    let ytdActual = 0;
    for (let month = 1; month <= currentMonth; month++) {
      const monthKey = `${currentYear}-${month.toString().padStart(2, '0')}`;
      ytdTarget += monthlyTargets[monthKey] || 0;
      ytdActual += monthlyActual[monthKey] || 0;
    }
    const ytdStatus = ytdTarget > 0 ? calculateKRStatus(ytdActual, ytdTarget, targetDirection) : { percentage: 0 };

    // Calculate Yearly (all 12 months)
    let yearlyTarget = 0;
    let yearlyActual = 0;
    for (let month = 1; month <= 12; month++) {
      const monthKey = `${currentYear}-${month.toString().padStart(2, '0')}`;
      yearlyTarget += monthlyTargets[monthKey] || 0;
      yearlyActual += monthlyActual[monthKey] || 0;
    }
    const yearlyStatus = yearlyTarget > 0 ? calculateKRStatus(yearlyActual, yearlyTarget, targetDirection) : { percentage: 0 };

    // Current month
    const currentMonthKey = `${currentYear}-${currentMonth.toString().padStart(2, '0')}`;
    const monthlyTarget = monthlyTargets[currentMonthKey] || 0;
    const monthlyActualValue = monthlyActual[currentMonthKey] || 0;
    const monthlyStatus = monthlyTarget > 0 ? calculateKRStatus(monthlyActualValue, monthlyTarget, targetDirection) : { percentage: 0 };

    return {
      ytd: {
        target: ytdTarget,
        actual: ytdActual,
        percentage: ytdStatus.percentage,
      },
      monthly: {
        target: monthlyTarget,
        actual: monthlyActualValue,
        percentage: monthlyStatus.percentage,
      },
      yearly: {
        target: yearlyTarget,
        actual: yearlyActual,
        percentage: yearlyStatus.percentage,
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
