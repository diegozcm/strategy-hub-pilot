import { useMemo } from 'react';
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

  return { quarterOptions, monthOptions, yearOptions };
};
