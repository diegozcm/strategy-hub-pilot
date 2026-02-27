import { KeyResult } from '@/types/strategic-map';

interface QuarterOption {
  value: string;
  label: string;
  quarter: 1 | 2 | 3 | 4;
  year: number;
}

type KRFrequency = 'monthly' | 'bimonthly' | 'quarterly' | 'semesterly' | 'yearly';

/**
 * Retorna o número de meses por período para cada frequência
 */
const getFrequencyMonths = (frequency?: string): number => {
  switch (frequency) {
    case 'yearly': return 12;
    case 'semesterly': return 6;
    case 'quarterly': return 3;
    case 'bimonthly': return 2;
    case 'monthly':
    default: return 1;
  }
};

/**
 * Retorna o mês de início do período do KR que contém o mês dado.
 * Ex: frequency='semesterly', month=4 → 1 (S1 começa em Jan)
 *     frequency='quarterly', month=5 → 4 (Q2 começa em Abr)
 */
const getPeriodStartMonth = (frequency: string | undefined, month: number): number => {
  const size = getFrequencyMonths(frequency);
  if (size <= 1) return month;
  return Math.floor((month - 1) / size) * size + 1;
};

/**
 * Retorna o mês final do período do KR que contém o mês dado.
 * Ex: frequency='semesterly', month=3 → 6 (S1 vai até Jun)
 *     frequency='quarterly', month=5 → 6 (Q2 vai até Jun)
 */
const getPeriodEndMonth = (frequency: string | undefined, month: number): number => {
  const size = getFrequencyMonths(frequency);
  if (size <= 1) return month;
  return Math.ceil(month / size) * size;
};

/**
 * Expande start_month e end_month para os limites dos períodos da frequência do KR.
 * Ex: start='2026-01', end='2026-03', freq='semesterly'
 *   → start='2026-01', end='2026-06' (S1 vai até Jun)
 */
const getEffectiveValidityRange = (
  startMonth: string,
  endMonth: string,
  frequency?: string
): { start: string; end: string } => {
  const size = getFrequencyMonths(frequency);
  if (size <= 1) return { start: startMonth, end: endMonth };

  // Expand start_month to beginning of its period
  const [startYear, startM] = startMonth.split('-').map(Number);
  const effectiveStartM = getPeriodStartMonth(frequency, startM);
  const effectiveStart = `${startYear}-${effectiveStartM.toString().padStart(2, '0')}`;

  // Expand end_month to end of its period
  const [endYear, endM] = endMonth.split('-').map(Number);
  const effectiveEndM = getPeriodEndMonth(frequency, endM);
  const effectiveEnd = `${endYear}-${effectiveEndM.toString().padStart(2, '0')}`;

  return { start: effectiveStart, end: effectiveEnd };
};

/**
 * Verifica se um KR tem dados em algum dos meses do range, considerando frequência.
 * Para KRs com frequência grossa, remapeia os meses para as chaves efetivas.
 */
const hasDataInRange = (
  kr: KeyResult,
  startMonth: number,
  endMonth: number,
  year: number
): boolean => {
  const monthlyTargets = (kr.monthly_targets || {}) as Record<string, number>;
  const monthlyActual = (kr.monthly_actual || {}) as Record<string, number>;
  const freq = kr.frequency;

  // Collect effective month keys (remapped to KR period starts)
  const effectiveKeys = new Set<string>();
  for (let m = startMonth; m <= endMonth; m++) {
    const periodStart = getPeriodStartMonth(freq, m);
    effectiveKeys.add(`${year}-${periodStart.toString().padStart(2, '0')}`);
  }

  for (const key of effectiveKeys) {
    if (monthlyTargets[key] || monthlyActual[key]) {
      return true;
    }
  }
  return false;
};

/**
 * Retorna quarters que têm pelo menos um KR com vigência nesse período
 */
export const getPopulatedQuarters = (
  keyResults: KeyResult[],
  allQuarterOptions: QuarterOption[]
): QuarterOption[] => {
  if (keyResults.length === 0 || allQuarterOptions.length === 0) return [];
  
  return allQuarterOptions.filter(quarter => {
    const quarterStartMonth = ((quarter.quarter - 1) * 3) + 1;
    const quarterEndMonth = quarter.quarter * 3;
    const quarterStart = `${quarter.year}-${quarterStartMonth.toString().padStart(2, '0')}`;
    const quarterEnd = `${quarter.year}-${quarterEndMonth.toString().padStart(2, '0')}`;
    
    return keyResults.some(kr => {
      if (!kr.start_month || !kr.end_month) {
        return hasDataInRange(kr, quarterStartMonth, quarterEndMonth, quarter.year);
      }
      
      const { start: effStart, end: effEnd } = getEffectiveValidityRange(kr.start_month, kr.end_month, kr.frequency);
      return effStart <= quarterEnd && effEnd >= quarterStart;
    });
  });
};

/**
 * Retorna quarters dentro da vigência de um KR específico
 */
export const getKRQuarters = (
  keyResult: KeyResult,
  allQuarterOptions: QuarterOption[]
): QuarterOption[] => {
  if (allQuarterOptions.length === 0) return [];
  
  if (!keyResult.start_month || !keyResult.end_month) {
    return allQuarterOptions.filter(quarter => {
      const quarterStartMonth = ((quarter.quarter - 1) * 3) + 1;
      const quarterEndMonth = quarter.quarter * 3;
      return hasDataInRange(keyResult, quarterStartMonth, quarterEndMonth, quarter.year);
    });
  }
  
  const { start: effStart, end: effEnd } = getEffectiveValidityRange(keyResult.start_month, keyResult.end_month, keyResult.frequency);
  
  return allQuarterOptions.filter(quarter => {
    const quarterStart = `${quarter.year}-${String(((quarter.quarter - 1) * 3) + 1).padStart(2, '0')}`;
    const quarterEnd = `${quarter.year}-${String(quarter.quarter * 3).padStart(2, '0')}`;
    return effStart <= quarterEnd && effEnd >= quarterStart;
  });
};

/**
 * Verifica se um KR está dentro de um quarter específico
 */
export const isKRInQuarter = (
  kr: KeyResult, 
  quarter: 1 | 2 | 3 | 4, 
  year: number
): boolean => {
  const quarterStartMonth = ((quarter - 1) * 3) + 1;
  const quarterEndMonth = quarter * 3;
  
  if (!kr.start_month || !kr.end_month) {
    return hasDataInRange(kr, quarterStartMonth, quarterEndMonth, year);
  }
  
  const { start: effStart, end: effEnd } = getEffectiveValidityRange(kr.start_month, kr.end_month, kr.frequency);
  const quarterStart = `${year}-${quarterStartMonth.toString().padStart(2, '0')}`;
  const quarterEnd = `${year}-${quarterEndMonth.toString().padStart(2, '0')}`;
  return effStart <= quarterEnd && effEnd >= quarterStart;
};

/**
 * Verifica se um KR está dentro de um ano específico
 */
export const isKRInYear = (kr: KeyResult, year: number): boolean => {
  if (!kr.start_month || !kr.end_month) {
    return hasDataInRange(kr, 1, 12, year);
  }
  
  const { start: effStart, end: effEnd } = getEffectiveValidityRange(kr.start_month, kr.end_month, kr.frequency);
  const yearStart = `${year}-01`;
  const yearEnd = `${year}-12`;
  return effStart <= yearEnd && effEnd >= yearStart;
};

/**
 * Verifica se um KR está dentro de um mês específico
 */
export const isKRInMonth = (
  kr: KeyResult, 
  month: number, 
  year: number
): boolean => {
  const monthKey = `${year}-${month.toString().padStart(2, '0')}`;
  
  if (!kr.start_month || !kr.end_month) {
    return hasDataInRange(kr, month, month, year);
  }
  
  const { start: effStart, end: effEnd } = getEffectiveValidityRange(kr.start_month, kr.end_month, kr.frequency);
  return effStart <= monthKey && effEnd >= monthKey;
};

/**
 * Filtra KRs com base no período selecionado e vigência
 */
export const filterKRsByValidity = (
  keyResults: KeyResult[],
  validityEnabled: boolean,
  selectedPeriod: 'ytd' | 'monthly' | 'yearly' | 'quarterly' | 'semesterly' | 'bimonthly',
  options?: {
    selectedQuarter?: 1 | 2 | 3 | 4;
    selectedQuarterYear?: number;
    selectedYear?: number;
    selectedMonth?: number;
    selectedSemester?: 1 | 2;
    selectedSemesterYear?: number;
    selectedBimonth?: 1 | 2 | 3 | 4 | 5 | 6;
    selectedBimonthYear?: number;
    planFirstYear?: number;
  }
): KeyResult[] => {
  if (!validityEnabled) return keyResults;
  
  const currentYear = new Date().getFullYear();
  
  return keyResults.filter(kr => {
    switch (selectedPeriod) {
      case 'quarterly':
        return isKRInQuarter(
          kr, 
          options?.selectedQuarter || 1, 
          options?.selectedQuarterYear || currentYear
        );
      
      case 'yearly':
        return isKRInYear(kr, options?.selectedYear || currentYear);
      
      case 'monthly':
        return isKRInMonth(
          kr, 
          options?.selectedMonth || new Date().getMonth() + 1, 
          options?.selectedYear || currentYear
        );
      
      case 'semesterly':
        return isKRInSemester(
          kr,
          options?.selectedSemester || 1,
          options?.selectedSemesterYear || currentYear
        );
      
      case 'bimonthly':
        return isKRInBimonth(
          kr,
          options?.selectedBimonth || 1,
          options?.selectedBimonthYear || currentYear
        );
      
      case 'ytd':
        return true;
      
      default:
        return true;
    }
  });
};

/**
 * Verifica se um KR está dentro de um semestre específico
 */
export const isKRInSemester = (
  kr: KeyResult,
  semester: 1 | 2,
  year: number
): boolean => {
  const semesterStartMonth = semester === 1 ? 1 : 7;
  const semesterEndMonth = semester === 1 ? 6 : 12;
  
  if (!kr.start_month || !kr.end_month) {
    return hasDataInRange(kr, semesterStartMonth, semesterEndMonth, year);
  }
  
  const { start: effStart, end: effEnd } = getEffectiveValidityRange(kr.start_month, kr.end_month, kr.frequency);
  const semesterStart = `${year}-${semesterStartMonth.toString().padStart(2, '0')}`;
  const semesterEnd = `${year}-${semesterEndMonth.toString().padStart(2, '0')}`;
  return effStart <= semesterEnd && effEnd >= semesterStart;
};

/**
 * Verifica se um KR está dentro de um bimestre específico
 */
export const isKRInBimonth = (
  kr: KeyResult,
  bimonth: 1 | 2 | 3 | 4 | 5 | 6,
  year: number
): boolean => {
  const bimonthStartMonth = (bimonth - 1) * 2 + 1;
  const bimonthEndMonth = bimonth * 2;
  
  if (!kr.start_month || !kr.end_month) {
    return hasDataInRange(kr, bimonthStartMonth, bimonthEndMonth, year);
  }
  
  const { start: effStart, end: effEnd } = getEffectiveValidityRange(kr.start_month, kr.end_month, kr.frequency);
  const bimonthStart = `${year}-${bimonthStartMonth.toString().padStart(2, '0')}`;
  const bimonthEnd = `${year}-${bimonthEndMonth.toString().padStart(2, '0')}`;
  return effStart <= bimonthEnd && effEnd >= bimonthStart;
};
