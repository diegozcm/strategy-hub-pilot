import { useMemo } from 'react';
import { useModules } from '@/hooks/useModules';
import { useUserModuleRoles, UserRole } from '@/hooks/useUserModuleRoles';

/**
 * Hook centralizado para obter o papel do usuário no módulo atual
 * Fonte de verdade: user_module_roles table
 */
export const useCurrentModuleRole = () => {
  const { currentModule } = useModules();
  const { moduleRoles, getRolesForModuleId, loading } = useUserModuleRoles();
  
  console.log('[useCurrentModuleRole] Current module:', {
    moduleId: currentModule?.id,
    moduleName: currentModule?.name,
    moduleSlug: currentModule?.slug
  });
  
  // Obter papéis do usuário no módulo atual
  const currentModuleRoles = useMemo(() => {
    if (loading) return [];
    const roles = currentModule?.id ? getRolesForModuleId(currentModule.id) : [];
    console.log('[useCurrentModuleRole] Roles for current module:', roles, 'loading:', loading);
    return roles;
  }, [currentModule?.id, moduleRoles, loading, getRolesForModuleId]);
  
  // Helper para determinar o papel mais alto na hierarquia
  const getHighestRole = (roles: UserRole[]): UserRole | null => {
    if (roles.includes('admin')) return 'admin';
    if (roles.includes('manager')) return 'manager';
    if (roles.includes('member')) return 'member';
    return null;
  };
  
  const highestRole = useMemo(() => getHighestRole(currentModuleRoles), [currentModuleRoles]);
  
  // Verificações de papel
  const isModuleAdmin = currentModuleRoles.includes('admin');
  const isModuleManager = currentModuleRoles.includes('manager');
  const isModuleMember = currentModuleRoles.includes('member');
  
  // Permissões derivadas do papel no módulo
  const canEdit = isModuleAdmin || isModuleManager;
  const canDelete = isModuleAdmin || isModuleManager;
  const canAdmin = isModuleAdmin;
  
  return {
    currentModuleRoles,
    highestRole,
    isModuleAdmin,
    isModuleManager,
    isModuleMember,
    canEdit,
    canDelete,
    canAdmin,
    loading
  };
};
