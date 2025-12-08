import { useContext } from 'react';
import { PeriodFilterContext, PeriodFilterContextType } from '@/contexts/PeriodFilterContext';

/**
 * Hook para acessar o contexto global de filtros de período.
 * 
 * @example
 * const { 
 *   periodType, 
 *   selectedYear, 
 *   setPeriodType, 
 *   setSelectedYear,
 *   quarterOptions,
 *   handleYTDClick 
 * } = usePeriodFilter();
 */
export const usePeriodFilter = (): PeriodFilterContextType => {
  const context = useContext(PeriodFilterContext);
  
  if (!context) {
    throw new Error(
      'usePeriodFilter must be used within a PeriodFilterProvider. ' +
      'Make sure your component is wrapped with <PeriodFilterProvider>.'
    );
  }
  
  return context;
};

/**
 * Hook opcional que retorna null se o contexto não estiver disponível,
 * em vez de lançar um erro. Útil para componentes que podem ser usados
 * dentro ou fora do provider.
 */
export const usePeriodFilterOptional = (): PeriodFilterContextType | null => {
  return useContext(PeriodFilterContext);
};
