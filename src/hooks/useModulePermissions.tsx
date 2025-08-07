import { useModules } from '@/hooks/useModules';
import { useAuth } from '@/hooks/useMultiTenant';

export const useModulePermissions = () => {
  const { currentModule, hasModuleAccess } = useModules();
  const { permissions, canEdit, canDelete, canAdmin } = useAuth();

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

  return {
    currentModule,
    canAccessModule,
    canEditInCurrentModule,
    canDeleteInCurrentModule,
    canAdminInCurrentModule,
    isInModule,
    permissions
  };
};