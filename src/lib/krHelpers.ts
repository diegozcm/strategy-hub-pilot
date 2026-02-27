/**
 * Helper functions for Key Result calculations and status determination
 */

export type TargetDirection = 'maximize' | 'minimize';

interface KRStatusResult {
  percentage: number;
  isGood: boolean;
  isExcellent: boolean;
  color: string;
}

/**
 * Calculates the status of a Key Result based on actual vs target values
 * and the target direction (maximize or minimize)
 */
export const calculateKRStatus = (
  actual: number,
  target: number,
  direction: TargetDirection = 'maximize'
): KRStatusResult => {
  let percentage: number;
  
  if (direction === 'minimize') {
    if (actual > 0) {
      percentage = (target / actual) * 100;
    } else if (target === 0) {
      percentage = 100;
    } else {
      percentage = 0;
    }
  } else {
    percentage = target > 0 ? (actual / target) * 100 : 0;
  }
  
  const isExcellent = percentage > 105;
  const isSuccess = percentage >= 100;
  const isGood = percentage >= 71;
  
  const color = isExcellent ? 'text-blue-600' : 
                isSuccess ? 'text-green-600' :
                isGood ? 'text-yellow-600' : 
                'text-red-600';
  
  return { percentage, isGood, isExcellent, color };
};

/**
 * Determines if the trend icon should point up or down based on performance
 */
export const getKRTrendIcon = (
  actual: number,
  target: number,
  direction: TargetDirection = 'maximize'
): 'up' | 'down' => {
  const status = calculateKRStatus(actual, target, direction);
  return status.isExcellent ? 'up' : 'down';
};

/**
 * Gets a human-readable label for the target direction
 */
export const getDirectionLabel = (direction: TargetDirection): string => {
  return direction === 'maximize' 
    ? '📈 Maior é melhor' 
    : '📉 Menor é melhor';
};

/**
 * Gets a description for the target direction
 */
export const getDirectionDescription = (direction: TargetDirection): string => {
  return direction === 'maximize'
    ? 'ex: vendas, satisfação, lucro'
    : 'ex: custos, reclamações, tempo de espera';
};

/**
 * Sorts Key Results by weight (highest weight first - priority 10 at top)
 * KRs without weight default to 1
 */
export const sortKRsByWeight = <T extends { weight?: number | null }>(krs: T[]): T[] => {
  return [...krs].sort((a, b) => {
    const weightA = a.weight || 1;
    const weightB = b.weight || 1;
    return weightB - weightA;
  });
};

/**
 * Sorts Objectives by weight (highest weight first - priority 10 at top)
 * Objectives without weight default to 1
 */
export const sortObjectivesByWeight = <T extends { weight?: number | null }>(objectives: T[]): T[] => {
  return [...objectives].sort((a, b) => {
    const weightA = a.weight || 1;
    const weightB = b.weight || 1;
    return weightB - weightA;
  });
};

/**
 * Helper to get month keys for a given period
 */
const getMonthKeysForPeriod = (
  period: 'ytd' | 'monthly' | 'yearly' | 'quarterly' | 'semesterly' | 'bimonthly',
  options?: {
    selectedMonth?: number;
    selectedYear?: number;
    selectedQuarter?: 1 | 2 | 3 | 4;
    selectedQuarterYear?: number;
    selectedBimonth?: 1 | 2 | 3 | 4 | 5 | 6;
    selectedBimonthYear?: number;
    selectedSemester?: 1 | 2;
    selectedSemesterYear?: number;
  }
): string[] => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-based

  switch (period) {
    case 'monthly': {
      const month = options?.selectedMonth || currentMonth;
      const year = options?.selectedYear || currentYear;
      return [`${year}-${month.toString().padStart(2, '0')}`];
    }
    case 'quarterly': {
      const quarter = options?.selectedQuarter || (Math.ceil(currentMonth / 3) as 1 | 2 | 3 | 4);
      const year = options?.selectedQuarterYear || currentYear;
      const quarterMonths: Record<number, number[]> = {
        1: [1, 2, 3], 2: [4, 5, 6], 3: [7, 8, 9], 4: [10, 11, 12]
      };
      return quarterMonths[quarter].map(
        m => `${year}-${m.toString().padStart(2, '0')}`
      );
    }
    case 'semesterly': {
      const semester = options?.selectedSemester || (currentMonth <= 6 ? 1 : 2);
      const year = options?.selectedSemesterYear || currentYear;
      const months = semester === 1 ? [1,2,3,4,5,6] : [7,8,9,10,11,12];
      return months.map(m => `${year}-${m.toString().padStart(2, '0')}`);
    }
    case 'bimonthly': {
      const bimonth = options?.selectedBimonth || (Math.ceil(currentMonth / 2) as 1 | 2 | 3 | 4 | 5 | 6);
      const year = options?.selectedBimonthYear || currentYear;
      const bimonthMonths: Record<number, number[]> = {
        1: [1,2], 2: [3,4], 3: [5,6], 4: [7,8], 5: [9,10], 6: [11,12]
      };
      return bimonthMonths[bimonth].map(
        m => `${year}-${m.toString().padStart(2, '0')}`
      );
    }
    case 'yearly': {
      const year = options?.selectedYear || currentYear;
      return Array.from({ length: 12 }, (_, i) =>
        `${year}-${(i + 1).toString().padStart(2, '0')}`
      );
    }
    case 'ytd':
    default: {
      const year = options?.selectedYear || currentYear;
      const month = options?.selectedMonth || currentMonth;
      return Array.from({ length: month }, (_, i) =>
        `${year}-${(i + 1).toString().padStart(2, '0')}`
      );
    }
  }
};

/**
 * Checks if a KR has NULL data (no values filled) for a given period.
 * NULL = no data at all → should be EXCLUDED from weighted averages.
 * ZERO = explicitly filled 0 → should PARTICIPATE in calculations.
 */
export const isKRNullForPeriod = (
  kr: {
    monthly_actual?: Record<string, number> | null;
    monthly_percentage?: number | null;
    ytd_percentage?: number | null;
    yearly_percentage?: number | null;
    q1_percentage?: number | null;
    q2_percentage?: number | null;
    q3_percentage?: number | null;
    q4_percentage?: number | null;
    monthly_targets?: Record<string, number> | null;
  },
  period: 'ytd' | 'monthly' | 'yearly' | 'quarterly' | 'semesterly' | 'bimonthly' = 'ytd',
  options?: {
    selectedMonth?: number;
    selectedYear?: number;
    selectedQuarter?: 1 | 2 | 3 | 4;
    selectedQuarterYear?: number;
    selectedBimonth?: 1 | 2 | 3 | 4 | 5 | 6;
    selectedBimonthYear?: number;
    selectedSemester?: 1 | 2;
    selectedSemesterYear?: number;
  }
): boolean => {
  const monthlyActual = (kr.monthly_actual ?? {}) as Record<string, number | null | undefined>;
  const monthlyTargets = (kr.monthly_targets ?? {}) as Record<string, number | null | undefined>;
  
  const monthKeys = getMonthKeysForPeriod(period, options);
  
  // Always check monthly_actual directly — never trust pre-calculated DB fields
  const allMonthsNull = monthKeys.every(key => {
    const actualValue = monthlyActual[key];
    return actualValue === undefined || actualValue === null;
  });
  return allMonthsNull;
};

/**
 * Calculates the percentage for a single KR based on period type.
 * Returns null when the KR has no data for the period (NULL ≠ ZERO).
 */
export const getKRPercentageForPeriod = (
  kr: {
    monthly_percentage?: number | null;
    ytd_percentage?: number | null;
    yearly_percentage?: number | null;
    q1_percentage?: number | null;
    q2_percentage?: number | null;
    q3_percentage?: number | null;
    q4_percentage?: number | null;
    monthly_targets?: Record<string, number> | null;
    monthly_actual?: Record<string, number> | null;
    target_direction?: string | null;
    aggregation_type?: string | null;
    weight?: number | null;
  },
  period: 'ytd' | 'monthly' | 'yearly' | 'quarterly' | 'semesterly' | 'bimonthly' = 'ytd',
  options?: {
    selectedMonth?: number;
    selectedYear?: number;
    selectedQuarter?: 1 | 2 | 3 | 4;
    selectedQuarterYear?: number;
    selectedBimonth?: 1 | 2 | 3 | 4 | 5 | 6;
    selectedBimonthYear?: number;
    selectedSemester?: 1 | 2;
    selectedSemesterYear?: number;
  }
): number | null => {
  // Check if KR is null for this period FIRST
  if (isKRNullForPeriod(kr, period, options)) {
    return null;
  }

  let percentage = 0;
  const monthlyTargets = ((kr.monthly_targets ?? {}) as Record<string, number>);
  const monthlyActual = ((kr.monthly_actual ?? {}) as Record<string, number>);
  
  const computeFromMonthKeys = (monthKeys: string[]): number => {
    let totalTarget = 0;
    let totalActual = 0;
    
    // Filter to only months that have actual data (not null/undefined)
    const monthsWithData = monthKeys.filter(key => {
      const val = (kr.monthly_actual as Record<string, number | null | undefined> ?? {})[key];
      return val !== undefined && val !== null;
    });
    
    if (kr.aggregation_type === 'average') {
      const monthsWithActual = monthsWithData.filter(key => (monthlyActual[key] || 0) !== 0);
      const targets = monthsWithActual.map(key => monthlyTargets[key] || 0);
      const actuals = monthsWithActual.map(key => monthlyActual[key] || 0);
      totalTarget = targets.length > 0 ? targets.reduce((sum, v) => sum + v, 0) / targets.length : 0;
      totalActual = actuals.length > 0 ? actuals.reduce((sum, v) => sum + v, 0) / actuals.length : 0;
    } else if (kr.aggregation_type === 'max') {
      totalTarget = Math.max(...monthKeys.map(key => monthlyTargets[key] || 0), 0);
      totalActual = Math.max(...monthsWithData.map(key => monthlyActual[key] || 0), 0);
    } else if (kr.aggregation_type === 'min') {
      const targets = monthKeys.map(key => monthlyTargets[key] || 0).filter(v => v > 0);
      const actuals = monthsWithData.map(key => monthlyActual[key] || 0).filter(v => v > 0);
      totalTarget = targets.length > 0 ? Math.min(...targets) : 0;
      totalActual = actuals.length > 0 ? Math.min(...actuals) : 0;
    } else {
      // sum - only sum months with data for actual
      totalTarget = monthKeys.reduce((sum, key) => sum + (monthlyTargets[key] || 0), 0);
      totalActual = monthsWithData.reduce((sum, key) => sum + (monthlyActual[key] || 0), 0);
    }
    
    if (kr.target_direction === 'minimize') {
      return (totalActual > 0 && totalTarget > 0) ? (totalTarget / totalActual) * 100 : 0;
    }
    return totalTarget > 0 ? (totalActual / totalTarget) * 100 : 0;
  };

  // Always compute from monthly_actual — never trust pre-calculated DB fields
  const monthKeys = getMonthKeysForPeriod(period, options);

  if (period === 'monthly') {
    // For single month, compute directly for minimize support
    const monthKey = monthKeys[0];
    const monthTarget = monthlyTargets[monthKey] || 0;
    const monthActual = monthlyActual[monthKey] || 0;
    
    if (kr.target_direction === 'minimize') {
      percentage = (monthActual > 0 && monthTarget > 0) ? (monthTarget / monthActual) * 100 : 0;
    } else {
      percentage = monthTarget > 0 ? (monthActual / monthTarget) * 100 : 0;
    }
  } else {
    percentage = computeFromMonthKeys(monthKeys);
  }
  
  
  return percentage;
};

/**
 * Calculates weighted average progress for an objective based on its KRs.
 * Returns null if ALL KRs are null (no data) for the period.
 * KRs with null data are excluded from the calculation.
 */
export const calculateObjectiveProgressWeighted = <T extends {
  weight?: number | null;
  monthly_percentage?: number | null;
  ytd_percentage?: number | null;
  yearly_percentage?: number | null;
  q1_percentage?: number | null;
  q2_percentage?: number | null;
  q3_percentage?: number | null;
  q4_percentage?: number | null;
  monthly_targets?: Record<string, number> | null;
  monthly_actual?: Record<string, number> | null;
  target_direction?: string | null;
  aggregation_type?: string | null;
}>(
  keyResults: T[],
  period: 'ytd' | 'monthly' | 'yearly' | 'quarterly' | 'semesterly' | 'bimonthly' = 'ytd',
  options?: {
    selectedMonth?: number;
    selectedYear?: number;
    selectedQuarter?: 1 | 2 | 3 | 4;
    selectedQuarterYear?: number;
    selectedBimonth?: 1 | 2 | 3 | 4 | 5 | 6;
    selectedBimonthYear?: number;
    selectedSemester?: 1 | 2;
    selectedSemesterYear?: number;
  }
): number | null => {
  if (keyResults.length === 0) return null;
  
  // Calculate percentages and filter out nulls
  const krWithPercentages = keyResults.map(kr => ({
    kr,
    percentage: getKRPercentageForPeriod(kr, period, options),
    weight: kr.weight || 1,
  }));
  
  const validKRs = krWithPercentages.filter(item => item.percentage !== null);
  
  if (validKRs.length === 0) return null;
  
  const totalWeight = validKRs.reduce((sum, item) => sum + item.weight, 0);
  const totalProgress = validKRs.reduce((sum, item) => {
    return sum + ((item.percentage as number) * item.weight);
  }, 0);
  
  return totalWeight > 0 ? totalProgress / totalWeight : 0;
};

/**
 * Gets the performance color class based on progress percentage
 */
export const getProgressColorClass = (progress: number | null): string => {
  if (progress === null) return 'bg-gray-100 text-gray-500 border-gray-200';
  if (progress > 105) return 'bg-blue-100 text-blue-700 border-blue-200';
  if (progress >= 100) return 'bg-green-100 text-green-700 border-green-200';
  if (progress >= 71) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
  return 'bg-red-100 text-red-700 border-red-200';
};

/**
 * Gets the performance level name based on progress percentage
 */
export const getProgressLevel = (progress: number | null): 'empty' | 'excellent' | 'success' | 'warning' | 'critical' => {
  if (progress === null) return 'empty';
  if (progress > 105) return 'excellent';
  if (progress >= 100) return 'success';
  if (progress >= 71) return 'warning';
  return 'critical';
};

/**
 * Background color styles for status-based card coloring
 */
export interface StatusBackgroundColors {
  bg: string;
  border: string;
  icon: string;
}

/**
 * Gets background, border, and icon colors based on KR performance
 */
export const getStatusBackgroundColors = (
  actual: number,
  target: number,
  direction: TargetDirection = 'maximize'
): StatusBackgroundColors => {
  const { percentage } = calculateKRStatus(actual, target, direction);
  
  if (percentage > 105) {
    return { 
      bg: 'bg-blue-50/80 dark:bg-blue-950/40', 
      border: 'border-l-4 border-l-blue-500', 
      icon: 'text-blue-600 dark:text-blue-400' 
    };
  }
  if (percentage >= 100) {
    return { 
      bg: 'bg-green-50/80 dark:bg-green-950/40', 
      border: 'border-l-4 border-l-green-500', 
      icon: 'text-green-600 dark:text-green-400' 
    };
  }
  if (percentage >= 71) {
    return { 
      bg: 'bg-yellow-50/80 dark:bg-yellow-950/40', 
      border: 'border-l-4 border-l-yellow-500', 
      icon: 'text-yellow-600 dark:text-yellow-400' 
    };
  }
  return { 
    bg: 'bg-red-50/80 dark:bg-red-950/40', 
    border: 'border-l-4 border-l-red-500', 
    icon: 'text-red-600 dark:text-red-400' 
  };
};

/**
 * Gets default (neutral) background colors when no data is available
 */
export const getDefaultBackgroundColors = (): StatusBackgroundColors => {
  return {
    bg: 'bg-muted/50',
    border: 'border-l-4 border-l-muted-foreground/30',
    icon: 'text-muted-foreground'
  };
};
