import { KeyResult } from '@/types/strategic-map';

/**
 * Verifica se um KR está dentro de um quarter específico
 */
export const isKRInQuarter = (
  kr: KeyResult, 
  quarter: 1 | 2 | 3 | 4, 
  year: number
): boolean => {
  // KRs sem vigência definida NÃO são mostrados quando filtro de quarter está ativo
  if (!kr.start_month || !kr.end_month) return false;
  
  const quarterStartMonth = ((quarter - 1) * 3) + 1;
  const quarterEndMonth = quarter * 3;
  
  const quarterStart = `${year}-${quarterStartMonth.toString().padStart(2, '0')}`;
  const quarterEnd = `${year}-${quarterEndMonth.toString().padStart(2, '0')}`;
  
  // Interseção: KR.start <= quarterEnd AND KR.end >= quarterStart
  return kr.start_month <= quarterEnd && kr.end_month >= quarterStart;
};

/**
 * Verifica se um KR está dentro de um ano específico
 */
export const isKRInYear = (kr: KeyResult, year: number): boolean => {
  // KRs sem vigência definida NÃO são mostrados quando filtro de ano está ativo
  if (!kr.start_month || !kr.end_month) return false;
  
  const yearStart = `${year}-01`;
  const yearEnd = `${year}-12`;
  
  return kr.start_month <= yearEnd && kr.end_month >= yearStart;
};

/**
 * Verifica se um KR está dentro de um mês específico
 */
export const isKRInMonth = (
  kr: KeyResult, 
  month: number, 
  year: number
): boolean => {
  // KRs sem vigência definida NÃO são mostrados quando filtro de mês está ativo
  if (!kr.start_month || !kr.end_month) return false;
  
  const monthKey = `${year}-${month.toString().padStart(2, '0')}`;
  
  return kr.start_month <= monthKey && kr.end_month >= monthKey;
};

/**
 * Filtra KRs com base no período selecionado e vigência
 */
export const filterKRsByValidity = (
  keyResults: KeyResult[],
  validityEnabled: boolean,
  selectedPeriod: 'ytd' | 'monthly' | 'yearly' | 'quarterly',
  options?: {
    selectedQuarter?: 1 | 2 | 3 | 4;
    selectedQuarterYear?: number;
    selectedYear?: number;
    selectedMonth?: number;
  }
): KeyResult[] => {
  // Se vigência não está ativa, retornar todos os KRs
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
      
      case 'ytd':
        // Para YTD, KRs sem vigência são mostrados (comportamento especial)
        if (!kr.start_month || !kr.end_month) return true;
        return isKRInYear(kr, currentYear);
      
      default:
        return true;
    }
  });
};
