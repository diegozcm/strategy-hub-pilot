import { useMemo } from 'react';
import { parseISO } from 'date-fns';
import { useActivePlan } from './useActivePlan';

export type PeriodType = 'ytd' | 'monthly' | 'yearly' | 'quarterly';

interface PeriodApplicability {
  /** Se YTD é aplicável (ano atual está dentro do plano) */
  isYTDApplicable: boolean;
  /** Período padrão inteligente */
  defaultPeriod: PeriodType;
  /** Mensagem de aviso quando YTD não é aplicável */
  ytdWarningMessage: string | null;
  /** Primeiro ano do plano ativo */
  planFirstYear: number;
  /** Ano atual */
  currentYear: number;
  /** Se existe um plano ativo */
  hasActivePlan: boolean;
}

/**
 * Hook para determinar se YTD é aplicável baseado no plano estratégico ativo.
 * YTD (Year-to-Date) só faz sentido quando o ano atual está dentro do período do plano.
 * 
 * Ex: Em 2025, um plano de 2026 não tem YTD aplicável.
 */
export const usePeriodApplicability = (): PeriodApplicability => {
  const { activePlan, hasActivePlan } = useActivePlan();
  const currentYear = new Date().getFullYear();
  
  const planFirstYear = useMemo(() => {
    if (!activePlan?.period_start) return currentYear;
    return parseISO(activePlan.period_start).getFullYear();
  }, [activePlan?.period_start, currentYear]);

  const planLastYear = useMemo(() => {
    if (!activePlan?.period_end) return currentYear;
    return parseISO(activePlan.period_end).getFullYear();
  }, [activePlan?.period_end, currentYear]);

  // YTD só é aplicável se o ano atual está dentro do período do plano
  const isYTDApplicable = useMemo(() => {
    if (!hasActivePlan) return false;
    return currentYear >= planFirstYear && currentYear <= planLastYear;
  }, [hasActivePlan, currentYear, planFirstYear, planLastYear]);
  
  // Período padrão inteligente
  const defaultPeriod = useMemo<PeriodType>(() => {
    if (isYTDApplicable) return 'ytd';
    return 'yearly'; // Redireciona para visão anual quando YTD não é aplicável
  }, [isYTDApplicable]);
  
  // Mensagem explicativa
  const ytdWarningMessage = useMemo(() => {
    if (isYTDApplicable) return null;
    if (!hasActivePlan) return 'Nenhum plano estratégico ativo.';
    
    if (currentYear < planFirstYear) {
      return `YTD não disponível: o plano inicia em ${planFirstYear}. Exibindo visão anual.`;
    }
    if (currentYear > planLastYear) {
      return `YTD não disponível: o plano terminou em ${planLastYear}. Exibindo visão anual.`;
    }
    return null;
  }, [hasActivePlan, isYTDApplicable, currentYear, planFirstYear, planLastYear]);

  return {
    isYTDApplicable,
    defaultPeriod,
    ytdWarningMessage,
    planFirstYear,
    currentYear,
    hasActivePlan,
  };
};
