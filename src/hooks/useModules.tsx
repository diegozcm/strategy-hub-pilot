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
  const { user, profile, switchCompany, fetchCompaniesByType } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [availableModules, setAvailableModules] = useState<SystemModule[]>([]);
  const [currentModule, setCurrentModule] = useState<SystemModule | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user's available modules
  const fetchUserModules = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.rpc('get_user_modules', {
        _user_id: user.id
      });

      if (error) throw error;

      const modules: SystemModule[] = data.map((item: any) => ({
        id: item.module_id,
        name: item.name,
        slug: item.slug,
        description: item.description,
        icon: item.icon
      }));

      setAvailableModules(modules);

      // Set current module based on profile or default to first available
      if (profile?.current_module_id) {
        const current = modules.find(m => m.id === profile.current_module_id);
        setCurrentModule(current || modules[0] || null);
      } else if (modules.length > 0) {
        setCurrentModule(modules[0]);
        // Update profile with default module
        await switchModule(modules[0].id);
      }
    } catch (error) {
      console.error('Error fetching user modules:', error);
      toast({
        title: "Erro ao carregar módulos",
        description: "Não foi possível carregar seus módulos disponíveis.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Get company type for module
  const getCompanyTypeForModule = (moduleSlug: string): 'startup' | 'regular' => {
    return moduleSlug === 'startup-hub' ? 'startup' : 'regular';
  };

  // Switch to a different module
  const switchModule = async (moduleId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase.rpc('switch_user_module', {
        _user_id: user.id,
        _module_id: moduleId
      });

      if (error) throw error;

      const newModule = availableModules.find(m => m.id === moduleId);
      if (newModule) {
        setCurrentModule(newModule);
        
        // Auto-switch company based on module type
        if (switchCompany && fetchCompaniesByType) {
          const requiredCompanyType = getCompanyTypeForModule(newModule.slug);
          const compatibleCompanies = await fetchCompaniesByType(requiredCompanyType);
          
          if (compatibleCompanies.length > 0) {
            // Switch to the first compatible company
            await switchCompany(compatibleCompanies[0].id);
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
  }, [user, profile?.current_module_id]);

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