import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface TeamInsight {
  id: string;
  type: 'workload' | 'skills' | 'retention' | 'performance' | 'collaboration';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  recommendation: string;
  confidence: number;
  affected_members: string[];
  impact: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
  created_at: string;
}

export interface TeamMetrics {
  totalMembers: number;
  activeProjects: number;
  overallocatedMembers: number;
  underallocatedMembers: number;
  completedTasks: number;
  overdueTasks: number;
  completionRate: number;
  departmentDistribution: Array<{
    department: string;
    count: number;
    percentage: number;
  }>;
}

export function useTeamInsights() {
  const [insights, setInsights] = useState<TeamInsight[]>([]);
  const [metrics, setMetrics] = useState<TeamMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const generateInsights = async (analysisType: string = 'team_overview') => {
    try {
      setLoading(true);

      // Call the team insights edge function
      const { data, error } = await supabase.functions.invoke('team-insights', {
        body: { analysis_type: analysisType }
      });

      if (error) {
        throw error;
      }

      if (data.success) {
        setInsights(data.insights.insights || []);
        setMetrics(data.team_metrics || null);
        
        toast({
          title: "Insights gerados com sucesso",
          description: `${data.insights.insights?.length || 0} novos insights foram identificados.`,
        });
      } else {
        throw new Error(data.error || 'Erro ao gerar insights');
      }

    } catch (error: any) {
      console.error('Error generating team insights:', error);
      toast({
        title: "Erro ao gerar insights",
        description: error.message || "Não foi possível gerar os insights da equipe.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadInsights = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_insights')
        .select('*')
        .eq('category', 'team_management')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        throw error;
      }

      const formattedInsights: TeamInsight[] = data.map(insight => {
        const metadata = insight.metadata as any || {};
        return {
          id: insight.id,
          type: insight.insight_type as TeamInsight['type'],
          severity: insight.severity as TeamInsight['severity'],
          title: insight.title,
          description: insight.description,
          recommendation: metadata.recommendation || '',
          confidence: insight.confidence_score,
          affected_members: metadata.affected_members || [],
          impact: metadata.impact || 'medium',
          effort: metadata.effort || 'medium',
          created_at: insight.created_at
        };
      });

      setInsights(formattedInsights);

    } catch (error: any) {
      console.error('Error loading insights:', error);
      toast({
        title: "Erro ao carregar insights",
        description: "Não foi possível carregar os insights da equipe.",
        variant: "destructive",
      });
    }
  };

  const dismissInsight = async (insightId: string) => {
    try {
      const { error } = await supabase
        .from('ai_insights')
        .update({ status: 'dismissed' })
        .eq('id', insightId);

      if (error) {
        throw error;
      }

      setInsights(prev => prev.filter(insight => insight.id !== insightId));
      
      toast({
        title: "Insight dispensado",
        description: "O insight foi marcado como dispensado.",
      });

    } catch (error: any) {
      console.error('Error dismissing insight:', error);
      toast({
        title: "Erro",
        description: "Não foi possível dispensar o insight.",
        variant: "destructive",
      });
    }
  };

  const markInsightAsResolved = async (insightId: string) => {
    try {
      const { error } = await supabase
        .from('ai_insights')
        .update({ status: 'resolved' })
        .eq('id', insightId);

      if (error) {
        throw error;
      }

      setInsights(prev => prev.filter(insight => insight.id !== insightId));
      
      toast({
        title: "Insight resolvido",
        description: "O insight foi marcado como resolvido.",
      });

    } catch (error: any) {
      console.error('Error resolving insight:', error);
      toast({
        title: "Erro",
        description: "Não foi possível marcar o insight como resolvido.",
        variant: "destructive",
      });
    }
  };

  const createRecommendation = async (insightId: string, recommendation: any) => {
    try {
      const { error } = await supabase
        .from('ai_recommendations')
        .insert({
          insight_id: insightId,
          title: recommendation.title,
          description: recommendation.description,
          action_type: recommendation.action_type,
          priority: recommendation.priority,
          estimated_impact: recommendation.impact,
          effort_required: recommendation.effort,
          deadline: recommendation.deadline
        });

      if (error) {
        throw error;
      }

      toast({
        title: "Recomendação criada",
        description: "Uma nova recomendação foi adicionada ao sistema.",
      });

    } catch (error: any) {
      console.error('Error creating recommendation:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar a recomendação.",
        variant: "destructive",
      });
    }
  };

  // Load insights on mount
  useEffect(() => {
    loadInsights();
  }, []);

  return {
    insights,
    metrics,
    loading,
    generateInsights,
    loadInsights,
    dismissInsight,
    markInsightAsResolved,
    createRecommendation
  };
}