import { useAuth } from '@/hooks/useMultiTenant';
import { useModulePermissions } from '@/hooks/useModulePermissions';
import { useModules } from '@/hooks/useModules';
import { useUserModuleRoles } from '@/hooks/useUserModuleRoles';

export const useOKRPermissions = () => {
  const { profile } = useAuth();
  const { canAccessModule } = useModulePermissions();
  const { availableModules } = useModules();
  const { getRolesForModuleId, loading: rolesLoading } = useUserModuleRoles();

  // Find the OKR Planning module
  const okrModule = availableModules.find(m => m.slug === 'okr-planning');
  
  // Get user's roles for OKR Planning module specifically
  const okrModuleRoles = getRolesForModuleId(okrModule?.id);
  
  const isInOKRModule = canAccessModule('okr-planning');
  
  // Check if user has specific roles within the OKR Planning module
  const isAdmin = okrModuleRoles.includes('admin');
  const isGestor = okrModuleRoles.includes('manager');
  const isMembro = isInOKRModule && !isAdmin && !isGestor;

  // Debug log for troubleshooting
  console.log('[OKR Permissions]', {
    okrModuleId: okrModule?.id,
    okrModuleRoles,
    isInOKRModule,
    isAdmin,
    isGestor,
    isMembro,
    rolesLoading
  });

  return {
    // Ano
    canCreateYear: isAdmin,
    canEditYear: isAdmin,
    canDeleteYear: isAdmin,
    
    // Pilar
    canCreatePillar: isAdmin,
    canEditPillar: (sponsorId: string) => 
      isAdmin || sponsorId === profile?.user_id,
    canUpdatePillar: (pillarId: string) => isAdmin || isGestor,
    canDeletePillar: (pillarId: string) => isAdmin,
    
    // Objetivo
    canCreateObjective: isAdmin || isGestor,
    canEditObjective: (ownerId: string) => 
      isAdmin || (isGestor && ownerId === profile?.user_id),
    canDeleteObjective: (ownerId: string) => 
      isAdmin || (isGestor && ownerId === profile?.user_id),
    
    // Key Result
    canCreateKeyResult: isAdmin || isGestor,
    canCreateKR: isAdmin || isGestor,
    canEditKR: (ownerId: string) => 
      isAdmin || (isGestor && ownerId === profile?.user_id),
    canDeleteKR: (ownerId: string) => 
      isAdmin || (isGestor && ownerId === profile?.user_id),
    
    // Check-in
    canAddCheckIn: isInOKRModule,
    canEditCheckIn: (createdBy: string) => 
      isAdmin || createdBy === profile?.user_id,
    canDeleteCheckIn: (createdBy: string) => 
      isAdmin || createdBy === profile?.user_id,
    
    // Ação
    canCreateAction: isInOKRModule,
    canEditAction: (createdBy: string, assignedTo?: string) => 
      isAdmin || isGestor || 
      assignedTo === profile?.user_id || createdBy === profile?.user_id,
    canDeleteAction: (createdBy: string) => 
      isAdmin || isGestor || createdBy === profile?.user_id,
    canAssignAction: isAdmin || isGestor,
    
    // Roles
    isAdmin,
    isGestor,
    isMembro,
    isInModule: isInOKRModule
  };
};
