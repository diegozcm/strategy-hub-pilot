import React from 'react';
import { useAuth } from '@/hooks/useMultiTenant';
import { useCurrentModuleRole } from '@/hooks/useCurrentModuleRole';
import { UserRole } from '@/types/auth';

interface PermissionGateProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  requiresWrite?: boolean;
  requiresDelete?: boolean;
  requiresAdmin?: boolean;
  fallback?: React.ReactNode;
}

/**
 * PermissionGate - usa user_module_roles como fonte de verdade
 */
export const PermissionGate: React.FC<PermissionGateProps> = ({
  children,
  requiredRole,
  requiresWrite = false,
  requiresDelete = false,
  requiresAdmin = false,
  fallback = null
}) => {
  const { profile } = useAuth();
  const { highestRole, canEdit, canDelete, canAdmin } = useCurrentModuleRole();

  if (!profile) {
    return <>{fallback}</>;
  }

  // Check specific role requirement using module role
  if (requiredRole && highestRole) {
    const roleHierarchy: UserRole[] = ['member', 'manager', 'admin'];
    const userRoleIndex = roleHierarchy.indexOf(highestRole);
    const requiredRoleIndex = roleHierarchy.indexOf(requiredRole);
    
    if (userRoleIndex < requiredRoleIndex) {
      return <>{fallback}</>;
    }
  } else if (requiredRole && !highestRole) {
    // No role in current module
    return <>{fallback}</>;
  }

  // Check specific permission requirements using module permissions
  if (requiresWrite && !canEdit) {
    return <>{fallback}</>;
  }

  if (requiresDelete && !canDelete) {
    return <>{fallback}</>;
  }

  if (requiresAdmin && !canAdmin) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};