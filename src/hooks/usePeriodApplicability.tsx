import { useMemo } from 'react';
import { parseISO } from 'date-fns';
import { useActivePlan } from './useActivePlan';

export type PeriodType = 'ytd' | 'monthly' | 'yearly' | 'quarterly' | 'semesterly';

interface PeriodApplicability {
  /** Se YTD pode ser calculado (ano atual está dentro do plano) */
  isYTDCalculable: boolean;
  /** Se YTD pode ser selecionado (sempre true - permite visualizar estrutura) */
  isYTDSelectable: boolean;
  /** Período padrão inteligente */
  defaultPeriod: PeriodType;
  /** Mensagem informativa sobre YTD */
  ytdInfoMessage: string | null;
  /** Primeiro ano do plano ativo */
  planFirstYear: number;
  /** Ano atual */
  currentYear: number;
  /** Se existe um plano ativo */
  hasActivePlan: boolean;
  
  // Aliases para compatibilidade (deprecated)
  /** @deprecated Use isYTDCalculable */
  isYTDApplicable: boolean;
  /** @deprecated Use ytdInfoMessage */
  ytdWarningMessage: string | null;
}

/**
 * Hook para determinar se YTD pode ser calculado baseado no plano estratégico ativo.
 * YTD é sempre selecionável para visualizar a estrutura, mas métricas só são calculadas
 * quando o ano atual está dentro do período do plano.
 * 
 * Ex: Em 2025, um plano de 2026 pode ser visualizado em YTD, mas métricas serão 0%.
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

  // YTD só pode ser calculado se o ano atual está dentro do período do plano
  const isYTDCalculable = useMemo(() => {
    if (!hasActivePlan) return false;
    return currentYear >= planFirstYear && currentYear <= planLastYear;
  }, [hasActivePlan, currentYear, planFirstYear, planLastYear]);
  
  // YTD sempre pode ser selecionado para visualizar estrutura
  const isYTDSelectable = true;
  
  // Período padrão inteligente
  const defaultPeriod = useMemo<PeriodType>(() => {
    if (isYTDCalculable) return 'ytd';
    return 'yearly'; // Redireciona para visão anual quando YTD não é calculável
  }, [isYTDCalculable]);
  
  // Mensagem informativa
  const ytdInfoMessage = useMemo(() => {
    if (isYTDCalculable) return null;
    if (!hasActivePlan) return 'Nenhum plano estratégico ativo.';
    
    if (currentYear < planFirstYear) {
      return `Visualizando estrutura do plano ${planFirstYear}. Métricas YTD serão calculadas quando o plano iniciar.`;
    }
    if (currentYear > planLastYear) {
      return `O plano terminou em ${planLastYear}. Exibindo últimos dados disponíveis.`;
    }
    return null;
  }, [hasActivePlan, isYTDCalculable, currentYear, planFirstYear, planLastYear]);

  return {
    isYTDCalculable,
    isYTDSelectable,
    defaultPeriod,
    ytdInfoMessage,
    planFirstYear,
    currentYear,
    hasActivePlan,
    // Aliases para compatibilidade
    isYTDApplicable: isYTDCalculable,
    ytdWarningMessage: ytdInfoMessage,
  };
};
