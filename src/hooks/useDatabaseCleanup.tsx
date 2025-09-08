import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface CleanupCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  dangerous: boolean;
  supportsFilters: {
    company: boolean;
    user: boolean;
    date: boolean;
  };
}

export interface CleanupRequest {
  category: string;
  companyId?: string;
  userId?: string;
  beforeDate?: string;
  notes?: string;
}

export interface CleanupResult {
  success: boolean;
  message: string;
  results: Record<string, number>;
  error?: string;
}

export interface CleanupStats {
  category: string;
  totalRecords: number;
  loading: boolean;
}

export const useDatabaseCleanup = () => {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<CleanupStats[]>([]);
  const [companies, setCompanies] = useState<Array<{ id: string; name: string }>>([]);
  const [users, setUsers] = useState<Array<{ id: string; name: string; email: string }>>([]);
  const { toast } = useToast();

  const categories: CleanupCategory[] = [
    {
      id: 'mentoring',
      name: 'Dados de Mentoria',
      description: 'Sessões de mentoria, relações mentor-startup e itens de ação',
      icon: 'Users',
      dangerous: false,
      supportsFilters: { company: true, user: false, date: true }
    },
    {
      id: 'strategic',
      name: 'Planejamento Estratégico',
      description: 'Planos estratégicos, pilares, objetivos e projetos',
      icon: 'Target',
      dangerous: true,
      supportsFilters: { company: true, user: false, date: false }
    },
    {
      id: 'metrics',
      name: 'Métricas e KRs',
      description: 'Resultados-chave, valores históricos e métricas',
      icon: 'BarChart3',
      dangerous: true,
      supportsFilters: { company: true, user: false, date: false }
    },
    {
      id: 'analyses',
      name: 'Análises Estratégicas',
      description: 'Golden Circle, análises SWOT e seus históricos',
      icon: 'Brain',
      dangerous: false,
      supportsFilters: { company: true, user: false, date: false }
    },
    {
      id: 'beep',
      name: 'Assessments BEEP',
      description: 'Avaliações BEEP e respostas dos assessments',
      icon: 'ClipboardCheck',
      dangerous: false,
      supportsFilters: { company: true, user: false, date: false }
    },
    {
      id: 'ai',
      name: 'IA e Analytics',
      description: 'Sessões de chat, insights, recomendações e dados analíticos',
      icon: 'Bot',
      dangerous: false,
      supportsFilters: { company: false, user: true, date: false }
    },
    {
      id: 'performance',
      name: 'Avaliações de Performance',
      description: 'Avaliações de desempenho e feedback',
      icon: 'Award',
      dangerous: false,
      supportsFilters: { company: false, user: true, date: false }
    }
  ];

  const loadCompanies = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setCompanies(data || []);
    } catch (error) {
      console.error('Error loading companies:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar empresas',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const loadUsers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, email')
        .eq('status', 'active')
        .order('first_name');

      if (error) throw error;
      
      const formattedUsers = data?.map(user => ({
        id: user.user_id,
        name: `${user.first_name} ${user.last_name}`,
        email: user.email
      })) || [];
      
      setUsers(formattedUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar usuários',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const getRecordCount = useCallback(async (category: string, filters?: Partial<CleanupRequest>) => {
    try {
      let count = 0;
      
      switch (category) {
        case 'mentoring': {
          const { count: sessionsCount, error } = await supabase
            .from('mentoring_sessions')
            .select('*', { count: 'exact', head: true })
            .eq(filters?.companyId ? 'startup_company_id' : 'id', filters?.companyId || 'any');
          
          if (error && !filters?.companyId) {
            const { count: allCount } = await supabase
              .from('mentoring_sessions')
              .select('*', { count: 'exact', head: true });
            count = allCount || 0;
          } else {
            count = sessionsCount || 0;
          }
          break;
        }
        
        case 'strategic': {
          const query = supabase
            .from('strategic_plans')
            .select('*', { count: 'exact', head: true });
          
          if (filters?.companyId) {
            query.eq('company_id', filters.companyId);
          }
          
          const { count: plansCount } = await query;
          count = plansCount || 0;
          break;
        }
        
        case 'metrics': {
          const { count: resultsCount } = await supabase
            .from('key_results')
            .select('*', { count: 'exact', head: true });
          count = resultsCount || 0;
          break;
        }
        
        case 'analyses': {
          const { count: gcCount } = await supabase
            .from('golden_circle')
            .select('*', { count: 'exact', head: true });
          count = gcCount || 0;
          break;
        }
        
        case 'beep': {
          const { count: assessmentsCount } = await supabase
            .from('beep_assessments')
            .select('*', { count: 'exact', head: true });
          count = assessmentsCount || 0;
          break;
        }
        
        case 'ai': {
          const query = supabase
            .from('ai_chat_sessions')
            .select('*', { count: 'exact', head: true });
          
          if (filters?.userId) {
            query.eq('user_id', filters.userId);
          }
          
          const { count: sessionsCount } = await query;
          count = sessionsCount || 0;
          break;
        }
        
        case 'performance': {
          const query = supabase
            .from('performance_reviews')
            .select('*', { count: 'exact', head: true });
          
          if (filters?.userId) {
            query.or(`user_id.eq.${filters.userId},reviewer_id.eq.${filters.userId}`);
          }
          
          const { count: reviewsCount } = await query;
          count = reviewsCount || 0;
          break;
        }
      }
      
      return count;
    } catch (error) {
      console.error(`Error getting ${category} record count:`, error);
      return 0;
    }
  }, []);

  const loadStats = useCallback(async () => {
    const newStats: CleanupStats[] = [];
    
    for (const category of categories) {
      newStats.push({
        category: category.id,
        totalRecords: 0,
        loading: true
      });
    }
    
    setStats(newStats);
    
    // Load counts for each category
    for (let i = 0; i < categories.length; i++) {
      const category = categories[i];
      const count = await getRecordCount(category.id);
      
      setStats(prev => prev.map(stat => 
        stat.category === category.id 
          ? { ...stat, totalRecords: count, loading: false }
          : stat
      ));
    }
  }, [categories, getRecordCount]);

  const executeCleanup = useCallback(async (request: CleanupRequest): Promise<CleanupResult> => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('database-cleanup', {
        body: request
      });

      if (error) throw error;

      const result = data as CleanupResult;
      
      if (result.success) {
        toast({
          title: 'Limpeza Concluída',
          description: result.message,
        });
        
        // Reload stats after successful cleanup
        await loadStats();
      } else {
        throw new Error(result.error || 'Falha na limpeza');
      }
      
      return result;
    } catch (error) {
      console.error('Cleanup error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      toast({
        title: 'Erro na Limpeza',
        description: errorMessage,
        variant: 'destructive',
      });
      
      return {
        success: false,
        message: 'Falha na operação de limpeza',
        results: {},
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  }, [toast, loadStats]);

  const getCleanupLogs = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('database_cleanup_logs')
        .select('*')
        .order('executed_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error loading cleanup logs:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar logs de limpeza',
        variant: 'destructive',
      });
      return [];
    }
  }, [toast]);

  return {
    categories,
    loading,
    stats,
    companies,
    users,
    loadCompanies,
    loadUsers,
    loadStats,
    getRecordCount,
    executeCleanup,
    getCleanupLogs,
  };
};