import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useMultiTenant';
import { useToast } from './use-toast';

interface SystemModule {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
}

interface ModulesContextType {
  availableModules: SystemModule[];
  currentModule: SystemModule | null;
  loading: boolean;
  switchModule: (moduleId: string) => Promise<void>;
  hasModuleAccess: (moduleSlug: string) => boolean;
}

const ModulesContext = createContext<ModulesContextType | undefined>(undefined);

export const ModulesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile, switchCompany, fetchCompaniesByType, fetchAllUserCompanies, isSystemAdmin } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [availableModules, setAvailableModules] = useState<SystemModule[]>([]);
  const [currentModule, setCurrentModule] = useState<SystemModule | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user's available modules with fallback
  const fetchUserModules = async (retryCount = 0) => {
    if (!user) {
      setLoading(false);
      return;
    }

    const maxRetries = 2;

    try {
      console.log(`🔧 Fetching modules for user (attempt ${retryCount + 1}/${maxRetries + 1})`);
      
      const { data, error } = await supabase.rpc('get_user_modules', {
        _user_id: user.id
      });

      if (error) throw error;

      const modules: SystemModule[] = data?.map((item: any) => ({
        id: item.module_id,
        name: item.name,
        slug: item.slug,
        description: item.description,
        icon: item.icon
      })) || [];

      console.log('🔧 Modules fetched:', modules);
      setAvailableModules(modules);

      // Set current module based on profile or default to first available
      if (profile?.current_module_id) {
        const current = modules.find(m => m.id === profile.current_module_id);
        setCurrentModule(current || modules[0] || null);
      } else if (modules.length > 0) {
        setCurrentModule(modules[0]);
        // Update profile with default module (only if profile exists)
        if (profile) {
          await switchModule(modules[0].id);
        }
      } else {
        // Fallback: criar módulo padrão se não há módulos
        console.log('🔧 No modules found, using fallback');
        const fallbackModule: SystemModule = {
          id: 'fallback',
          name: 'Strategic Planning',
          slug: 'strategic-planning',
          description: 'Default module',
          icon: 'BarChart3'
        };
        setAvailableModules([fallbackModule]);
        setCurrentModule(fallbackModule);
      }
    } catch (error: any) {
      console.error('Error fetching user modules:', error);
      
      // Retry em caso de erro de permissão
      if (retryCount < maxRetries && error?.message?.includes('permission')) {
        console.log('🔧 Permission error, retrying...');
        setTimeout(() => {
          fetchUserModules(retryCount + 1);
        }, 1000);
        return;
      }
      
      // Fallback final: usar módulo padrão
      console.log('🔧 Using fallback module due to error');
      const fallbackModule: SystemModule = {
        id: 'fallback',
        name: 'Strategic Planning',
        slug: 'strategic-planning',
        description: 'Default module',
        icon: 'BarChart3'
      };
      setAvailableModules([fallbackModule]);
      setCurrentModule(fallbackModule);
      
      toast({
        title: "Módulos limitados",
        description: "Usando funcionalidades básicas. Alguns recursos podem não estar disponíveis.",
        variant: "default"
      });
    } finally {
      setLoading(false);
    }
  };

  // Get compatible companies for module (same logic as CompanySelector)
  const getCompatibleCompanies = async (moduleSlug: string) => {
    if (!fetchCompaniesByType || !fetchAllUserCompanies) return [];
    
    try {
      if (moduleSlug === 'startup-hub') {
        return await fetchCompaniesByType('startup');
      } else if (moduleSlug === 'strategic-planning') {
        // Strategic planning accepts ALL companies (align with CompanySelector)
        return isSystemAdmin ? await fetchAllUserCompanies() : await fetchAllUserCompanies();
      } else {
        return await fetchCompaniesByType('regular');
      }
    } catch (error) {
      console.error('Error fetching compatible companies:', error);
      return [];
    }
  };

  // Switch to a different module
  const switchModule = async (moduleId: string) => {
    if (!user) return;

    // Don't switch if already on the same module
    if (currentModule?.id === moduleId) return;

    console.log('🔧 switchModule called:', { 
      moduleId, 
      currentModuleId: currentModule?.id,
      currentCompany: profile?.company_id 
    });

    try {
      const { error } = await supabase.rpc('switch_user_module', {
        _user_id: user.id,
        _module_id: moduleId
      });

      if (error) throw error;

      const newModule = availableModules.find(m => m.id === moduleId);
      if (newModule) {
        console.log('🔧 Setting new module:', newModule.slug);
        setCurrentModule(newModule);
        
        // Only auto-switch company if:
        // 1. User has no company selected, OR 
        // 2. Current company is not compatible with the new module
        if (switchCompany) {
          const compatibleCompanies = await getCompatibleCompanies(newModule.slug);
          console.log('🔧 Compatible companies:', compatibleCompanies.map(c => ({ id: c.id, name: c.name })));
          
          // Check if current company is compatible
          const currentCompany = profile?.company_id;
          const isCurrentCompanyCompatible = currentCompany && 
            compatibleCompanies.some(comp => comp.id === currentCompany);
          
          console.log('🔧 Company compatibility check:', {
            currentCompany,
            isCurrentCompanyCompatible,
            compatibleCompaniesCount: compatibleCompanies.length
          });
          
          // Only auto-switch if no company selected or current one is incompatible
          if (!currentCompany || !isCurrentCompanyCompatible) {
            if (compatibleCompanies.length > 0) {
              console.log('🔧 Auto-switching company to:', compatibleCompanies[0].name);
              await switchCompany(compatibleCompanies[0].id);
            }
          } else {
            console.log('🔧 Keeping current company - it is compatible');
          }
        }
        
        // Redirecionar para a rota correta do módulo
        if (newModule.slug === 'startup-hub') {
          navigate('/app/startup-hub');
        } else if (newModule.slug === 'strategic-planning') {
          navigate('/app/dashboard');
        }
        
        toast({
          title: "Módulo alterado",
          description: `Você está agora no módulo ${newModule.name}.`
        });
      }
    } catch (error: any) {
      console.error('Error switching module:', error);
      toast({
        title: "Erro ao trocar módulo",
        description: error.message || "Não foi possível trocar de módulo.",
        variant: "destructive"
      });
    }
  };

  // Check if user has access to a specific module
  const hasModuleAccess = (moduleSlug: string) => {
    return availableModules.some(module => module.slug === moduleSlug);
  };

  useEffect(() => {
    if (user) {
      fetchUserModules();
    } else {
      setAvailableModules([]);
      setCurrentModule(null);
      setLoading(false);
    }
  }, [user]);

  return (
    <ModulesContext.Provider value={{
      availableModules,
      currentModule,
      loading,
      switchModule,
      hasModuleAccess
    }}>
      {children}
    </ModulesContext.Provider>
  );
};

export const useModules = () => {
  const context = useContext(ModulesContext);
  if (context === undefined) {
    throw new Error('useModules must be used within a ModulesProvider');
  }
  return context;
};