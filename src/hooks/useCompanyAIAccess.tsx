import { useAuth } from '@/hooks/useMultiTenant';
import { useMemo } from 'react';

/**
 * Hook para verificar se a empresa atual tem acesso aos recursos de IA
 * @returns {boolean} hasAIAccess - true se a empresa tem ai_enabled = true
 */
export const useCompanyAIAccess = () => {
  const { company } = useAuth();
  
  const hasAIAccess = useMemo(() => {
    return company?.ai_enabled === true;
  }, [company?.ai_enabled]);

  return { hasAIAccess };
};
