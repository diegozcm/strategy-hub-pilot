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
  quarterly: {
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
  aggregation_type?: 'sum' | 'average' | 'max' | 'min' | 'last';
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
  }
): KRMetrics => {
  return useMemo(() => {
    if (!keyResult) {
      return {
        ytd: { target: 0, actual: 0, percentage: 0 },
        monthly: { target: 0, actual: 0, percentage: 0 },
        yearly: { target: 0, actual: 0, percentage: 0 },
        quarterly: { target: 0, actual: 0, percentage: 0 },
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
    
    const monthlyTargets = (keyResult.monthly_targets as Record<string, number>) || {};
    const monthlyActual = (keyResult.monthly_actual as Record<string, number>) || {};
    const aggregationType = keyResult.aggregation_type || 'sum';
    
    const targetValues = monthKeys.map(key => monthlyTargets[key] || 0);
    const actualValues = monthKeys.map(key => monthlyActual[key] || 0);
    
    let qTarget = 0;
    let qActual = 0;
    
    switch (aggregationType) {
      case 'sum':
        qTarget = targetValues.reduce((sum, v) => sum + v, 0);
        qActual = actualValues.reduce((sum, v) => sum + v, 0);
        break;
      case 'average':
        const validTargets = targetValues.filter(v => v > 0);
        const validActuals = actualValues.filter(v => v > 0);
        qTarget = validTargets.length > 0 ? validTargets.reduce((sum, v) => sum + v, 0) / validTargets.length : 0;
        qActual = validActuals.length > 0 ? validActuals.reduce((sum, v) => sum + v, 0) / validActuals.length : 0;
        break;
      case 'max':
        qTarget = targetValues.length > 0 ? Math.max(...targetValues) : 0;
        qActual = actualValues.length > 0 ? Math.max(...actualValues) : 0;
        break;
      case 'min':
        const nonZeroTargets = targetValues.filter(v => v > 0);
        const nonZeroActuals = actualValues.filter(v => v > 0);
        qTarget = nonZeroTargets.length > 0 ? Math.min(...nonZeroTargets) : 0;
        qActual = nonZeroActuals.length > 0 ? Math.min(...nonZeroActuals) : 0;
        break;
    }
    
    // Calculate percentage using database formula
    let qPercentage = 0;
    if (keyResult.target_direction === 'minimize') {
      qPercentage = qActual > 0 ? (qTarget / qActual) * 100 : (qTarget === 0 ? 100 : 0);
    } else {
      qPercentage = qTarget > 0 ? (qActual / qTarget) * 100 : 0;
    }

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
      quarterly: {
        target: qTarget,
        actual: qActual,
        percentage: qPercentage,
      },
    };
  }

  // If specific quarter is provided (without year), use pre-calculated values
  if (options?.selectedQuarter) {
    const quarter = options.selectedQuarter;
    let qTarget = 0;
    let qActual = 0;

    switch (quarter) {
      case 1:
        qTarget = keyResult.q1_target ?? 0;
        qActual = keyResult.q1_actual ?? 0;
        break;
      case 2:
        qTarget = keyResult.q2_target ?? 0;
        qActual = keyResult.q2_actual ?? 0;
        break;
      case 3:
        qTarget = keyResult.q3_target ?? 0;
        qActual = keyResult.q3_actual ?? 0;
        break;
      case 4:
        qTarget = keyResult.q4_target ?? 0;
        qActual = keyResult.q4_actual ?? 0;
        break;
    }

    // Calculate percentage using database formula
    let qPercentage = 0;
    if (keyResult.target_direction === 'minimize') {
      qPercentage = qActual > 0 ? (qTarget / qActual) * 100 : (qTarget === 0 ? 100 : 0);
    } else {
      qPercentage = qTarget > 0 ? (qActual / qTarget) * 100 : 0;
    }

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
      
      const monthlyTargets = (keyResult.monthly_targets as Record<string, number>) || {};
      const monthlyActual = (keyResult.monthly_actual as Record<string, number>) || {};
      const aggregationType = keyResult.aggregation_type || 'sum';
      
      // Collect values
      const targetValues = monthKeys.map(key => monthlyTargets[key] || 0);
      const actualValues = monthKeys.map(key => monthlyActual[key] || 0);
      
      // Calculate based on aggregation type
      let totalTarget = 0;
      let totalActual = 0;
      
      switch (aggregationType) {
        case 'sum':
          totalTarget = targetValues.reduce((sum, v) => sum + v, 0);
          totalActual = actualValues.reduce((sum, v) => sum + v, 0);
          break;
        case 'average':
          const validTargets = targetValues.filter(v => v > 0);
          const validActuals = actualValues.filter(v => v > 0);
          totalTarget = validTargets.length > 0 ? validTargets.reduce((sum, v) => sum + v, 0) / validTargets.length : 0;
          totalActual = validActuals.length > 0 ? validActuals.reduce((sum, v) => sum + v, 0) / validActuals.length : 0;
          break;
        case 'max':
          totalTarget = targetValues.length > 0 ? Math.max(...targetValues) : 0;
          totalActual = actualValues.length > 0 ? Math.max(...actualValues) : 0;
          break;
        case 'min':
          const nonZeroTargets = targetValues.filter(v => v > 0);
          const nonZeroActuals = actualValues.filter(v => v > 0);
          totalTarget = nonZeroTargets.length > 0 ? Math.min(...nonZeroTargets) : 0;
          totalActual = nonZeroActuals.length > 0 ? Math.min(...nonZeroActuals) : 0;
          break;
      }
      
      // Calculate percentage using database formula
      let yearlyPercentage = 0;
      if (keyResult.target_direction === 'minimize') {
        yearlyPercentage = totalActual > 0 ? (totalTarget / totalActual) * 100 : (totalTarget === 0 ? 100 : 0);
      } else {
        yearlyPercentage = totalTarget > 0 ? (totalActual / totalTarget) * 100 : 0;
      }
      
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
          target: totalTarget,
          actual: totalActual,
          percentage: yearlyPercentage,
        },
        quarterly: {
          target: 0,
          actual: 0,
          percentage: 0,
        },
      };
    }

    // If specific month is provided, calculate metrics for that month
    if (options?.selectedMonth && options?.selectedYear) {
      const monthKey = `${options.selectedYear}-${options.selectedMonth.toString().padStart(2, '0')}`;
      const monthlyTargets = (keyResult.monthly_targets as Record<string, number>) || {};
      const monthlyActual = (keyResult.monthly_actual as Record<string, number>) || {};
      
      const monthTarget = monthlyTargets[monthKey] || 0;
      const monthActual = monthlyActual[monthKey] || 0;
      
      // Calculate percentage using database formula
      let monthPercentage = 0;
      if (keyResult.target_direction === 'minimize') {
        monthPercentage = monthActual > 0 ? (monthTarget / monthActual) * 100 : (monthTarget === 0 ? 100 : 0);
      } else {
        monthPercentage = monthTarget > 0 ? (monthActual / monthTarget) * 100 : 0;
      }
      
      return {
        ytd: {
          target: keyResult.ytd_target ?? 0,
          actual: keyResult.ytd_actual ?? 0,
          percentage: keyResult.ytd_percentage ?? 0,
        },
        monthly: {
          target: monthTarget,
          actual: monthActual,
          percentage: monthPercentage,
        },
        yearly: {
          target: keyResult.yearly_target ?? 0,
          actual: keyResult.yearly_actual ?? 0,
          percentage: keyResult.yearly_percentage ?? 0,
        },
        quarterly: {
          target: 0,
          actual: 0,
          percentage: 0,
        },
      };
    }

    // Default behavior - use pre-calculated fields from database
    const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3) as 1 | 2 | 3 | 4;
    
    let defaultQTarget = 0;
    let defaultQActual = 0;
    let defaultQPercentage = 0;

    switch (currentQuarter) {
      case 1:
        defaultQTarget = keyResult.q1_target ?? 0;
        defaultQActual = keyResult.q1_actual ?? 0;
        defaultQPercentage = keyResult.q1_percentage ?? 0;
        break;
      case 2:
        defaultQTarget = keyResult.q2_target ?? 0;
        defaultQActual = keyResult.q2_actual ?? 0;
        defaultQPercentage = keyResult.q2_percentage ?? 0;
        break;
      case 3:
        defaultQTarget = keyResult.q3_target ?? 0;
        defaultQActual = keyResult.q3_actual ?? 0;
        defaultQPercentage = keyResult.q3_percentage ?? 0;
        break;
      case 4:
        defaultQTarget = keyResult.q4_target ?? 0;
        defaultQActual = keyResult.q4_actual ?? 0;
        defaultQPercentage = keyResult.q4_percentage ?? 0;
        break;
    }

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
      quarterly: {
        target: defaultQTarget,
        actual: defaultQActual,
        percentage: defaultQPercentage,
      },
    };
  }, [keyResult, options?.selectedMonth, options?.selectedYear, options?.selectedQuarter, options?.selectedQuarterYear]);
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
