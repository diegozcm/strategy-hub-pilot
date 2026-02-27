import { useMemo } from 'react';

export interface KRMetrics {
  ytd: {
    target: number | null;
    actual: number | null;
    percentage: number;
  };
  monthly: {
    target: number | null;
    actual: number | null;
    percentage: number;
  };
  yearly: {
    target: number | null;
    actual: number | null;
    percentage: number;
  };
  quarterly: {
    target: number | null;
    actual: number | null;
    percentage: number;
  };
  semesterly: {
    target: number | null;
    actual: number | null;
    percentage: number;
  };
  bimonthly: {
    target: number | null;
    actual: number | null;
    percentage: number;
  };
}

export interface KeyResultWithMetrics {
  id: string;
  title: string;
  frequency?: 'monthly' | 'bimonthly' | 'quarterly' | 'semesterly' | 'yearly';
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
  // Quarter metrics
  q1_target?: number;
  q1_actual?: number;
  q1_percentage?: number;
  q2_target?: number;
  q2_actual?: number;
  q2_percentage?: number;
  q3_target?: number;
  q3_actual?: number;
  q3_percentage?: number;
  q4_target?: number;
  q4_actual?: number;
  q4_percentage?: number;
  target_direction?: 'maximize' | 'minimize';
  unit?: string;
  aggregation_type?: 'sum' | 'average' | 'max' | 'min';
  comparison_type?: 'cumulative' | 'period';
  // Raw monthly data for custom month selection
  monthly_targets?: Record<string, number>;
  monthly_actual?: Record<string, number>;
  // Vigência do KR
  start_month?: string;
  end_month?: string;
}

/**
 * Hook to access pre-calculated metrics from the database
 * All calculations are done in the database via triggers
 * This hook simply extracts and formats the calculated values
 */
export const useKRMetrics = (
  keyResult: KeyResultWithMetrics | null | undefined,
  options?: {
    selectedMonth?: number;
    selectedYear?: number;
    selectedQuarter?: 1 | 2 | 3 | 4;
    selectedQuarterYear?: number;
    selectedSemester?: 1 | 2;
    selectedSemesterYear?: number;
    selectedBimonth?: 1 | 2 | 3 | 4 | 5 | 6;
    selectedBimonthYear?: number;
  }
): KRMetrics => {
  return useMemo(() => {
    const defaultMetrics: KRMetrics = {
      ytd: { target: null, actual: null, percentage: 0 },
      monthly: { target: null, actual: null, percentage: 0 },
      yearly: { target: null, actual: null, percentage: 0 },
      quarterly: { target: null, actual: null, percentage: 0 },
      semesterly: { target: null, actual: null, percentage: 0 },
      bimonthly: { target: null, actual: null, percentage: 0 },
    };

    if (!keyResult) {
      return defaultMetrics;
    }

    // Helper: check if monthly_actual has ANY real data at all
    const monthlyActualRaw = ((keyResult.monthly_actual ?? {}) as Record<string, number | null>);
    const hasAnyMonthlyActualData = Object.values(monthlyActualRaw).some(v => v !== null && v !== undefined);

    // Helper: safely return actual from pre-calculated DB fields (which store 0 instead of null)
    const safeActual = (dbValue: number | null | undefined): number | null => {
      if (dbValue === null || dbValue === undefined) return null;
      if (dbValue === 0 && !hasAnyMonthlyActualData) return null;
      return dbValue;
    };

    // Helper: granularity map for frequency-aware remapping
    const FREQ_GRANULARITY: Record<string, number> = {
      monthly: 1, bimonthly: 2, quarterly: 3, semesterly: 6, yearly: 12,
    };

    const getKRPeriodStartMonth = (frequency: string, month: number): number => {
      switch (frequency) {
        case 'bimonthly': return (Math.ceil(month / 2) - 1) * 2 + 1;
        case 'quarterly': return (Math.ceil(month / 3) - 1) * 3 + 1;
        case 'semesterly': return month <= 6 ? 1 : 7;
        case 'yearly': return 1;
        default: return month;
      }
    };

    /**
     * Remaps month keys when the KR's frequency is coarser than the filter period.
     * E.g., filter=bimonthly B2 (Mar-Apr), KR=semesterly → returns ["YYYY-01"]
     */
    const getEffectiveMonthKeysForKR = (monthKeys: string[], filterPeriodGranularity: number): string[] => {
      const krFreq = keyResult.frequency || 'monthly';
      const krGranularity = FREQ_GRANULARITY[krFreq] || 1;
      
      if (krGranularity <= filterPeriodGranularity) {
        return monthKeys;
      }
      
      const remappedSet = new Set<string>();
      for (const key of monthKeys) {
        const [yearStr, monthStr] = key.split('-');
        const month = parseInt(monthStr, 10);
        const startMonth = getKRPeriodStartMonth(krFreq, month);
        remappedSet.add(`${yearStr}-${startMonth.toString().padStart(2, '0')}`);
      }
      return Array.from(remappedSet);
    };

    // Helper function to calculate metrics for a set of months
    const calculateMetricsForMonths = (monthKeys: string[], filterPeriodGranularity: number = 1): { target: number | null; actual: number | null; percentage: number } => {
      // Apply frequency-aware remapping
      const effectiveKeys = getEffectiveMonthKeysForKR(monthKeys, filterPeriodGranularity);
      
      const monthlyTargets = ((keyResult.monthly_targets ?? {}) as Record<string, number | null>);
      const monthlyActual = ((keyResult.monthly_actual ?? {}) as Record<string, number | null>);
      const aggregationType = keyResult.aggregation_type || 'sum';
      
      // Verificar se há ALGUM valor de actual nos meses (não undefined, não null)
      const hasAnyActualData = effectiveKeys.some(key => {
        const value = monthlyActual[key];
        return value !== null && value !== undefined;
      });
      
      // Verificar se há ALGUM valor de target nos meses
      const hasAnyTargetData = effectiveKeys.some(key => {
        const value = monthlyTargets[key];
        return value !== null && value !== undefined;
      });
      
      // Mapear valores, usando null para chaves inexistentes
      const targetValues = effectiveKeys.map(key => {
        const val = monthlyTargets[key];
        return val !== null && val !== undefined ? val : 0;
      });
      const actualValues = effectiveKeys.map(key => {
        const val = monthlyActual[key];
        return val !== null && val !== undefined ? val : 0;
      });
      
      let totalTarget = 0;
      let totalActual = 0;
      
      switch (aggregationType) {
        case 'sum':
          totalTarget = targetValues.reduce((sum, v) => sum + v, 0);
          totalActual = actualValues.reduce((sum, v) => sum + v, 0);
          break;
        case 'average':
          const validTargets = targetValues.filter(v => v !== 0);
          const validActuals = actualValues.filter(v => v !== 0);
          totalTarget = validTargets.length > 0 ? validTargets.reduce((sum, v) => sum + v, 0) / validTargets.length : 0;
          totalActual = validActuals.length > 0 ? validActuals.reduce((sum, v) => sum + v, 0) / validActuals.length : 0;
          break;
        case 'max':
          totalTarget = targetValues.length > 0 ? Math.max(...targetValues) : 0;
          totalActual = actualValues.length > 0 ? Math.max(...actualValues) : 0;
          break;
        case 'min':
          const nonZeroTargets = targetValues.filter(v => v !== 0);
          const nonZeroActuals = actualValues.filter(v => v !== 0);
          totalTarget = nonZeroTargets.length > 0 ? Math.min(...nonZeroTargets) : 0;
          totalActual = nonZeroActuals.length > 0 ? Math.min(...nonZeroActuals) : 0;
          break;
      }
      
      // Calculate percentage
      let percentage = 0;
      if (hasAnyActualData && hasAnyTargetData) {
        if (keyResult.target_direction === 'minimize') {
          percentage = totalActual > 0 ? (totalTarget / totalActual) * 100 : 0;
        } else {
          percentage = totalTarget > 0 ? (totalActual / totalTarget) * 100 : 0;
        }
      }
      
      // Retornar null para actual se não há dados, null para target se não há dados
      return { 
        target: hasAnyTargetData ? totalTarget : null, 
        actual: hasAnyActualData ? totalActual : null, 
        percentage 
      };
    };

    // Calculate semester metrics if selected
    if (options?.selectedSemester && options?.selectedSemesterYear) {
      const semesterMonths: Record<number, number[]> = {
        1: [1, 2, 3, 4, 5, 6],
        2: [7, 8, 9, 10, 11, 12]
      };
      const months = semesterMonths[options.selectedSemester];
      const monthKeys = months.map(m => `${options.selectedSemesterYear}-${m.toString().padStart(2, '0')}`);
      const semesterMetrics = calculateMetricsForMonths(monthKeys, 6);

      return {
        ...defaultMetrics,
        ytd: {
          target: keyResult.ytd_target ?? null,
          actual: safeActual(keyResult.ytd_actual),
          percentage: keyResult.ytd_percentage ?? 0,
        },
        semesterly: semesterMetrics,
      };
    }

    // Calculate bimonthly metrics if selected
    if (options?.selectedBimonth && options?.selectedBimonthYear) {
      const bimonthMonths: Record<number, number[]> = {
        1: [1, 2], 2: [3, 4], 3: [5, 6],
        4: [7, 8], 5: [9, 10], 6: [11, 12]
      };
      const months = bimonthMonths[options.selectedBimonth];
      const monthKeys = months.map(m => `${options.selectedBimonthYear}-${m.toString().padStart(2, '0')}`);
      const bimonthMetrics = calculateMetricsForMonths(monthKeys, 2);

      return {
        ...defaultMetrics,
        ytd: {
          target: keyResult.ytd_target ?? null,
          actual: safeActual(keyResult.ytd_actual),
          percentage: keyResult.ytd_percentage ?? 0,
        },
        bimonthly: bimonthMetrics,
      };
    }

  // If specific quarter is provided, calculate dynamically using monthly data
  if (options?.selectedQuarter && options?.selectedQuarterYear) {
    const quarter = options.selectedQuarter;
    const year = options.selectedQuarterYear;
    
    const quarterMonths = {
      1: [1, 2, 3],
      2: [4, 5, 6],
      3: [7, 8, 9],
      4: [10, 11, 12]
    };
    const months = quarterMonths[quarter];
    const monthKeys = months.map(m => `${year}-${m.toString().padStart(2, '0')}`);
    
    // Usar a função helper que preserva null corretamente
    const quarterMetrics = calculateMetricsForMonths(monthKeys, 3);

    return {
      ...defaultMetrics,
      ytd: {
        target: keyResult.ytd_target ?? null,
        actual: safeActual(keyResult.ytd_actual),
        percentage: keyResult.ytd_percentage ?? 0,
      },
      monthly: {
        target: keyResult.current_month_target ?? null,
        actual: safeActual(keyResult.current_month_actual),
        percentage: keyResult.monthly_percentage ?? 0,
      },
      yearly: {
        target: keyResult.yearly_target ?? null,
        actual: safeActual(keyResult.yearly_actual),
        percentage: keyResult.yearly_percentage ?? 0,
      },
      quarterly: quarterMetrics,
    };
  }

  // If specific quarter is provided (without year), use pre-calculated values
  if (options?.selectedQuarter) {
    const quarter = options.selectedQuarter;
    let qTarget: number | null = null;
    let qActual: number | null = null;

    switch (quarter) {
      case 1:
        qTarget = keyResult.q1_target ?? null;
        qActual = safeActual(keyResult.q1_actual);
        break;
      case 2:
        qTarget = keyResult.q2_target ?? null;
        qActual = safeActual(keyResult.q2_actual);
        break;
      case 3:
        qTarget = keyResult.q3_target ?? null;
        qActual = safeActual(keyResult.q3_actual);
        break;
      case 4:
        qTarget = keyResult.q4_target ?? null;
        qActual = safeActual(keyResult.q4_actual);
        break;
    }

    // Calculate percentage using database formula - only if we have data
    let qPercentage = 0;
    if (qTarget !== null && qActual !== null) {
      if (keyResult.target_direction === 'minimize') {
        qPercentage = qActual > 0 ? (qTarget / qActual) * 100 : (qTarget === 0 ? 100 : 0);
      } else {
        qPercentage = qTarget > 0 ? (qActual / qTarget) * 100 : 0;
      }
    }

    return {
      ...defaultMetrics,
      ytd: {
        target: keyResult.ytd_target ?? null,
        actual: safeActual(keyResult.ytd_actual),
        percentage: keyResult.ytd_percentage ?? 0,
      },
      monthly: {
        target: keyResult.current_month_target ?? null,
        actual: safeActual(keyResult.current_month_actual),
        percentage: keyResult.monthly_percentage ?? 0,
      },
      yearly: {
        target: keyResult.yearly_target ?? null,
        actual: safeActual(keyResult.yearly_actual),
        percentage: keyResult.yearly_percentage ?? 0,
      },
      quarterly: {
        target: qTarget,
        actual: qActual,
        percentage: qPercentage,
      },
    };
  }

    // If specific year is provided (without month), calculate yearly dynamically
    if (options?.selectedYear && !options?.selectedMonth) {
      const monthKeys = [];
      for (let m = 1; m <= 12; m++) {
        monthKeys.push(`${options.selectedYear}-${m.toString().padStart(2, '0')}`);
      }
      
      // Usar a função helper que preserva null corretamente
      const yearlyMetrics = calculateMetricsForMonths(monthKeys, 12);
      
      return {
        ...defaultMetrics,
        ytd: {
          target: keyResult.ytd_target ?? null,
          actual: safeActual(keyResult.ytd_actual),
          percentage: keyResult.ytd_percentage ?? 0,
        },
        monthly: {
          target: keyResult.current_month_target ?? null,
          actual: safeActual(keyResult.current_month_actual),
          percentage: keyResult.monthly_percentage ?? 0,
        },
        yearly: yearlyMetrics,
      };
    }

    // If specific month is provided, calculate metrics for that month
    if (options?.selectedMonth && options?.selectedYear) {
      // Use frequency-aware remapping for monthly filter
      const monthKey = `${options.selectedYear}-${options.selectedMonth.toString().padStart(2, '0')}`;
      const effectiveKey = getEffectiveMonthKeysForKR([monthKey], 1)[0];
      
      const monthlyTargets = ((keyResult.monthly_targets ?? {}) as Record<string, number | null>);
      const monthlyActual = ((keyResult.monthly_actual ?? {}) as Record<string, number | null>);
      
      // Preservar null se a chave não existe ou é null/undefined
      const rawTarget = monthlyTargets[effectiveKey];
      const rawActual = monthlyActual[effectiveKey];
      
      const hasTargetData = rawTarget !== null && rawTarget !== undefined;
      const hasActualData = rawActual !== null && rawActual !== undefined;
      
      const monthTarget = hasTargetData ? rawTarget : null;
      const monthActual = hasActualData ? rawActual : null;
      
      // Calculate percentage using database formula - only if we have data
      let monthPercentage = 0;
      if (hasTargetData && hasActualData && monthTarget !== null && monthActual !== null) {
        if (keyResult.target_direction === 'minimize') {
          monthPercentage = monthActual > 0 ? (monthTarget / monthActual) * 100 : (monthTarget === 0 ? 100 : 0);
        } else {
          monthPercentage = monthTarget > 0 ? (monthActual / monthTarget) * 100 : 0;
        }
      }
      
      return {
        ...defaultMetrics,
        ytd: {
          target: keyResult.ytd_target ?? null,
          actual: safeActual(keyResult.ytd_actual),
          percentage: keyResult.ytd_percentage ?? 0,
        },
        monthly: {
          target: keyResult.current_month_target ?? null,
          actual: safeActual(keyResult.current_month_actual),
          percentage: keyResult.monthly_percentage ?? 0,
        },
        yearly: {
          target: keyResult.yearly_target ?? null,
          actual: safeActual(keyResult.yearly_actual),
          percentage: keyResult.yearly_percentage ?? 0,
        },
      };
    }

    // Default behavior - use pre-calculated fields from database
    const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3) as 1 | 2 | 3 | 4;
    
    let defaultQTarget: number | null = null;
    let defaultQActual: number | null = null;
    let defaultQPercentage = 0;

    switch (currentQuarter) {
      case 1:
        defaultQTarget = keyResult.q1_target ?? null;
        defaultQActual = safeActual(keyResult.q1_actual);
        defaultQPercentage = keyResult.q1_percentage ?? 0;
        break;
      case 2:
        defaultQTarget = keyResult.q2_target ?? null;
        defaultQActual = safeActual(keyResult.q2_actual);
        defaultQPercentage = keyResult.q2_percentage ?? 0;
        break;
      case 3:
        defaultQTarget = keyResult.q3_target ?? null;
        defaultQActual = safeActual(keyResult.q3_actual);
        defaultQPercentage = keyResult.q3_percentage ?? 0;
        break;
      case 4:
        defaultQTarget = keyResult.q4_target ?? null;
        defaultQActual = safeActual(keyResult.q4_actual);
        defaultQPercentage = keyResult.q4_percentage ?? 0;
        break;
    }

    return {
      ...defaultMetrics,
      ytd: {
        target: keyResult.ytd_target ?? null,
        actual: safeActual(keyResult.ytd_actual),
        percentage: keyResult.ytd_percentage ?? 0,
      },
      monthly: {
        target: keyResult.current_month_target ?? null,
        actual: safeActual(keyResult.current_month_actual),
        percentage: keyResult.monthly_percentage ?? 0,
      },
      yearly: {
        target: keyResult.yearly_target ?? null,
        actual: safeActual(keyResult.yearly_actual),
        percentage: keyResult.yearly_percentage ?? 0,
      },
      quarterly: {
        target: defaultQTarget,
        actual: defaultQActual,
        percentage: defaultQPercentage,
      },
    };
  }, [keyResult, options?.selectedMonth, options?.selectedYear, options?.selectedQuarter, options?.selectedQuarterYear, options?.selectedSemester, options?.selectedSemesterYear, options?.selectedBimonth, options?.selectedBimonthYear]);
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
export const formatMetricValue = (value: number | null | undefined, unit?: string): string => {
  // Retornar "—" para valores nulos/undefined
  if (value === null || value === undefined) return '—';
  
  if (!unit) return value.toFixed(1);
  
  switch (unit.toLowerCase()) {
    case 'percentage':
    case '%':
      return `${value.toFixed(1)}%`;
    case 'currency':
    case 'r$':
      return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}`;
    case 'number':
    default:
      return value.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  }
};
