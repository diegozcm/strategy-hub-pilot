import { useMemo } from 'react';
import { Quarter } from '@/types/okr';

interface QuarterInfo {
  quarter: Quarter;
  startDate: Date;
  endDate: Date;
  year: number;
}

/**
 * Hook para detectar o trimestre atual e fornecer informações sobre trimestres
 */
export const useCurrentQuarter = () => {
  const getCurrentQuarter = useMemo(() => {
    return (): QuarterInfo => {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth(); // 0-11

      let quarter: Quarter;
      let startDate: Date;
      let endDate: Date;

      if (month >= 0 && month <= 2) {
        // Q1: Janeiro-Março
        quarter = 'Q1';
        startDate = new Date(year, 0, 1);
        endDate = new Date(year, 2, 31, 23, 59, 59);
      } else if (month >= 3 && month <= 5) {
        // Q2: Abril-Junho
        quarter = 'Q2';
        startDate = new Date(year, 3, 1);
        endDate = new Date(year, 5, 30, 23, 59, 59);
      } else if (month >= 6 && month <= 8) {
        // Q3: Julho-Setembro
        quarter = 'Q3';
        startDate = new Date(year, 6, 1);
        endDate = new Date(year, 8, 30, 23, 59, 59);
      } else {
        // Q4: Outubro-Dezembro
        quarter = 'Q4';
        startDate = new Date(year, 9, 1);
        endDate = new Date(year, 11, 31, 23, 59, 59);
      }

      return { quarter, startDate, endDate, year };
    };
  }, []);

  const getQuarterDates = useMemo(() => {
    return (quarter: Quarter, year: number): { startDate: Date; endDate: Date } => {
      let startDate: Date;
      let endDate: Date;

      switch (quarter) {
        case 'Q1':
          startDate = new Date(year, 0, 1);
          endDate = new Date(year, 2, 31, 23, 59, 59);
          break;
        case 'Q2':
          startDate = new Date(year, 3, 1);
          endDate = new Date(year, 5, 30, 23, 59, 59);
          break;
        case 'Q3':
          startDate = new Date(year, 6, 1);
          endDate = new Date(year, 8, 30, 23, 59, 59);
          break;
        case 'Q4':
          startDate = new Date(year, 9, 1);
          endDate = new Date(year, 11, 31, 23, 59, 59);
          break;
      }

      return { startDate, endDate };
    };
  }, []);

  const getQuarterLabel = useMemo(() => {
    return (quarter: Quarter, year: number): string => {
      const months: Record<Quarter, string> = {
        Q1: 'Jan-Mar',
        Q2: 'Abr-Jun',
        Q3: 'Jul-Set',
        Q4: 'Out-Dez',
      };
      return `${quarter} ${year} (${months[quarter]})`;
    };
  }, []);

  const isQuarterInFuture = useMemo(() => {
    return (quarter: Quarter, year: number): boolean => {
      const now = new Date();
      const { startDate } = getQuarterDates(quarter, year);
      return startDate > now;
    };
  }, [getQuarterDates]);

  const isQuarterInPast = useMemo(() => {
    return (quarter: Quarter, year: number): boolean => {
      const now = new Date();
      const { endDate } = getQuarterDates(quarter, year);
      return endDate < now;
    };
  }, [getQuarterDates]);

  return {
    getCurrentQuarter,
    getQuarterDates,
    getQuarterLabel,
    isQuarterInFuture,
    isQuarterInPast,
  };
};
