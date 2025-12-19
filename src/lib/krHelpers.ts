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
    // Fórmula do banco: (target / actual) * 100
    // Se actual < target = bom (>100%), se actual > target = ruim (<100%)
    if (actual > 0) {
      percentage = (target / actual) * 100;
    } else if (target === 0) {
      percentage = 100; // Meta 0, realizado 0 = 100%
    } else {
      percentage = 0;
    }
  } else {
    // Para maximize: actual / target * 100
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
    // Maior peso primeiro (decrescente)
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
    // Maior peso primeiro (decrescente)
    return weightB - weightA;
  });
};

/**
 * Calculates the percentage for a single KR based on period type
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
): number => {
  let percentage = 0;
  const monthlyTargets = (kr.monthly_targets as Record<string, number>) || {};
  const monthlyActual = (kr.monthly_actual as Record<string, number>) || {};
  
  switch (period) {
    case 'quarterly':
      const quarter = options?.selectedQuarter || 1;
      const quarterYear = options?.selectedQuarterYear || new Date().getFullYear();
      
      if (options?.selectedQuarter && options?.selectedQuarterYear) {
        const quarterMonths: Record<number, number[]> = {
          1: [1, 2, 3],
          2: [4, 5, 6],
          3: [7, 8, 9],
          4: [10, 11, 12]
        };
        const months = quarterMonths[quarter];
        const monthKeys = months.map(m => `${quarterYear}-${m.toString().padStart(2, '0')}`);
        
        let totalTarget = 0;
        let totalActual = 0;
        
        if (kr.aggregation_type === 'average') {
          const monthsWithActual = monthKeys.filter(key => (monthlyActual[key] || 0) !== 0);
          const targets = monthsWithActual.map(key => monthlyTargets[key] || 0);
          const actuals = monthsWithActual.map(key => monthlyActual[key] || 0);
          totalTarget = targets.length > 0 ? targets.reduce((sum, v) => sum + v, 0) / targets.length : 0;
          totalActual = actuals.length > 0 ? actuals.reduce((sum, v) => sum + v, 0) / actuals.length : 0;
        } else if (kr.aggregation_type === 'max') {
          totalTarget = Math.max(...monthKeys.map(key => monthlyTargets[key] || 0), 0);
          totalActual = Math.max(...monthKeys.map(key => monthlyActual[key] || 0), 0);
        } else if (kr.aggregation_type === 'min') {
          const targets = monthKeys.map(key => monthlyTargets[key] || 0).filter(v => v > 0);
          const actuals = monthKeys.map(key => monthlyActual[key] || 0).filter(v => v > 0);
          totalTarget = targets.length > 0 ? Math.min(...targets) : 0;
          totalActual = actuals.length > 0 ? Math.min(...actuals) : 0;
        } else {
          totalTarget = monthKeys.reduce((sum, key) => sum + (monthlyTargets[key] || 0), 0);
          totalActual = monthKeys.reduce((sum, key) => sum + (monthlyActual[key] || 0), 0);
        }
        
        if (kr.target_direction === 'minimize') {
          percentage = (totalActual > 0 && totalTarget > 0) ? (totalTarget / totalActual) * 100 : 0;
        } else {
          percentage = totalTarget > 0 ? (totalActual / totalTarget) * 100 : 0;
        }
      } else {
        switch (quarter) {
          case 1: percentage = kr.q1_percentage || 0; break;
          case 2: percentage = kr.q2_percentage || 0; break;
          case 3: percentage = kr.q3_percentage || 0; break;
          case 4: percentage = kr.q4_percentage || 0; break;
        }
      }
      break;
      
    case 'monthly':
      if (options?.selectedMonth && options?.selectedYear) {
        const monthKey = `${options.selectedYear}-${options.selectedMonth.toString().padStart(2, '0')}`;
        const monthTarget = monthlyTargets[monthKey] || 0;
        const monthActual = monthlyActual[monthKey] || 0;
        
        if (kr.target_direction === 'minimize') {
          percentage = (monthActual > 0 && monthTarget > 0) ? (monthTarget / monthActual) * 100 : 0;
        } else {
          percentage = monthTarget > 0 ? (monthActual / monthTarget) * 100 : 0;
        }
      } else {
        percentage = kr.monthly_percentage || 0;
      }
      break;
      
    case 'yearly':
      if (options?.selectedYear) {
        const monthKeys = [];
        for (let m = 1; m <= 12; m++) {
          monthKeys.push(`${options.selectedYear}-${m.toString().padStart(2, '0')}`);
        }
        
        let totalTarget = 0;
        let totalActual = 0;
        
        if (kr.aggregation_type === 'average') {
          const monthsWithActual = monthKeys.filter(key => (monthlyActual[key] || 0) !== 0);
          const targets = monthsWithActual.map(key => monthlyTargets[key] || 0);
          const actuals = monthsWithActual.map(key => monthlyActual[key] || 0);
          totalTarget = targets.length > 0 ? targets.reduce((sum, v) => sum + v, 0) / targets.length : 0;
          totalActual = actuals.length > 0 ? actuals.reduce((sum, v) => sum + v, 0) / actuals.length : 0;
        } else if (kr.aggregation_type === 'max') {
          totalTarget = Math.max(...monthKeys.map(key => monthlyTargets[key] || 0), 0);
          totalActual = Math.max(...monthKeys.map(key => monthlyActual[key] || 0), 0);
        } else if (kr.aggregation_type === 'min') {
          const targets = monthKeys.map(key => monthlyTargets[key] || 0).filter(v => v > 0);
          const actuals = monthKeys.map(key => monthlyActual[key] || 0).filter(v => v > 0);
          totalTarget = targets.length > 0 ? Math.min(...targets) : 0;
          totalActual = actuals.length > 0 ? Math.min(...actuals) : 0;
        } else {
          totalTarget = monthKeys.reduce((sum, key) => sum + (monthlyTargets[key] || 0), 0);
          totalActual = monthKeys.reduce((sum, key) => sum + (monthlyActual[key] || 0), 0);
        }
        
        if (kr.target_direction === 'minimize') {
          percentage = (totalActual > 0 && totalTarget > 0) ? (totalTarget / totalActual) * 100 : 0;
        } else {
          percentage = totalTarget > 0 ? (totalActual / totalTarget) * 100 : 0;
        }
      } else {
        percentage = kr.yearly_percentage || 0;
      }
      break;
    
    case 'semesterly':
      if (options?.selectedSemester && options?.selectedSemesterYear) {
        const semesterMonths: Record<number, number[]> = {
          1: [1, 2, 3, 4, 5, 6],
          2: [7, 8, 9, 10, 11, 12]
        };
        const semester = options.selectedSemester;
        const year = options.selectedSemesterYear;
        const months = semesterMonths[semester];
        const monthKeys = months.map(m => `${year}-${m.toString().padStart(2, '0')}`);
        
        let totalTarget = 0;
        let totalActual = 0;
        
        if (kr.aggregation_type === 'average') {
          const monthsWithActual = monthKeys.filter(key => (monthlyActual[key] || 0) !== 0);
          const targets = monthsWithActual.map(key => monthlyTargets[key] || 0);
          const actuals = monthsWithActual.map(key => monthlyActual[key] || 0);
          totalTarget = targets.length > 0 ? targets.reduce((sum, v) => sum + v, 0) / targets.length : 0;
          totalActual = actuals.length > 0 ? actuals.reduce((sum, v) => sum + v, 0) / actuals.length : 0;
        } else if (kr.aggregation_type === 'max') {
          totalTarget = Math.max(...monthKeys.map(key => monthlyTargets[key] || 0), 0);
          totalActual = Math.max(...monthKeys.map(key => monthlyActual[key] || 0), 0);
        } else if (kr.aggregation_type === 'min') {
          const targets = monthKeys.map(key => monthlyTargets[key] || 0).filter(v => v > 0);
          const actuals = monthKeys.map(key => monthlyActual[key] || 0).filter(v => v > 0);
          totalTarget = targets.length > 0 ? Math.min(...targets) : 0;
          totalActual = actuals.length > 0 ? Math.min(...actuals) : 0;
        } else {
          totalTarget = monthKeys.reduce((sum, key) => sum + (monthlyTargets[key] || 0), 0);
          totalActual = monthKeys.reduce((sum, key) => sum + (monthlyActual[key] || 0), 0);
        }
        
        if (kr.target_direction === 'minimize') {
          percentage = (totalActual > 0 && totalTarget > 0) ? (totalTarget / totalActual) * 100 : 0;
        } else {
          percentage = totalTarget > 0 ? (totalActual / totalTarget) * 100 : 0;
        }
      }
      break;
    
    case 'bimonthly':
      if (options?.selectedBimonth && options?.selectedBimonthYear) {
        const bimonthMonths: Record<number, number[]> = {
          1: [1, 2], 2: [3, 4], 3: [5, 6],
          4: [7, 8], 5: [9, 10], 6: [11, 12]
        };
        const bimonth = options.selectedBimonth;
        const year = options.selectedBimonthYear;
        const months = bimonthMonths[bimonth];
        const monthKeys = months.map(m => `${year}-${m.toString().padStart(2, '0')}`);
        
        let totalTarget = 0;
        let totalActual = 0;
        
        if (kr.aggregation_type === 'average') {
          const monthsWithActual = monthKeys.filter(key => (monthlyActual[key] || 0) !== 0);
          const targets = monthsWithActual.map(key => monthlyTargets[key] || 0);
          const actuals = monthsWithActual.map(key => monthlyActual[key] || 0);
          totalTarget = targets.length > 0 ? targets.reduce((sum, v) => sum + v, 0) / targets.length : 0;
          totalActual = actuals.length > 0 ? actuals.reduce((sum, v) => sum + v, 0) / actuals.length : 0;
        } else if (kr.aggregation_type === 'max') {
          totalTarget = Math.max(...monthKeys.map(key => monthlyTargets[key] || 0), 0);
          totalActual = Math.max(...monthKeys.map(key => monthlyActual[key] || 0), 0);
        } else if (kr.aggregation_type === 'min') {
          const targets = monthKeys.map(key => monthlyTargets[key] || 0).filter(v => v > 0);
          const actuals = monthKeys.map(key => monthlyActual[key] || 0).filter(v => v > 0);
          totalTarget = targets.length > 0 ? Math.min(...targets) : 0;
          totalActual = actuals.length > 0 ? Math.min(...actuals) : 0;
        } else {
          totalTarget = monthKeys.reduce((sum, key) => sum + (monthlyTargets[key] || 0), 0);
          totalActual = monthKeys.reduce((sum, key) => sum + (monthlyActual[key] || 0), 0);
        }
        
        if (kr.target_direction === 'minimize') {
          percentage = (totalActual > 0 && totalTarget > 0) ? (totalTarget / totalActual) * 100 : 0;
        } else {
          percentage = totalTarget > 0 ? (totalActual / totalTarget) * 100 : 0;
        }
      }
      break;
      
    case 'ytd':
    default:
      percentage = kr.ytd_percentage || 0;
      break;
  }
  
  return percentage;
};

/**
 * Calculates weighted average progress for an objective based on its KRs
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
): number => {
  if (keyResults.length === 0) return 0;
  
  const totalWeight = keyResults.reduce((sum, kr) => sum + (kr.weight || 1), 0);
  
  const totalProgress = keyResults.reduce((sum, kr) => {
    const percentage = getKRPercentageForPeriod(kr, period, options);
    const weight = kr.weight || 1;
    return sum + (percentage * weight);
  }, 0);
  
  return totalWeight > 0 ? totalProgress / totalWeight : 0;
};

/**
 * Gets the performance color class based on progress percentage
 */
export const getProgressColorClass = (progress: number): string => {
  if (progress > 105) return 'bg-blue-100 text-blue-700 border-blue-200';
  if (progress >= 100) return 'bg-green-100 text-green-700 border-green-200';
  if (progress >= 71) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
  return 'bg-red-100 text-red-700 border-red-200';
};

/**
 * Gets the performance level name based on progress percentage
 */
export const getProgressLevel = (progress: number): 'excellent' | 'success' | 'warning' | 'critical' => {
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
