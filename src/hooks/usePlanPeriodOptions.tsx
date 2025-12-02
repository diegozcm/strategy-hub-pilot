import { useMemo, useCallback } from 'react';
import { parseISO } from 'date-fns';
import { useActivePlan } from './useActivePlan';

interface QuarterOption {
  value: string;        // "2025-Q1"
  label: string;        // "Q1 2025"
  quarter: 1 | 2 | 3 | 4;
  year: number;
}

interface MonthOption {
  value: string;        // "2025-01"
  label: string;        // "Janeiro 2025"
}

interface YearOption {
  value: number;
  label: string;        // "2025"
}

export const usePlanPeriodOptions = () => {
  const { activePlan } = useActivePlan();
  
  const quarterOptions = useMemo<QuarterOption[]>(() => {
    if (!activePlan) return [];
    
    const startDate = parseISO(activePlan.period_start);
    const endDate = parseISO(activePlan.period_end);
    const options: QuarterOption[] = [];
    
    let currentDate = new Date(startDate);
    currentDate.setDate(1); // Primeiro dia do mês
    
    while (currentDate <= endDate) {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const quarter = Math.ceil(month / 3) as 1 | 2 | 3 | 4;
      
      // Verificar se já existe esse quarter
      const exists = options.some(
        opt => opt.year === year && opt.quarter === quarter
      );
      
      if (!exists) {
        options.push({
          value: `${year}-Q${quarter}`,
          label: `Q${quarter} ${year}`,
          quarter,
          year
        });
      }
      
      // Avançar 1 mês
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    
    return options.reverse(); // Ordem decrescente - mais recente primeiro
  }, [activePlan]);

  const monthOptions = useMemo<MonthOption[]>(() => {
    if (!activePlan) return [];
    
    const startDate = parseISO(activePlan.period_start);
    const endDate = parseISO(activePlan.period_end);
    const options: MonthOption[] = [];
    
    let currentDate = new Date(startDate);
    currentDate.setDate(1); // Primeiro dia do mês
    
    while (currentDate <= endDate) {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      
      options.push({
        value: `${year}-${month.toString().padStart(2, '0')}`,
        label: currentDate.toLocaleDateString('pt-BR', { 
          month: 'long', 
          year: 'numeric' 
        }).replace(/^\w/, c => c.toUpperCase())
      });
      
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    
    return options.reverse(); // Ordem decrescente - mais recente primeiro
  }, [activePlan]);

  const yearOptions = useMemo<YearOption[]>(() => {
    if (!activePlan) return [];
    
    const startYear = parseISO(activePlan.period_start).getFullYear();
    const endYear = parseISO(activePlan.period_end).getFullYear();
    const options: YearOption[] = [];
    
    for (let year = endYear; year >= startYear; year--) {
      options.push({
        value: year,
        label: year.toString()
      });
    }
    
    return options; // Já em ordem decrescente
  }, [activePlan]);

  // Funções que determinam o período padrão inteligente
  const getDefaultYear = useCallback((): number => {
    const currentYear = new Date().getFullYear();
    // Se o ano atual está no plano, usa ele
    const hasCurrentYear = yearOptions.some(opt => opt.value === currentYear);
    if (hasCurrentYear) return currentYear;
    
    // Selecionar o ano mais próximo do ano atual
    if (yearOptions.length > 0) {
      const closestYear = yearOptions.reduce((closest, opt) => {
        return Math.abs(opt.value - currentYear) < Math.abs(closest - currentYear) 
          ? opt.value 
          : closest;
      }, yearOptions[0].value);
      return closestYear;
    }
    
    return currentYear;
  }, [yearOptions]);

  const getDefaultQuarter = useCallback((): { quarter: 1 | 2 | 3 | 4, year: number } => {
    const now = new Date();
    const currentQuarter = Math.ceil((now.getMonth() + 1) / 3) as 1 | 2 | 3 | 4;
    const currentYear = now.getFullYear();
    
    // Verifica se o quarter atual está no plano
    const hasCurrentQuarter = quarterOptions.some(
      opt => opt.quarter === currentQuarter && opt.year === currentYear
    );
    
    if (hasCurrentQuarter) {
      return { quarter: currentQuarter, year: currentYear };
    }
    
    // Senão, retorna o primeiro quarter do plano
    if (quarterOptions.length > 0) {
      return { quarter: quarterOptions[0].quarter, year: quarterOptions[0].year };
    }
    
    return { quarter: currentQuarter, year: currentYear };
  }, [quarterOptions]);

  const getDefaultMonth = useCallback((): { month: number, year: number } => {
    const now = new Date();
    // Usar mês anterior como padrão (último mês fechado)
    const previousMonth = new Date(now);
    previousMonth.setMonth(previousMonth.getMonth() - 1);
    
    const targetMonth = previousMonth.getMonth() + 1;
    const targetYear = previousMonth.getFullYear();
    const monthValue = `${targetYear}-${targetMonth.toString().padStart(2, '0')}`;
    
    // Verifica se o mês está no plano
    const hasTargetMonth = monthOptions.some(opt => opt.value === monthValue);
    
    if (hasTargetMonth) {
      return { month: targetMonth, year: targetYear };
    }
    
    // Senão, retorna o primeiro mês do plano
    if (monthOptions.length > 0) {
      const [year, month] = monthOptions[0].value.split('-');
      return { month: parseInt(month), year: parseInt(year) };
    }
    
    return { month: targetMonth, year: targetYear };
  }, [monthOptions]);

  return { 
    quarterOptions, 
    monthOptions, 
    yearOptions,
    getDefaultYear,
    getDefaultQuarter,
    getDefaultMonth
  };
};
