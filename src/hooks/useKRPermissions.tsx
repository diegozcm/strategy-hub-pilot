import { useCurrentModuleRole } from '@/hooks/useCurrentModuleRole';
import { useAuth } from '@/hooks/useMultiTenant';

/**
 * Hook de permissões específico para operações com Key Results
 * Baseado em roles do módulo Strategic Planning
 */
export const useKRPermissions = () => {
  const { user } = useAuth();
  const { isModuleAdmin, isModuleManager, isModuleMember, loading } = useCurrentModuleRole();

  const isManagerOrAdmin = isModuleAdmin || isModuleManager;
  
  console.log('[useKRPermissions] Debug:', {
    userId: user?.id,
    isModuleAdmin,
    isModuleManager,
    isModuleMember,
    isManagerOrAdmin,
    loading
  });

  return {
    // Permissões de criação
    canCreateKR: isManagerOrAdmin,
    
    // Permissões de exclusão
    canDeleteKR: isManagerOrAdmin,
    
    // Permissões de edição
    canEditAnyKR: isManagerOrAdmin, // Pode editar qualquer KR
    canEditOwnKR: true, // Todos podem editar seus próprios KRs (check-in)
    
    // Permissão de selecionar dono
    canSelectOwner: isManagerOrAdmin, // Apenas managers/admins podem escolher dono
    
    // Visualização
    canViewAllKRs: isManagerOrAdmin, // Pode ver todos os KRs da empresa
    
    // Flags de status
    isManagerOrAdmin,
    isMemberOnly: isModuleMember && !isModuleManager && !isModuleAdmin,
    
    // ID do usuário atual (para verificar ownership)
    currentUserId: user?.id,
    
    // Loading state
    loading
  };
};
