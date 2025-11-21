import { useMemo } from 'react';
import { useAuth } from '@/hooks/useMultiTenant';
import { OKRPeriod, OKRYear } from '@/types/okr';

/**
 * Hook para gerenciar permissões relacionadas ao módulo OKR
 */
export const useOKRPermissions = () => {
  const { profile } = useAuth();
  const userRole = profile?.role;

  const isAdmin = useMemo(() => userRole === 'admin', [userRole]);
  const isManager = useMemo(() => userRole === 'manager', [userRole]);
  const isAdminOrManager = useMemo(() => isAdmin || isManager, [isAdmin, isManager]);

  /**
   * Verifica se o usuário pode editar um período específico
   * - Admin e Manager: podem editar qualquer período
   * - Usuário comum: só pode editar período ativo
   */
  const canEditPeriod = useMemo(() => {
    return (period: OKRPeriod | null): boolean => {
      if (!period) return false;
      if (isAdminOrManager) return true; // Admin e Manager podem editar qualquer período
      return period.status === 'active'; // Usuário comum só edita período ativo
    };
  }, [isAdminOrManager]);

  /**
   * Verifica se o usuário pode editar um ano específico
   * - Admin e Manager: podem editar qualquer ano não bloqueado
   * - Usuário comum: só pode editar ano ativo
   */
  const canEditYear = useMemo(() => {
    return (year: OKRYear | null): boolean => {
      if (!year) return false;
      if (year.is_locked) return false; // Ninguém edita ano bloqueado
      if (isAdminOrManager) return true; // Admin e Manager podem editar qualquer ano não bloqueado
      return year.status === 'active'; // Usuário comum só edita ano ativo
    };
  }, [isAdminOrManager]);

  /**
   * Verifica se o usuário pode criar novos OKRs
   */
  const canCreateOKR = useMemo(() => {
    return isAdminOrManager; // Apenas Admin e Manager podem criar OKRs
  }, [isAdminOrManager]);

  /**
   * Verifica se o usuário pode deletar OKRs
   */
  const canDeleteOKR = useMemo(() => {
    return isAdminOrManager; // Apenas Admin e Manager podem deletar OKRs
  }, [isAdminOrManager]);

  /**
   * Verifica se o usuário pode criar Key Results
   */
  const canCreateKeyResult = useMemo(() => {
    return true; // Todos podem criar Key Results
  }, []);

  /**
   * Verifica se o usuário pode deletar Key Results
   */
  const canDeleteKeyResult = useMemo(() => {
    return isAdminOrManager; // Apenas Admin e Manager podem deletar Key Results
  }, [isAdminOrManager]);

  /**
   * Verifica se o usuário pode criar iniciativas
   */
  const canCreateInitiative = useMemo(() => {
    return true; // Todos podem criar iniciativas
  }, []);

  /**
   * Verifica se o usuário pode alocar iniciativas do backlog para trimestres
   */
  const canAllocateInitiatives = useMemo(() => {
    return isAdminOrManager; // Apenas Admin e Manager podem alocar iniciativas
  }, [isAdminOrManager]);

  /**
   * Verifica se o usuário pode fazer transições manuais de ano
   */
  const canManageYearTransitions = useMemo(() => {
    return isAdmin; // Apenas Admin pode fazer transições de ano
  }, [isAdmin]);

  return {
    isAdmin,
    isManager,
    isAdminOrManager,
    canEditPeriod,
    canEditYear,
    canCreateOKR,
    canDeleteOKR,
    canCreateKeyResult,
    canDeleteKeyResult,
    canCreateInitiative,
    canAllocateInitiatives,
    canManageYearTransitions,
  };
};
