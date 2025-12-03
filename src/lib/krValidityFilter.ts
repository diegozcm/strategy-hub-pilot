import { KeyResult } from '@/types/strategic-map';

interface QuarterOption {
  value: string;
  label: string;
  quarter: 1 | 2 | 3 | 4;
  year: number;
}

/**
 * Retorna quarters que têm pelo menos um KR com vigência nesse período
 */
export const getPopulatedQuarters = (
  keyResults: KeyResult[],
  allQuarterOptions: QuarterOption[]
): QuarterOption[] => {
  if (keyResults.length === 0 || allQuarterOptions.length === 0) return [];
  
  return allQuarterOptions.filter(quarter => {
    const quarterStart = `${quarter.year}-${String(((quarter.quarter - 1) * 3) + 1).padStart(2, '0')}`;
    const quarterEnd = `${quarter.year}-${String(quarter.quarter * 3).padStart(2, '0')}`;
    
    return keyResults.some(kr => {
      // Se KR não tem vigência, verificar se tem dados nos meses do quarter
      if (!kr.start_month || !kr.end_month) {
        const monthlyTargets = (kr.monthly_targets || {}) as Record<string, number>;
        const monthlyActual = (kr.monthly_actual || {}) as Record<string, number>;
        
        // Verificar se há dados em qualquer mês do quarter
        for (let m = ((quarter.quarter - 1) * 3) + 1; m <= quarter.quarter * 3; m++) {
          const monthKey = `${quarter.year}-${String(m).padStart(2, '0')}`;
          if (monthlyTargets[monthKey] || monthlyActual[monthKey]) {
            return true;
          }
        }
        return false;
      }
      
      // KR tem vigência: interseção entre KR e quarter
      return kr.start_month <= quarterEnd && kr.end_month >= quarterStart;
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
    // KR sem vigência: retornar quarters com dados
    const monthlyTargets = (keyResult.monthly_targets || {}) as Record<string, number>;
    const monthlyActual = (keyResult.monthly_actual || {}) as Record<string, number>;
    
    return allQuarterOptions.filter(quarter => {
      for (let m = ((quarter.quarter - 1) * 3) + 1; m <= quarter.quarter * 3; m++) {
        const monthKey = `${quarter.year}-${String(m).padStart(2, '0')}`;
        if (monthlyTargets[monthKey] || monthlyActual[monthKey]) {
          return true;
        }
      }
      return false;
    });
  }
  
  // KR com vigência: retornar quarters dentro do período
  return allQuarterOptions.filter(quarter => {
    const quarterStart = `${quarter.year}-${String(((quarter.quarter - 1) * 3) + 1).padStart(2, '0')}`;
    const quarterEnd = `${quarter.year}-${String(quarter.quarter * 3).padStart(2, '0')}`;
    
    return keyResult.start_month! <= quarterEnd && keyResult.end_month! >= quarterStart;
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
  
  // KRs sem vigência definida: verificar se têm dados no quarter
  if (!kr.start_month || !kr.end_month) {
    const monthlyTargets = (kr.monthly_targets || {}) as Record<string, number>;
    const monthlyActual = (kr.monthly_actual || {}) as Record<string, number>;
    
    for (let m = quarterStartMonth; m <= quarterEndMonth; m++) {
      const monthKey = `${year}-${String(m).padStart(2, '0')}`;
      if (monthlyTargets[monthKey] || monthlyActual[monthKey]) {
        return true;
      }
    }
    return false;
  }
  
  // KR com vigência: verificar interseção com o quarter
  const quarterStart = `${year}-${quarterStartMonth.toString().padStart(2, '0')}`;
  const quarterEnd = `${year}-${quarterEndMonth.toString().padStart(2, '0')}`;
  return kr.start_month <= quarterEnd && kr.end_month >= quarterStart;
};

/**
 * Verifica se um KR está dentro de um ano específico
 */
export const isKRInYear = (kr: KeyResult, year: number): boolean => {
  // KRs sem vigência definida: verificar se têm dados no ano
  if (!kr.start_month || !kr.end_month) {
    const monthlyTargets = (kr.monthly_targets || {}) as Record<string, number>;
    const monthlyActual = (kr.monthly_actual || {}) as Record<string, number>;
    
    for (let m = 1; m <= 12; m++) {
      const monthKey = `${year}-${String(m).padStart(2, '0')}`;
      if (monthlyTargets[monthKey] || monthlyActual[monthKey]) {
        return true;
      }
    }
    return false;
  }
  
  // KR com vigência: verificar interseção com o ano
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
  const monthKey = `${year}-${month.toString().padStart(2, '0')}`;
  
  // KRs sem vigência definida: verificar se têm dados no mês
  if (!kr.start_month || !kr.end_month) {
    const monthlyTargets = (kr.monthly_targets || {}) as Record<string, number>;
    const monthlyActual = (kr.monthly_actual || {}) as Record<string, number>;
    
    return !!(monthlyTargets[monthKey] || monthlyActual[monthKey]);
  }
  
  // KR com vigência: verificar se mês está dentro da vigência
  return kr.start_month <= monthKey && kr.end_month >= monthKey;
};

/**
 * Filtra KRs com base no período selecionado e vigência
 */
/**
 * Filtra KRs com base no período selecionado e vigência
 * @param planFirstYear - Primeiro ano do plano ativo (usado para YTD de planos futuros)
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
    planFirstYear?: number; // Primeiro ano do plano (para YTD inteligente)
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
        // YTD usa o ano do plano quando o ano atual não está no plano
        const ytdYear = options?.planFirstYear && options.planFirstYear > currentYear 
          ? options.planFirstYear 
          : currentYear;
        // Para YTD, KRs sem vigência são mostrados (comportamento especial)
        if (!kr.start_month || !kr.end_month) return true;
        return isKRInYear(kr, ytdYear);
      
      default:
        return true;
    }
  });
};
