import { useMemo } from 'react';
import { useModules } from '@/hooks/useModules';
import { useUserModuleRoles, UserRole } from '@/hooks/useUserModuleRoles';

/**
 * Hook centralizado para obter o papel do usuário no módulo atual
 * Fonte de verdade: user_module_roles table
 */
export const useCurrentModuleRole = () => {
  const { currentModule } = useModules();
  const { getRolesForModuleId, loading } = useUserModuleRoles();
  
  // Obter papéis do usuário no módulo atual
  const currentModuleRoles = useMemo(() => {
    return currentModule?.id ? getRolesForModuleId(currentModule.id) : [];
  }, [currentModule?.id, getRolesForModuleId]);
  
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
