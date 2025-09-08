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
      
      const { data, error } = await supabase.rpc('analyze_user_relations', {
        _user_id: userId
      });

      if (error) {
        console.error('Error analyzing user relations:', error);
        toast({
          title: "Erro",
          description: "Não foi possível analisar as relações do usuário: " + error.message,
          variant: "destructive",
        });
        return null;
      }

      const relations = data as unknown as UserRelations;
      setUserRelations(relations);
      return relations;
    } catch (error) {
      console.error('Error analyzing user relations:', error);
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
      
      const { data, error } = await supabase.rpc('find_compatible_replacement_users', {
        _user_id: userId,
        _admin_id: user.id
      });

      if (error) {
        console.error('Error finding compatible users:', error);
        toast({
          title: "Erro",
          description: "Não foi possível encontrar usuários compatíveis: " + error.message,
          variant: "destructive",
        });
        return [];
      }

      const users = (data || []) as unknown as CompatibleUser[];
      setCompatibleUsers(users);
      return users;
    } catch (error) {
      console.error('Error finding compatible users:', error);
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
    
    const ownership = (relations.ownership.companies?.length || 0) +
                     (relations.ownership.strategic_projects || 0) +
                     (relations.ownership.strategic_objectives || 0) +
                     (relations.ownership.key_results || 0);

    const participation = (relations.participation.company_relations?.length || 0) +
                         (relations.participation.project_members || 0) +
                         (relations.participation.user_modules?.length || 0);

    const assignment = (relations.assignment.action_items || 0) +
                      (relations.assignment.ai_recommendations || 0) +
                      (relations.assignment.performance_reviews_as_reviewer || 0) +
                      (relations.assignment.performance_reviews_as_reviewee || 0);

    const mentoring = (relations.mentoring.mentor_sessions_historical || 0) +
                     (relations.mentoring.mentor_sessions_active || 0) +
                     (relations.mentoring.startup_relations?.length || 0);

    return ownership + participation + assignment + mentoring;
  }, []);

  const getCriticalRelationsCount = useCallback((relations: UserRelations | null): number => {
    if (!relations) return 0;
    
    return (relations.ownership.companies?.length || 0) +
           (relations.mentoring.mentor_sessions_active || 0) +
           (relations.assignment.action_items || 0);
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