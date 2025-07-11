import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalysisResult {
  projects: any[];
  indicators: any[];
  objectives: any[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { user_id } = await req.json();

    if (!user_id) {
      throw new Error('User ID is required');
    }

    // Get user data using the database function
    const { data: analysisData, error: analysisError } = await supabaseClient
      .rpc('analyze_user_data', { target_user_id: user_id });

    if (analysisError) {
      throw analysisError;
    }

    const analysis: AnalysisResult = analysisData;
    const insights = [];

    // Analyze projects for risks and opportunities
    if (analysis.projects && analysis.projects.length > 0) {
      for (const project of analysis.projects) {
        const progress = project.progress || 0;
        const startDate = project.start_date ? new Date(project.start_date) : null;
        const endDate = project.end_date ? new Date(project.end_date) : null;
        const now = new Date();

        // Risk analysis for delayed projects
        if (endDate && endDate < now && project.status !== 'completed') {
          insights.push({
            insight_type: 'risk',
            category: 'projects',
            title: `Projeto "${project.name}" em Atraso`,
            description: `O projeto "${project.name}" ultrapassou o prazo previsto (${endDate.toLocaleDateString('pt-BR')}) e ainda não foi concluído. Status atual: ${project.status}. Progresso: ${progress}%.`,
            severity: 'high',
            confidence_score: 0.95,
            related_entity_type: 'project',
            related_entity_id: project.id,
            actionable: true,
            metadata: {
              project_name: project.name,
              original_end_date: project.end_date,
              current_progress: progress,
              status: project.status,
              days_overdue: Math.ceil((now.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24))
            }
          });
        }

        // Risk analysis for projects with low progress near deadline
        if (endDate && progress < 50) {
          const daysUntilDeadline = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          if (daysUntilDeadline <= 30 && daysUntilDeadline > 0) {
            insights.push({
              insight_type: 'risk',
              category: 'projects',
              title: `Projeto "${project.name}" com Risco de Atraso`,
              description: `O projeto "${project.name}" tem apenas ${daysUntilDeadline} dias até o prazo e está com ${progress}% de progresso. Há risco significativo de não ser concluído a tempo.`,
              severity: progress < 30 ? 'critical' : 'high',
              confidence_score: 0.85,
              related_entity_type: 'project',
              related_entity_id: project.id,
              actionable: true,
              metadata: {
                project_name: project.name,
                days_until_deadline: daysUntilDeadline,
                current_progress: progress,
                status: project.status
              }
            });
          }
        }

        // Opportunity analysis for projects ahead of schedule
        if (progress > 80 && endDate) {
          const daysUntilDeadline = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          if (daysUntilDeadline > 15) {
            insights.push({
              insight_type: 'opportunity',
              category: 'projects',
              title: `Projeto "${project.name}" Adiantado`,
              description: `O projeto "${project.name}" está ${progress}% concluído com ${daysUntilDeadline} dias restantes até o prazo. Há oportunidade de entregar antecipadamente ou alocar recursos para outros projetos.`,
              severity: 'low',
              confidence_score: 0.80,
              related_entity_type: 'project',
              related_entity_id: project.id,
              actionable: true,
              metadata: {
                project_name: project.name,
                days_until_deadline: daysUntilDeadline,
                current_progress: progress,
                potential_early_delivery: true
              }
            });
          }
        }
      }
    }

    // Analyze indicators for performance insights
    if (analysis.indicators && analysis.indicators.length > 0) {
      for (const indicator of analysis.indicators) {
        const currentValue = indicator.current_value || 0;
        const targetValue = indicator.target_value || 0;
        const achievement = targetValue > 0 ? (currentValue / targetValue) * 100 : 0;

        // Performance alerts
        if (achievement < 70) {
          insights.push({
            insight_type: 'risk',
            category: 'indicators',
            title: `Indicador "${indicator.name}" Abaixo da Meta`,
            description: `O indicador "${indicator.name}" está com ${achievement.toFixed(1)}% de atingimento da meta. Valor atual: ${currentValue} ${indicator.unit}, Meta: ${targetValue} ${indicator.unit}.`,
            severity: achievement < 50 ? 'critical' : 'high',
            confidence_score: 0.90,
            related_entity_type: 'indicator',
            related_entity_id: indicator.id,
            actionable: true,
            metadata: {
              indicator_name: indicator.name,
              current_value: currentValue,
              target_value: targetValue,
              achievement_percentage: achievement,
              unit: indicator.unit,
              category: indicator.category
            }
          });
        }

        // Opportunity alerts
        if (achievement > 120) {
          insights.push({
            insight_type: 'opportunity',
            category: 'indicators',
            title: `Indicador "${indicator.name}" Superando Expectativas`,
            description: `O indicador "${indicator.name}" está ${achievement.toFixed(1)}% acima da meta! Valor atual: ${currentValue} ${indicator.unit}, Meta: ${targetValue} ${indicator.unit}. Considere ajustar metas ou identificar boas práticas.`,
            severity: 'low',
            confidence_score: 0.95,
            related_entity_type: 'indicator',
            related_entity_id: indicator.id,
            actionable: true,
            metadata: {
              indicator_name: indicator.name,
              current_value: currentValue,
              target_value: targetValue,
              achievement_percentage: achievement,
              unit: indicator.unit,
              category: indicator.category,
              overperformance: true
            }
          });
        }
      }
    }

    // Analyze objectives for progress insights
    if (analysis.objectives && analysis.objectives.length > 0) {
      for (const objective of analysis.objectives) {
        const progress = objective.progress || 0;
        const targetDate = objective.target_date ? new Date(objective.target_date) : null;
        const now = new Date();

        if (targetDate && progress < 75) {
          const daysUntilTarget = Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          if (daysUntilTarget <= 60 && daysUntilTarget > 0) {
            insights.push({
              insight_type: 'risk',
              category: 'objectives',
              title: `Objetivo "${objective.title}" em Risco`,
              description: `O objetivo "${objective.title}" tem ${progress}% de progresso com ${daysUntilTarget} dias restantes até a meta. Ação urgente pode ser necessária.`,
              severity: progress < 50 ? 'critical' : 'high',
              confidence_score: 0.85,
              related_entity_type: 'objective',
              related_entity_id: objective.id,
              actionable: true,
              metadata: {
                objective_title: objective.title,
                current_progress: progress,
                days_until_target: daysUntilTarget,
                status: objective.status
              }
            });
          }
        }
      }
    }

    // Insert insights into database
    for (const insight of insights) {
      await supabaseClient
        .from('ai_insights')
        .insert([{
          ...insight,
          user_id: user_id,
          status: 'active'
        }]);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        insights_generated: insights.length,
        insights: insights 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating insights:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});