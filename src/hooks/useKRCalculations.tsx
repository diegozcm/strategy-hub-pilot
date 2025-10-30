import { useMemo } from 'react';
import { KeyResult } from '@/types/strategic-map';
import { calculateKRStatus } from '@/lib/krHelpers';

export type PeriodType = 'monthly' | 'ytd';

interface KRCalculationResult {
  target: number;
  actual: number;
  percentage: number;
  hasData: boolean;
  lastMonthWithData?: string; // ex: "2025-10"
}

export const useKRCalculations = (
  keyResult: KeyResult | null,
  periodType: PeriodType = 'monthly',
  selectedYear: number = new Date().getFullYear()
): KRCalculationResult => {
  return useMemo(() => {
    if (!keyResult) {
      return { target: 0, actual: 0, percentage: 0, hasData: false };
    }

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    
    const lastAvailableMonth = selectedYear < currentYear ? 12 : 
                               selectedYear === currentYear ? currentMonth : 0;
    
    let target = 0;
    let actual = 0;
    let hasData = false;
    let lastMonthWithData: string | undefined;

    if (periodType === 'monthly' && lastAvailableMonth > 0) {
      // LÓGICA MENSAL: pegar o último mês com dados
      for (let m = lastAvailableMonth; m >= 1; m--) {
        const key = `${selectedYear}-${String(m).padStart(2, '0')}`;
        const monthlyActual = keyResult.monthly_actual?.[key];
        const monthlyTarget = keyResult.monthly_targets?.[key];
        
        const hasTarget = typeof monthlyTarget === 'number' && Number.isFinite(monthlyTarget) && monthlyTarget !== 0;
        const hasActual = typeof monthlyActual === 'number' && Number.isFinite(monthlyActual);
        
        if (hasTarget && hasActual) {
          target = monthlyTarget;
          actual = monthlyActual;
          hasData = true;
          lastMonthWithData = key;
          break;
        }
      }
    } else if (periodType === 'ytd' && lastAvailableMonth > 0) {
      // LÓGICA YTD: acumular jan até mês atual
      for (let m = 1; m <= lastAvailableMonth; m++) {
        const key = `${selectedYear}-${String(m).padStart(2, '0')}`;
        const monthlyActual = keyResult.monthly_actual?.[key];
        const monthlyTarget = keyResult.monthly_targets?.[key];
        
        const hasTarget = typeof monthlyTarget === 'number' && Number.isFinite(monthlyTarget);
        const hasActual = typeof monthlyActual === 'number' && Number.isFinite(monthlyActual);
        
        if (hasTarget && hasActual) {
          target += monthlyTarget;
          actual += monthlyActual;
          hasData = true;
          lastMonthWithData = key;
        }
      }
    }

    const percentage = hasData && target !== 0
      ? calculateKRStatus(actual, target, keyResult.target_direction || 'maximize').percentage
      : 0;

    return { target, actual, percentage, hasData, lastMonthWithData };
  }, [keyResult, periodType, selectedYear]);
};
