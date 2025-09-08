import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useMultiTenant';
import { useToast } from '@/hooks/use-toast';

export interface UserRelations {
  user_id: string;
  ownership: {
    companies: Array<{ id: string; name: string; type: string }>;
    strategic_projects: number;
    strategic_objectives: number;
    key_results: number;
  };
  participation: {
    company_relations: Array<{ company_id: string; role: string }>;
    project_members: number;
    user_modules: Array<{ module_id: string; active: boolean }>;
  };
  creation: {
    golden_circle: number;
    swot_analysis: number;
    system_settings: number;
  };
  assignment: {
    action_items: number;
    ai_recommendations: number;
    performance_reviews_as_reviewer: number;
    performance_reviews_as_reviewee: number;
  };
  mentoring: {
    mentor_sessions_historical: number;
    mentor_sessions_active: number;
    startup_relations: Array<{ startup_company_id: string; status: string }>;
    startup_hub_profile: { type: string; status: string } | null;
  };
  analyzed_at: string;
}

export interface CompatibleUser {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  compatibility_score: number;
  compatibility_details: {
    has_same_role: boolean;
    compatible_modules: string[] | null;
    shared_companies: string[] | null;
    startup_profile_match: string | null;
  };
}

export interface DeletionResult {
  success: boolean;
  deleted_user?: string;
  replacement_user?: string;
  admin_user?: string;
  operations_log?: string[];
  completed_at?: string;
  error?: string;
  operations_completed?: string[];
  failed_at?: string;
}

// Função para sanitizar e converter tipos de dados vindos do JSON
const sanitizeUserRelations = (data: any): UserRelations => {
  const parseNumber = (value: any): number => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = parseInt(value, 10);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  };

  const parseArray = (value: any): any[] => {
    if (Array.isArray(value)) return value;
    return [];
  };

  return {
    user_id: data.user_id || '',
    ownership: {
      companies: parseArray(data.ownership?.companies),
      strategic_projects: parseNumber(data.ownership?.strategic_projects),
      strategic_objectives: parseNumber(data.ownership?.strategic_objectives), 
      key_results: parseNumber(data.ownership?.key_results),
    },
    participation: {
      company_relations: parseArray(data.participation?.company_relations),
      project_members: parseNumber(data.participation?.project_members),
      user_modules: parseArray(data.participation?.user_modules),
    },
    creation: {
      golden_circle: parseNumber(data.creation?.golden_circle),
      swot_analysis: parseNumber(data.creation?.swot_analysis),
      system_settings: parseNumber(data.creation?.system_settings),
    },
    assignment: {
      action_items: parseNumber(data.assignment?.action_items),
      ai_recommendations: parseNumber(data.assignment?.ai_recommendations),
      performance_reviews_as_reviewer: parseNumber(data.assignment?.performance_reviews_as_reviewer),
      performance_reviews_as_reviewee: parseNumber(data.assignment?.performance_reviews_as_reviewee),
    },
    mentoring: {
      mentor_sessions_historical: parseNumber(data.mentoring?.mentor_sessions_historical),
      mentor_sessions_active: parseNumber(data.mentoring?.mentor_sessions_active),
      startup_relations: parseArray(data.mentoring?.startup_relations),
      startup_hub_profile: data.mentoring?.startup_hub_profile || null,
    },
    analyzed_at: data.analyzed_at || '',
  };
};

export const useUserDeletion = () => {
  const [loading, setLoading] = useState(false);
  const [userRelations, setUserRelations] = useState<UserRelations | null>(null);
  const [compatibleUsers, setCompatibleUsers] = useState<CompatibleUser[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  const analyzeUserRelations = useCallback(async (userId: string) => {
    if (!user) return null;

    try {
      setLoading(true);
      console.log('🔍 Analisando relações do usuário:', userId);
      
      const { data, error } = await supabase.rpc('analyze_user_relations', {
        _user_id: userId
      });

      if (error) {
        console.error('❌ Erro ao analisar relações do usuário:', error);
        toast({
          title: "Erro",
          description: "Não foi possível analisar as relações do usuário: " + error.message,
          variant: "destructive",
        });
        return null;
      }

      console.log('✅ Relações analisadas:', data);
      
      if (!data) {
        console.warn('⚠️ Nenhuma relação encontrada para o usuário');
        return null;
      }

      const sanitizedRelations = sanitizeUserRelations(data);
      setUserRelations(sanitizedRelations);
      return sanitizedRelations;
    } catch (error) {
      console.error('❌ Erro inesperado ao analisar relações:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao analisar relações do usuário",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  const findCompatibleUsers = useCallback(async (userId: string) => {
    if (!user) return [];

    try {
      setLoading(true);
      console.log('🔍 Buscando usuários compatíveis para:', userId);
      
      const { data, error } = await supabase.rpc('find_compatible_replacement_users', {
        _user_id: userId,
        _admin_id: user.id
      });

      if (error) {
        console.error('❌ Erro ao buscar usuários compatíveis:', error);
        toast({
          title: "Erro",
          description: "Não foi possível encontrar usuários compatíveis: " + error.message,
          variant: "destructive",
        });
        return [];
      }

      console.log('📊 Dados retornados da função:', data);

      if (!data || !Array.isArray(data)) {
        console.warn('⚠️ Nenhum dado válido retornado da função');
        toast({
          title: "Aviso",
          description: "Nenhum usuário compatível foi encontrado. Você pode excluir o usuário sem substituição se necessário.",
          variant: "default",
        });
        setCompatibleUsers([]);
        return [];
      }

      if (data.length === 0) {
        console.warn('⚠️ Array vazio - nenhum usuário compatível encontrado');
        toast({
          title: "Aviso",
          description: "Nenhum usuário compatível foi encontrado. Você pode excluir o usuário sem substituição se necessário.",
          variant: "default",
        });
        setCompatibleUsers([]);
        return [];
      }

      // Process and validate each user
      const processedUsers = data.map((user: any) => {
        console.log('🔄 Processando usuário:', user);
        
        return {
          user_id: user.user_id,
          first_name: user.first_name || '',
          last_name: user.last_name || '',
          email: user.email || '',
          role: user.role,
          compatibility_score: user.compatibility_score || 0,
          compatibility_details: user.compatibility_details || {}
        };
      }) as CompatibleUser[];

      console.log(`✅ ${processedUsers.length} usuários compatíveis processados:`, processedUsers);
      setCompatibleUsers(processedUsers);
      return processedUsers;
      
    } catch (error) {
      console.error('❌ Erro inesperado ao buscar usuários compatíveis:', error);
      toast({
        title: "Erro", 
        description: "Erro inesperado ao buscar usuários compatíveis",
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  const deleteUserWithReplacement = useCallback(async (
    userId: string, 
    replacementUserId: string
  ): Promise<DeletionResult | null> => {
    if (!user) return null;

    try {
      setLoading(true);
      
      const { data, error } = await supabase.rpc('safe_delete_user_with_replacement', {
        _user_id: userId,
        _replacement_user_id: replacementUserId,
        _admin_id: user.id
      });

      if (error) {
        console.error('Error deleting user:', error);
        toast({
          title: "Erro",
          description: "Não foi possível excluir o usuário: " + error.message,
          variant: "destructive",
        });
        return { success: false, error: error.message };
      }

      const result = data as unknown as DeletionResult;
      
      if (result.success) {
        toast({
          title: "Sucesso",
          description: `Usuário ${result.deleted_user} excluído com sucesso. Dados transferidos para ${result.replacement_user}.`,
          variant: "default",
        });
      } else {
        toast({
          title: "Erro na Exclusão",
          description: result.error || "Erro desconhecido durante a exclusão",
          variant: "destructive",
        });
      }

      return result;
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao excluir usuário",
        variant: "destructive",
      });
      return { success: false, error: "Erro inesperado" };
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  const getTotalRelationsCount = useCallback((relations: UserRelations | null): number => {
    if (!relations) return 0;
    
    // Garantir que todos os valores sejam números válidos
    const parseNum = (val: any): number => {
      const num = Number(val);
      return isNaN(num) ? 0 : num;
    };
    
    const ownership = (relations.ownership.companies?.length ?? 0) +
                     parseNum(relations.ownership.strategic_projects) +
                     parseNum(relations.ownership.strategic_objectives) +
                     parseNum(relations.ownership.key_results);

    const participation = (relations.participation.company_relations?.length ?? 0) +
                         parseNum(relations.participation.project_members) +
                         (relations.participation.user_modules?.length ?? 0);

    const assignment = parseNum(relations.assignment.action_items) +
                      parseNum(relations.assignment.ai_recommendations) +
                      parseNum(relations.assignment.performance_reviews_as_reviewer) +
                      parseNum(relations.assignment.performance_reviews_as_reviewee);

    const mentoring = parseNum(relations.mentoring.mentor_sessions_historical) +
                     parseNum(relations.mentoring.mentor_sessions_active) +
                     (relations.mentoring.startup_relations?.length ?? 0);

    return ownership + participation + assignment + mentoring;
  }, []);

  const getCriticalRelationsCount = useCallback((relations: UserRelations | null): number => {
    if (!relations) return 0;
    
    // Garantir que todos os valores sejam números válidos
    const parseNum = (val: any): number => {
      const num = Number(val);
      return isNaN(num) ? 0 : num;
    };
    
    return (relations.ownership.companies?.length ?? 0) +
           parseNum(relations.mentoring.mentor_sessions_active) +
           parseNum(relations.assignment.action_items);
  }, []);

  return {
    loading,
    userRelations,
    compatibleUsers,
    analyzeUserRelations,
    findCompatibleUsers,
    deleteUserWithReplacement,
    getTotalRelationsCount,
    getCriticalRelationsCount,
    setUserRelations,
    setCompatibleUsers
  };
};