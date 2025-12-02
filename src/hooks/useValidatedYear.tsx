import { useState, useEffect, useCallback } from 'react';
import { usePlanPeriodOptions } from './usePlanPeriodOptions';

interface UseValidatedYearOptions {
  /** Valor inicial preferido (opcional) */
  preferredYear?: number;
}

/**
 * Hook que retorna um selectedYear garantidamente válido dentro das opções do plano.
 * - Se apenas 1 ano disponível: seleciona automaticamente
 * - Se múltiplos anos: prioriza ano atual, senão primeiro do plano
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
      
      // Se múltiplos anos, prioriza ano atual
      const hasCurrentYear = yearOptions.some(opt => opt.value === currentYear);
      setSelectedYear(hasCurrentYear ? currentYear : yearOptions[0].value);
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
    
    const hasCurrentYear = yearOptions.some(opt => opt.value === currentYear);
    
    if (yearOptions.length === 1) {
      return yearOptions[0].value;
    }
    
    return hasCurrentYear ? currentYear : yearOptions[0].value;
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
