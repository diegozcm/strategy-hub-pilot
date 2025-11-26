import { useModules } from '@/hooks/useModules';
import { useCurrentModuleRole } from '@/hooks/useCurrentModuleRole';

/**
 * Hook de permissões de módulo - usa user_module_roles como fonte de verdade
 */
export const useModulePermissions = () => {
  const { currentModule, hasModuleAccess } = useModules();
  const { 
    canEdit, 
    canDelete, 
    canAdmin,
    isModuleManager,
    isModuleAdmin,
    highestRole,
    currentModuleRoles,
    loading
  } = useCurrentModuleRole();

  const canAccessModule = (moduleSlug: string) => {
    return hasModuleAccess(moduleSlug);
  };

  const canEditInCurrentModule = () => {
    return canEdit && currentModule !== null;
  };

  const canDeleteInCurrentModule = () => {
    return canDelete && currentModule !== null;
  };

  const canAdminInCurrentModule = () => {
    return canAdmin && currentModule !== null;
  };

  const isInModule = (moduleSlug: string) => {
    return currentModule?.slug === moduleSlug;
  };

  // Permissões derivadas do papel do módulo
  const permissions = {
    read: currentModuleRoles.length > 0,
    write: canEdit,
    delete: canDelete,
    admin: canAdmin
  };

  return {
    currentModule,
    canAccessModule,
    canEditInCurrentModule,
    canDeleteInCurrentModule,
    canAdminInCurrentModule,
    isInModule,
    permissions,
    isModuleManager,
    isModuleAdmin,
    highestRole,
    loading
  };
};