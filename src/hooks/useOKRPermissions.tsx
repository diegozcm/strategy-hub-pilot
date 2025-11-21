import { useAuth } from '@/hooks/useMultiTenant';
import { useModulePermissions } from '@/hooks/useModulePermissions';

export const useOKRPermissions = () => {
  const { profile } = useAuth();
  const { isInModule, canAccessModule } = useModulePermissions();

  const isInOKRModule = isInModule('okr-planning');
  
  // Check if user has admin role in any company
  const isAdmin = profile?.role === 'admin';
  const isGestor = profile?.role === 'manager';
  const isMembro = isInOKRModule && !isAdmin && !isGestor;

  return {
    // Ano
    canCreateYear: isAdmin,
    canEditYear: isAdmin,
    canDeleteYear: isAdmin,
    
    // Trimestre
    canConfigureQuarter: isAdmin,
    
    // Objetivo
    canCreateObjective: isAdmin || isGestor,
    canEditObjective: (ownerId: string) => 
      isAdmin || (isGestor && ownerId === profile?.user_id),
    canDeleteObjective: (ownerId: string) => 
      isAdmin || (isGestor && ownerId === profile?.user_id),
    
    // Key Result
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
