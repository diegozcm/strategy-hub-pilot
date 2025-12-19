/**
 * Helper functions for Key Result frequency management
 * Supports: monthly, quarterly, semesterly, yearly
 */

export type KRFrequency = 'monthly' | 'quarterly' | 'semesterly' | 'yearly';

export interface FrequencyPeriod {
  key: string;       // "2025-Q1", "2025-S1", "2025"
  label: string;     // "Q1 2025", "S1 2025", "2025"
  shortLabel: string; // "Q1", "S1", "Ano"
  monthKeys: string[]; // ["2025-01", "2025-02", "2025-03"]
}

/**
 * Check if frequency is period-based (not monthly)
 */
export const isFrequencyPeriodBased = (frequency?: string): boolean => {
  return frequency === 'quarterly' || frequency === 'semesterly' || frequency === 'yearly';
};

/**
 * Get frequency display label
 */
export const getFrequencyLabel = (frequency?: string): string => {
  switch (frequency) {
    case 'quarterly': return 'Trimestral';
    case 'semesterly': return 'Semestral';
    case 'yearly': return 'Anual';
    case 'monthly':
    default: return 'Mensal';
  }
};

/**
 * Get frequency badge color
 */
export const getFrequencyBadgeColor = (frequency?: string): string => {
  switch (frequency) {
    case 'quarterly': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300';
    case 'semesterly': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300';
    case 'yearly': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
    case 'monthly':
    default: return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
  }
};

/**
 * Get periods for a given frequency and year
 */
export const getPeriodsForFrequency = (frequency: KRFrequency, year: number): FrequencyPeriod[] => {
  switch (frequency) {
    case 'quarterly':
      return [
        {
          key: `${year}-Q1`,
          label: `Q1 ${year}`,
          shortLabel: 'Q1',
          monthKeys: [`${year}-01`, `${year}-02`, `${year}-03`]
        },
        {
          key: `${year}-Q2`,
          label: `Q2 ${year}`,
          shortLabel: 'Q2',
          monthKeys: [`${year}-04`, `${year}-05`, `${year}-06`]
        },
        {
          key: `${year}-Q3`,
          label: `Q3 ${year}`,
          shortLabel: 'Q3',
          monthKeys: [`${year}-07`, `${year}-08`, `${year}-09`]
        },
        {
          key: `${year}-Q4`,
          label: `Q4 ${year}`,
          shortLabel: 'Q4',
          monthKeys: [`${year}-10`, `${year}-11`, `${year}-12`]
        }
      ];
    
    case 'semesterly':
      return [
        {
          key: `${year}-S1`,
          label: `S1 ${year}`,
          shortLabel: 'S1',
          monthKeys: [`${year}-01`, `${year}-02`, `${year}-03`, `${year}-04`, `${year}-05`, `${year}-06`]
        },
        {
          key: `${year}-S2`,
          label: `S2 ${year}`,
          shortLabel: 'S2',
          monthKeys: [`${year}-07`, `${year}-08`, `${year}-09`, `${year}-10`, `${year}-11`, `${year}-12`]
        }
      ];
    
    case 'yearly':
      return [
        {
          key: `${year}`,
          label: `${year}`,
          shortLabel: 'Ano',
          monthKeys: Array.from({ length: 12 }, (_, i) => `${year}-${(i + 1).toString().padStart(2, '0')}`)
        }
      ];
    
    case 'monthly':
    default:
      const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      return monthNames.map((name, i) => ({
        key: `${year}-${(i + 1).toString().padStart(2, '0')}`,
        label: `${name} ${year}`,
        shortLabel: name,
        monthKeys: [`${year}-${(i + 1).toString().padStart(2, '0')}`]
      }));
  }
};

/**
 * Convert period-based targets to monthly_targets format
 * Stores the value in the first month of the period
 */
export const periodTargetsToMonthly = (
  periodTargets: Record<string, number>,
  frequency: KRFrequency,
  year: number
): Record<string, number> => {
  const monthlyTargets: Record<string, number> = {};
  const periods = getPeriodsForFrequency(frequency, year);
  
  periods.forEach(period => {
    const value = periodTargets[period.key];
    if (value !== undefined && value !== null && !isNaN(value)) {
      // Store in the first month of the period
      monthlyTargets[period.monthKeys[0]] = value;
    }
  });
  
  return monthlyTargets;
};

/**
 * Convert monthly_targets to period-based format
 * Reads from the first month of each period
 */
export const monthlyTargetsToPeriod = (
  monthlyTargets: Record<string, number>,
  frequency: KRFrequency,
  year: number
): Record<string, number> => {
  const periodTargets: Record<string, number> = {};
  const periods = getPeriodsForFrequency(frequency, year);
  
  periods.forEach(period => {
    // Read from the first month of the period
    const value = monthlyTargets[period.monthKeys[0]];
    if (value !== undefined && value !== null && !isNaN(value)) {
      periodTargets[period.key] = value;
    }
  });
  
  return periodTargets;
};

/**
 * Get the period key for a given month
 */
export const getMonthPeriodKey = (monthKey: string, frequency: KRFrequency): string => {
  const [year, monthStr] = monthKey.split('-');
  const month = parseInt(monthStr);
  
  switch (frequency) {
    case 'quarterly':
      const quarter = Math.ceil(month / 3);
      return `${year}-Q${quarter}`;
    case 'semesterly':
      const semester = month <= 6 ? 1 : 2;
      return `${year}-S${semester}`;
    case 'yearly':
      return year;
    default:
      return monthKey;
  }
};

/**
 * Calculate yearly target from period targets based on aggregation type
 */
export const calculateYearlyFromPeriods = (
  periodTargets: Record<string, number>,
  aggregationType: 'sum' | 'average' | 'max' | 'min' | 'last' = 'sum'
): number => {
  const values = Object.values(periodTargets).filter(v => typeof v === 'number' && !isNaN(v) && v > 0);
  
  if (values.length === 0) return 0;
  
  switch (aggregationType) {
    case 'sum':
      return values.reduce((sum, v) => sum + v, 0);
    case 'average':
      return values.reduce((sum, v) => sum + v, 0) / values.length;
    case 'max':
      return Math.max(...values);
    case 'min':
      return Math.min(...values);
    case 'last':
      return values[values.length - 1];
    default:
      return values.reduce((sum, v) => sum + v, 0);
  }
};

/**
 * Get period label for display
 */
export const getPeriodDisplayLabel = (periodKey: string): string => {
  // Handle quarterly: "2025-Q1" -> "Q1 2025"
  if (periodKey.includes('-Q')) {
    const [year, q] = periodKey.split('-Q');
    return `Q${q} ${year}`;
  }
  
  // Handle semesterly: "2025-S1" -> "S1 2025"
  if (periodKey.includes('-S')) {
    const [year, s] = periodKey.split('-S');
    return `S${s} ${year}`;
  }
  
  // Handle monthly: "2025-01" -> "Jan 2025"
  if (periodKey.match(/^\d{4}-\d{2}$/)) {
    const [year, monthStr] = periodKey.split('-');
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return `${monthNames[parseInt(monthStr) - 1]} ${year}`;
  }
  
  // Handle yearly: just return the year
  return periodKey;
};

/**
 * Check if period is within validity range
 */
export const isPeriodInValidity = (
  periodKey: string,
  startMonth?: string | null,
  endMonth?: string | null
): boolean => {
  if (!startMonth || !endMonth) return false;
  
  // For monthly, direct comparison
  if (periodKey.match(/^\d{4}-\d{2}$/)) {
    return periodKey >= startMonth && periodKey <= endMonth;
  }
  
  // For quarterly: "2025-Q1"
  if (periodKey.includes('-Q')) {
    const [year, q] = periodKey.split('-Q');
    const quarter = parseInt(q);
    const quarterStartMonth = `${year}-${((quarter - 1) * 3 + 1).toString().padStart(2, '0')}`;
    const quarterEndMonth = `${year}-${(quarter * 3).toString().padStart(2, '0')}`;
    // Period is valid if it overlaps with validity
    return quarterEndMonth >= startMonth && quarterStartMonth <= endMonth;
  }
  
  // For semesterly: "2025-S1"
  if (periodKey.includes('-S')) {
    const [year, s] = periodKey.split('-S');
    const semester = parseInt(s);
    const semesterStartMonth = semester === 1 ? `${year}-01` : `${year}-07`;
    const semesterEndMonth = semester === 1 ? `${year}-06` : `${year}-12`;
    return semesterEndMonth >= startMonth && semesterStartMonth <= endMonth;
  }
  
  // For yearly
  const yearStartMonth = `${periodKey}-01`;
  const yearEndMonth = `${periodKey}-12`;
  return yearEndMonth >= startMonth && yearStartMonth <= endMonth;
};
