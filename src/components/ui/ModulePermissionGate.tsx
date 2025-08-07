import React from 'react';
import { useModules } from '@/hooks/useModules';
import { UserRole } from '@/types/auth';

interface ModulePermissionGateProps {
  children: React.ReactNode;
  requiredModule: string;
  requiredRole?: UserRole;
  requiresWrite?: boolean;
  requiresDelete?: boolean;
  requiresAdmin?: boolean;
  fallback?: React.ReactNode;
}

export const ModulePermissionGate: React.FC<ModulePermissionGateProps> = ({
  children,
  requiredModule,
  requiredRole,
  requiresWrite = false,
  requiresDelete = false,
  requiresAdmin = false,
  fallback = null
}) => {
  const { hasModuleAccess, currentModule } = useModules();

  // Check if user has access to the required module
  if (!hasModuleAccess(requiredModule)) {
    return <>{fallback}</>;
  }

  // Check if user is currently in the required module
  if (currentModule?.slug !== requiredModule) {
    return <>{fallback}</>;
  }

  // If we get here, user has access to the module and is currently in it
  // Additional role/permission checks would go here if needed
  
  return <>{children}</>;
};