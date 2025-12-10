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
        // YTD agora mostra todos os KRs do plano, sem filtro de ano
        // Métricas serão 0% naturalmente para KRs de anos futuros
        // Isso permite visualizar toda a estrutura estratégica
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
  
  // KRs sem vigência definida: verificar se têm dados no semestre
  if (!kr.start_month || !kr.end_month) {
    const monthlyTargets = (kr.monthly_targets || {}) as Record<string, number>;
    const monthlyActual = (kr.monthly_actual || {}) as Record<string, number>;
    
    for (let m = semesterStartMonth; m <= semesterEndMonth; m++) {
      const monthKey = `${year}-${String(m).padStart(2, '0')}`;
      if (monthlyTargets[monthKey] || monthlyActual[monthKey]) {
        return true;
      }
    }
    return false;
  }
  
  // KR com vigência: verificar interseção com o semestre
  const semesterStart = `${year}-${semesterStartMonth.toString().padStart(2, '0')}`;
  const semesterEnd = `${year}-${semesterEndMonth.toString().padStart(2, '0')}`;
  return kr.start_month <= semesterEnd && kr.end_month >= semesterStart;
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
  
  // KRs sem vigência definida: verificar se têm dados no bimestre
  if (!kr.start_month || !kr.end_month) {
    const monthlyTargets = (kr.monthly_targets || {}) as Record<string, number>;
    const monthlyActual = (kr.monthly_actual || {}) as Record<string, number>;
    
    for (let m = bimonthStartMonth; m <= bimonthEndMonth; m++) {
      const monthKey = `${year}-${String(m).padStart(2, '0')}`;
      if (monthlyTargets[monthKey] || monthlyActual[monthKey]) {
        return true;
      }
    }
    return false;
  }
  
  // KR com vigência: verificar interseção com o bimestre
  const bimonthStart = `${year}-${bimonthStartMonth.toString().padStart(2, '0')}`;
  const bimonthEnd = `${year}-${bimonthEndMonth.toString().padStart(2, '0')}`;
  return kr.start_month <= bimonthEnd && kr.end_month >= bimonthStart;
};
