import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export interface SystemModule {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ModuleDataCount {
  moduleSlug: string;
  counts: {
    [key: string]: number;
  };
  hasData: boolean;
}

export const useSystemModules = () => {
  const [modules, setModules] = useState<SystemModule[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadModules = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('system_modules')
        .select('*')
        .eq('active', true)
        .order('name');

      if (error) throw error;

      setModules(data || []);
    } catch (error) {
      console.error('Error loading system modules:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os módulos do sistema.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadModules();
  }, []);

  const getModuleDataCount = async (companyId: string, moduleSlug: string): Promise<ModuleDataCount> => {
    const counts: { [key: string]: number } = {};

    try {
      // Verificar dados baseado no módulo
      if (moduleSlug === 'okr-execution') {
        // Contar OKRs
        const { count: yearsCount } = await supabase
          .from('okr_years')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', companyId);

        const { count: objectivesCount } = await supabase
          .from('okr_objectives')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', companyId);

        const { count: keyResultsCount } = await supabase
          .from('okr_key_results')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', companyId);

        const { count: initiativesCount } = await supabase
          .from('okr_initiatives')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', companyId);

        counts['Anos OKR'] = yearsCount || 0;
        counts['Objetivos'] = objectivesCount || 0;
        counts['Key Results'] = keyResultsCount || 0;
        counts['Iniciativas'] = initiativesCount || 0;
      } else if (moduleSlug === 'ai') {
        // Contar dados de IA
        const { count: insightsCount } = await supabase
          .from('ai_insights')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', companyId);

        const { count: sessionsCount } = await supabase
          .from('ai_chat_sessions')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', companyId);

        counts['Insights'] = insightsCount || 0;
        counts['Sessões de Chat'] = sessionsCount || 0;
      }

      const hasData = Object.values(counts).some(count => count > 0);

      return {
        moduleSlug,
        counts,
        hasData
      };
    } catch (error) {
      console.error(`Error counting data for module ${moduleSlug}:`, error);
      return {
        moduleSlug,
        counts: {},
        hasData: false
      };
    }
  };

  return {
    modules,
    loading,
    loadModules,
    getModuleDataCount
  };
};
