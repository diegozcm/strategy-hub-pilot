import { useState, useEffect } from 'react';
import { useAuth } from './useMultiTenant';

/**
 * Hook para obter a contagem de empresas do usuário
 * Usado para exibir/ocultar opções de troca de empresa
 */
export const useUserCompaniesCount = () => {
  const { user, fetchAllUserCompanies } = useAuth();
  const [companiesCount, setCompaniesCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCompaniesCount = async () => {
      if (!user || !fetchAllUserCompanies) {
        setCompaniesCount(0);
        setLoading(false);
        return;
      }

      try {
        const companies = await fetchAllUserCompanies();
        setCompaniesCount(companies.length);
      } catch (error) {
        console.error('Error loading companies count:', error);
        setCompaniesCount(0);
      } finally {
        setLoading(false);
      }
    };

    loadCompaniesCount();
  }, [user, fetchAllUserCompanies]);

  return {
    companiesCount,
    hasMultipleCompanies: companiesCount > 1,
    loading
  };
};
