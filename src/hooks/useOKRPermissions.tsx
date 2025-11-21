import { useMemo, useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useMultiTenant';
import { OKRPeriod, OKRYear } from '@/types/okr';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook para gerenciar permissões relacionadas ao módulo OKR
 * Usa user_module_roles para permissões específicas do módulo
 */
export const useOKRPermissions = () => {
  const { profile, user, company } = useAuth();
  const [moduleRoles, setModuleRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Buscar roles específicos do módulo OKR
  useEffect(() => {
    const loadModuleRoles = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        // Buscar módulo OKR
        const { data: okrModule } = await supabase
          .from('system_modules')
          .select('id')
          .eq('slug', 'okr-execution')
          .single();

        if (!okrModule) {
          console.log('📊 OKR Module not found, using fallback role');
          setModuleRoles([]);
          setLoading(false);
          return;
        }

        // Buscar roles do usuário para o módulo OKR
        const { data: rolesData } = await supabase
          .rpc('get_user_module_roles', { _user_id: user.id });

        const okrRoles = rolesData?.find((r: any) => r.module_id === okrModule.id);
        const roles = okrRoles?.roles || [];
        
        console.log('📊 [OKR Permissions] Module roles loaded:', {
          userId: user.id,
          moduleId: okrModule.id,
          roles,
          fallbackRole: profile?.role
        });

        setModuleRoles(roles);
      } catch (error) {
        console.error('Error loading OKR module roles:', error);
        setModuleRoles([]);
      } finally {
        setLoading(false);
      }
    };

    loadModuleRoles();
  }, [user?.id, profile?.role]);

  // Determinar role efetivo (módulo > global)
  const effectiveRole = useMemo(() => {
    if (moduleRoles.length > 0) {
      // Se tem roles no módulo, usar o maior privilégio
      if (moduleRoles.includes('admin')) return 'admin';
      if (moduleRoles.includes('manager')) return 'manager';
      return 'member';
    }
    // Fallback para role global
    return profile?.role || 'member';
  }, [moduleRoles, profile?.role]);

  const isAdmin = useMemo(() => effectiveRole === 'admin', [effectiveRole]);
  const isManager = useMemo(() => effectiveRole === 'manager', [effectiveRole]);
  const isAdminOrManager = useMemo(() => isAdmin || isManager, [isAdmin, isManager]);
  
  // Verificar se OKR está habilitado para a empresa
  const okrEnabled = useMemo(() => company?.okr_enabled === true, [company?.okr_enabled]);

  /**
   * Verifica se o usuário pode editar um período específico
   * - Admin e Manager: podem editar qualquer período
   * - Usuário comum: só pode editar período ativo
   */
  const canEditPeriod = useMemo(() => {
    return (period: OKRPeriod | null): boolean => {
      if (!period) return false;
      if (isAdminOrManager) return true; // Admin e Manager podem editar qualquer período
      return period.status === 'active'; // Usuário comum só edita período ativo
    };
  }, [isAdminOrManager]);

  /**
   * Verifica se o usuário pode editar um ano específico
   * - Admin e Manager: podem editar qualquer ano não bloqueado
   * - Usuário comum: só pode editar ano ativo
   */
  const canEditYear = useMemo(() => {
    return (year: OKRYear | null): boolean => {
      if (!year) return false;
      if (year.is_locked) return false; // Ninguém edita ano bloqueado
      if (isAdminOrManager) return true; // Admin e Manager podem editar qualquer ano não bloqueado
      return year.status === 'active'; // Usuário comum só edita ano ativo
    };
  }, [isAdminOrManager]);

  /**
   * Verifica se o usuário pode criar novos OKRs
   */
  const canCreateOKR = useMemo(() => {
    return isAdminOrManager; // Apenas Admin e Manager podem criar OKRs
  }, [isAdminOrManager]);

  /**
   * Verifica se o usuário pode deletar OKRs
   */
  const canDeleteOKR = useMemo(() => {
    return isAdminOrManager; // Apenas Admin e Manager podem deletar OKRs
  }, [isAdminOrManager]);

  /**
   * Verifica se o usuário pode criar Key Results
   */
  const canCreateKeyResult = useMemo(() => {
    return true; // Todos podem criar Key Results
  }, []);

  /**
   * Verifica se o usuário pode deletar Key Results
   */
  const canDeleteKeyResult = useMemo(() => {
    return isAdminOrManager; // Apenas Admin e Manager podem deletar Key Results
  }, [isAdminOrManager]);

  /**
   * Verifica se o usuário pode criar iniciativas
   */
  const canCreateInitiative = useMemo(() => {
    return true; // Todos podem criar iniciativas
  }, []);

  /**
   * Verifica se o usuário pode alocar iniciativas do backlog para trimestres
   */
  const canAllocateInitiatives = useMemo(() => {
    return isAdminOrManager; // Apenas Admin e Manager podem alocar iniciativas
  }, [isAdminOrManager]);

  /**
   * Verifica se o usuário pode fazer transições manuais de ano
   */
  const canManageYearTransitions = useMemo(() => {
    return isAdmin; // Apenas Admin pode fazer transições de ano
  }, [isAdmin]);

  return {
    isAdmin,
    isManager,
    isAdminOrManager,
    canEditPeriod,
    canEditYear,
    canCreateOKR,
    canDeleteOKR,
    canCreateKeyResult,
    canDeleteKeyResult,
    canCreateInitiative,
    canAllocateInitiatives,
    canManageYearTransitions,
    okrEnabled,
    effectiveRole,
    loading,
  };
};
