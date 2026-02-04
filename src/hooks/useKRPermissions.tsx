import { useCurrentModuleRole } from '@/hooks/useCurrentModuleRole';
import { useAuth } from '@/hooks/useMultiTenant';
import { useCompanyModuleSettings } from '@/hooks/useCompanyModuleSettings';

/**
 * Hook de permissões específico para operações com Key Results
 * Baseado em roles do módulo Strategic Planning
 */
export const useKRPermissions = () => {
  const { user } = useAuth();
  const { isModuleAdmin, isModuleManager, isModuleMember, loading } = useCurrentModuleRole();
  const { membersCanViewAll, loading: settingsLoading } = useCompanyModuleSettings('strategic-planning');

  const isManagerOrAdmin = isModuleAdmin || isModuleManager;
  const isMemberOnly = isModuleMember && !isModuleManager && !isModuleAdmin;
  
  console.log('[useKRPermissions] Debug:', {
    userId: user?.id,
    isModuleAdmin,
    isModuleManager,
    isModuleMember,
    isManagerOrAdmin,
    membersCanViewAll,
    settingsLoading,
    loading
  });

  return {
    // Permissões de criação
    canCreateKR: isManagerOrAdmin,
    canCreateObjective: isManagerOrAdmin,
    canCreatePillar: isManagerOrAdmin,
    
    // Permissões de exclusão
    canDeleteKR: isManagerOrAdmin,
    canDeleteObjective: isManagerOrAdmin,
    canDeletePillar: isManagerOrAdmin,
    
    // Permissões de edição
    canEditAnyKR: isManagerOrAdmin, // Pode editar qualquer KR
    canEditOwnKR: false, // Membros NÃO podem mais editar seus KRs
    canEditObjective: isManagerOrAdmin,
    canEditPillar: isManagerOrAdmin,
    
    // Permissão de atualizar valores (check-in)
    canUpdateKRValues: isManagerOrAdmin,
    canUpdateOwnKRValues: true, // Membros podem fazer check-in nos próprios KRs
    
    // Helper para verificar se pode fazer check-in em KR específico
    canCheckInKR: (krOwnerId: string | null) => {
      if (isManagerOrAdmin) return true;
      if (isMemberOnly && krOwnerId === user?.id) return true;
      return false;
    },
    
    // Permissão de selecionar dono
    canSelectOwner: isManagerOrAdmin, // Apenas managers/admins podem escolher dono
    
    // Visualização - todos os membros do módulo podem ver todos os KRs
    canViewAllKRs: true,
    
    // Permissões de iniciativas
    canCreateInitiative: isManagerOrAdmin,
    canEditInitiativeConfig: isManagerOrAdmin, // Editar título, datas, responsável, etc
    canDeleteInitiative: isManagerOrAdmin,
    canUpdateInitiativeProgress: true, // Todos podem atualizar progresso
    
    // Flags de status
    isManagerOrAdmin,
    isMemberOnly,
    
    // ID do usuário atual (para verificar ownership)
    currentUserId: user?.id,
    
    // Loading state
    loading
  };
};
