import { useModules } from './useModules';

export const useDefaultRoute = () => {
  const { availableModules, loading, currentModule } = useModules();

  const getDefaultRoute = (): string => {
    // Se ainda está carregando, retorna rota genérica
    if (loading) {
      return '/app/dashboard';
    }

    // Se já tem um módulo atual definido, usa a rota dele
    if (currentModule) {
      if (currentModule.slug === 'startup-hub') {
        return '/app/startup-hub';
      } else if (currentModule.slug === 'strategic-planning') {
        return '/app/dashboard';
      }
    }

    // Se não tem módulo atual, usa o primeiro módulo disponível
    if (availableModules.length > 0) {
      const firstModule = availableModules[0];
      
      if (firstModule.slug === 'startup-hub') {
        return '/app/startup-hub';
      } else if (firstModule.slug === 'strategic-planning') {
        return '/app/dashboard';
      }
    }

    // Fallback para dashboard (caso não haja módulos)
    return '/app/dashboard';
  };

  return { getDefaultRoute, loading };
};
