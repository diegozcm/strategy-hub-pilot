import React from 'react';
import { useAuth } from '@/hooks/useMultiTenant';
import { UserRole } from '@/types/auth';

interface PermissionGateProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  requiresWrite?: boolean;
  requiresDelete?: boolean;
  requiresAdmin?: boolean;
  fallback?: React.ReactNode;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
  children,
  requiredRole,
  requiresWrite = false,
  requiresDelete = false,
  requiresAdmin = false,
  fallback = null
}) => {
  const { profile, permissions } = useAuth();

  if (!profile) {
    return <>{fallback}</>;
  }

  // Check specific role requirement
  if (requiredRole) {
    const roleHierarchy: UserRole[] = ['member', 'manager', 'admin'];
    const userRoleIndex = roleHierarchy.indexOf(profile.role);
    const requiredRoleIndex = roleHierarchy.indexOf(requiredRole);
    
    if (userRoleIndex < requiredRoleIndex) {
      return <>{fallback}</>;
    }
  }

  // Check specific permission requirements
  if (requiresWrite && !permissions.write) {
    return <>{fallback}</>;
  }

  if (requiresDelete && !permissions.delete) {
    return <>{fallback}</>;
  }

  if (requiresAdmin && !permissions.admin) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};