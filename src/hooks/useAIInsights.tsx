import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useMultiTenant';

export interface AIInsight {
  id: string;
  user_id: string;
  insight_type: 'risk' | 'opportunity' | 'info';
  category: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence_score: number;
  related_entity_type?: string;
  related_entity_id?: string;
  actionable: boolean;
  status: 'active' | 'dismissed' | 'resolved';
  metadata?: any;
  created_at: string;
  updated_at: string;
  confirmed_at?: string;
  confirmed_by?: string;
}

export interface AIRecommendation {
  id: string;
  insight_id?: string;
  title: string;
  description: string;
  action_type: string;
  priority: 'low' | 'medium' | 'high';
  estimated_impact: 'low' | 'medium' | 'high';
  effort_required: 'low' | 'medium' | 'high';
  deadline?: string;
  assigned_to?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  feedback?: string;
  created_at: string;
  updated_at: string;
}

export const useAIInsights = () => {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();
  const { company } = useAuth();

  // Load insights from database
  const loadInsights = useCallback(async () => {
    if (!company?.id) return;
    
    try {
      setLoading(true);
      
      const { data: insightsData, error: insightsError } = await supabase
        .from('ai_insights')
        .select('*')
        .eq('company_id', company.id)
        .order('created_at', { ascending: false });

      if (insightsError) throw insightsError;

      const { data: recommendationsData, error: recommendationsError } = await supabase
        .from('ai_recommendations')
        .select('*')
        .order('created_at', { ascending: false });

      if (recommendationsError) throw recommendationsError;

      setInsights((insightsData || []) as AIInsight[]);
      setRecommendations((recommendationsData || []) as AIRecommendation[]);
    } catch (error) {
      console.error('Error loading insights:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar insights de IA',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast, company?.id]);

  // Generate new insights using the edge function
  const generateInsights = useCallback(async () => {
    if (!company?.id) return;
    
    try {
      setGenerating(true);
      
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error('Usuário não autenticado');
      }

      console.log('Generating insights for user:', userData.user.id, 'company:', company.id);
      
      const { data, error } = await supabase.functions.invoke('generate-insights', {
        body: { 
          user_id: userData.user.id,
          company_id: company.id
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }

      console.log('Insights generation response:', data);

      if (data?.success) {
        toast({
          title: 'Sucesso!',
          description: `${data.insights_generated || 0} insights gerados com sucesso`,
        });

        // Reload insights after generation
        await loadInsights();
      } else {
        throw new Error(data?.error || 'Falha ao gerar insights');
      }
    } catch (error) {
      console.error('Error generating insights:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao gerar insights de IA',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  }, [toast, loadInsights, company?.id]);

  // Update insight status
  const updateInsightStatus = useCallback(async (insightId: string, status: 'dismissed' | 'resolved') => {
    try {
      const { error } = await supabase
        .from('ai_insights')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', insightId);

      if (error) throw error;

      // Update local state
      setInsights(prev => 
        prev.map(insight => 
          insight.id === insightId 
            ? { ...insight, status, updated_at: new Date().toISOString() }
            : insight
        )
      );

      toast({
        title: 'Atualizado',
        description: `Insight ${status === 'dismissed' ? 'descartado' : 'resolvido'} com sucesso`,
      });
    } catch (error) {
      console.error('Error updating insight:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar insight',
        variant: 'destructive',
      });
    }
  }, [toast]);

  // Confirm insight (mark as reviewed by user)
  const confirmInsight = useCallback(async (insightId: string) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('ai_insights')
        .update({ 
          confirmed_at: new Date().toISOString(),
          confirmed_by: userData.user?.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', insightId);

      if (error) throw error;

      // Update local state
      setInsights(prev => 
        prev.map(insight => 
          insight.id === insightId 
            ? { 
                ...insight, 
                confirmed_at: new Date().toISOString(),
                confirmed_by: userData.user?.id,
                updated_at: new Date().toISOString()
              }
            : insight
        )
      );

      toast({
        title: 'Confirmado',
        description: 'Insight confirmado como relevante',
      });
    } catch (error) {
      console.error('Error confirming insight:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao confirmar insight',
        variant: 'destructive',
      });
    }
  }, [toast]);

  // Update recommendation status
  const updateRecommendationStatus = useCallback(async (recommendationId: string, status: AIRecommendation['status']) => {
    try {
      const { error } = await supabase
        .from('ai_recommendations')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', recommendationId);

      if (error) throw error;

      // Update local state
      setRecommendations(prev => 
        prev.map(rec => 
          rec.id === recommendationId 
            ? { ...rec, status, updated_at: new Date().toISOString() }
            : rec
        )
      );

      toast({
        title: 'Atualizado',
        description: 'Status da recomendação atualizado',
      });
    } catch (error) {
      console.error('Error updating recommendation:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar recomendação',
        variant: 'destructive',
      });
    }
  }, [toast]);

  // Get insights by category
  const getInsightsByCategory = useCallback((category: string) => {
    return insights.filter(insight => insight.category === category);
  }, [insights]);

  // Get insights by severity
  const getInsightsBySeverity = useCallback((severity: AIInsight['severity']) => {
    return insights.filter(insight => insight.severity === severity);
  }, [insights]);

  // Get active insights (not dismissed or resolved)
  const getActiveInsights = useCallback(() => {
    return insights.filter(insight => insight.status === 'active');
  }, [insights]);

  // Get critical insights
  const getCriticalInsights = useCallback(() => {
    return insights.filter(insight => 
      insight.status === 'active' && insight.severity === 'critical'
    );
  }, [insights]);

  // Get statistics
  const getInsightsStats = useCallback(() => {
    const activeInsights = getActiveInsights();
    return {
      total: insights.length,
      active: activeInsights.length,
      critical: activeInsights.filter(i => i.severity === 'critical').length,
      high: activeInsights.filter(i => i.severity === 'high').length,
      medium: activeInsights.filter(i => i.severity === 'medium').length,
      low: activeInsights.filter(i => i.severity === 'low').length,
      risks: activeInsights.filter(i => i.insight_type === 'risk').length,
      opportunities: activeInsights.filter(i => i.insight_type === 'opportunity').length,
      info: activeInsights.filter(i => i.insight_type === 'info').length,
    };
  }, [insights, getActiveInsights]);

  // Load insights on mount
  useEffect(() => {
    loadInsights();
  }, [loadInsights]);

  return {
    insights,
    recommendations,
    loading,
    generating,
    generateInsights,
    loadInsights,
    updateInsightStatus,
    confirmInsight,
    updateRecommendationStatus,
    getInsightsByCategory,
    getInsightsBySeverity,
    getActiveInsights,
    getCriticalInsights,
    getInsightsStats,
  };
};