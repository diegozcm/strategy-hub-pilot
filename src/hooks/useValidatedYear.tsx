import { useState, useEffect, useCallback } from 'react';
import { usePlanPeriodOptions } from './usePlanPeriodOptions';

interface UseValidatedYearOptions {
  /** Valor inicial preferido (opcional) */
  preferredYear?: number;
}

// Função auxiliar para encontrar o ano mais próximo do atual
const getClosestYear = (yearOptions: Array<{ value: number }>, currentYear: number): number => {
  if (yearOptions.length === 0) return currentYear;
  if (yearOptions.length === 1) return yearOptions[0].value;
  
  return yearOptions.reduce((closest, opt) => {
    return Math.abs(opt.value - currentYear) < Math.abs(closest - currentYear) 
      ? opt.value 
      : closest;
  }, yearOptions[0].value);
};

/**
 * Hook que retorna um selectedYear garantidamente válido dentro das opções do plano.
 * - Se apenas 1 ano disponível: seleciona automaticamente
 * - Se múltiplos anos: prioriza ano atual, senão ano mais próximo do atual
 */
export const useValidatedYear = (options?: UseValidatedYearOptions) => {
  const { yearOptions } = usePlanPeriodOptions();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(
    options?.preferredYear ?? currentYear
  );

  // Sincronizar selectedYear quando yearOptions mudar
  useEffect(() => {
    if (yearOptions.length === 0) return;
    
    const isValidYear = yearOptions.some(opt => opt.value === selectedYear);
    
    if (!isValidYear) {
      // Se apenas um ano disponível, seleciona ele
      if (yearOptions.length === 1) {
        setSelectedYear(yearOptions[0].value);
        return;
      }
      
      // Se múltiplos anos, prioriza ano atual, senão o mais próximo
      const hasCurrentYear = yearOptions.some(opt => opt.value === currentYear);
      setSelectedYear(hasCurrentYear ? currentYear : getClosestYear(yearOptions, currentYear));
    }
  }, [yearOptions, selectedYear, currentYear]);

  return { selectedYear, setSelectedYear, yearOptions };
};

/**
 * Hook utilitário para garantir sincronização de múltiplos campos de ano.
 * Use este hook quando precisar sincronizar selectedYear, selectedQuarterYear, e selectedMonthYear.
 */
export const useYearSynchronization = (
  yearOptions: Array<{ value: number; label: string }>,
  setSelectedYear: (year: number) => void,
  setSelectedQuarterYear?: (year: number) => void,
  setSelectedMonthYear?: (year: number) => void,
  selectedYear?: number,
  selectedQuarterYear?: number,
  selectedMonthYear?: number
) => {
  const currentYear = new Date().getFullYear();

  const getValidYear = useCallback(() => {
    if (yearOptions.length === 0) return currentYear;
    if (yearOptions.length === 1) return yearOptions[0].value;
    
    const hasCurrentYear = yearOptions.some(opt => opt.value === currentYear);
    return hasCurrentYear ? currentYear : getClosestYear(yearOptions, currentYear);
  }, [yearOptions, currentYear]);

  useEffect(() => {
    if (yearOptions.length === 0) return;
    
    const validYear = getValidYear();
    
    // Validar selectedYear
    if (selectedYear !== undefined) {
      const isSelectedYearValid = yearOptions.some(opt => opt.value === selectedYear);
      if (!isSelectedYearValid) {
        setSelectedYear(validYear);
      }
    }
    
    // Validar selectedQuarterYear
    if (selectedQuarterYear !== undefined && setSelectedQuarterYear) {
      const isQuarterYearValid = yearOptions.some(opt => opt.value === selectedQuarterYear);
      if (!isQuarterYearValid) {
        setSelectedQuarterYear(validYear);
      }
    }
    
    // Validar selectedMonthYear
    if (selectedMonthYear !== undefined && setSelectedMonthYear) {
      const isMonthYearValid = yearOptions.some(opt => opt.value === selectedMonthYear);
      if (!isMonthYearValid) {
        setSelectedMonthYear(validYear);
      }
    }
  }, [yearOptions, selectedYear, selectedQuarterYear, selectedMonthYear, setSelectedYear, setSelectedQuarterYear, setSelectedMonthYear, getValidYear]);

  return { getValidYear };
};
