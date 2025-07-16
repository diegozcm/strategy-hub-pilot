import { useEffect, useCallback } from 'react';
import { useAuth } from './useMultiTenant';

/**
 * Hook para gerenciar dados baseados na empresa selecionada
 * Facilita o recarregamento de dados quando a empresa muda
 */
export const useCompanyData = (loadDataFunction: () => Promise<void>) => {
  const { user, company: authCompany } = useAuth();

  const loadData = useCallback(loadDataFunction, [loadDataFunction]);

  // Carregar dados inicial
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Recarregar dados quando a empresa muda
  useEffect(() => {
    if (user && authCompany) {
      loadData();
    }
  }, [user, authCompany?.id, loadData]);

  return {
    user,
    company: authCompany,
    hasCompany: !!authCompany,
    isReady: !!user && !!authCompany
  };
};