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

    const openAIKey = Deno.env.get('OPENAI_API_KEY');

    const { user_id, company_id } = await req.json();

    if (!user_id || !company_id) {
      throw new Error('User ID and Company ID are required');
    }

    console.log(`Generating insights for user: ${user_id}`);

    // Get user data using the database function
    const { data: analysisData, error: analysisError } = await supabaseClient
      .rpc('analyze_user_data', { target_user_id: user_id });

    if (analysisError) {
      console.error('Analysis error:', analysisError);
      throw analysisError;
    }

    const analysis: AnalysisResult = analysisData;
    console.log('Analysis data:', analysis);

    const insights = [];
    const aiRecommendations = [];

    // Enhanced analysis with AI integration
    if (openAIKey && (analysis.projects?.length > 0 || analysis.indicators?.length > 0 || analysis.objectives?.length > 0)) {
      try {
        // Prepare data for OpenAI analysis
        const contextData = {
          projects: analysis.projects?.map(p => ({
            name: p.name,
            progress: p.progress,
            status: p.status,
            start_date: p.start_date,
            end_date: p.end_date,
            budget: p.budget,
            priority: p.priority
          })) || [],
          keyResults: analysis.indicators?.map(kr => ({
            name: kr.name,
            current: kr.current_value,
            target: kr.target_value,
            unit: kr.unit,
            due_date: kr.due_date,
            priority: kr.priority
          })) || [],
          objectives: analysis.objectives?.map(o => ({
            title: o.title,
            progress: o.progress,
            status: o.status,
            target_date: o.target_date
          })) || []
        };

        const prompt = `Analise os seguintes dados de uma empresa e gere insights estratégicos em português:

PROJETOS: ${JSON.stringify(contextData.projects, null, 2)}
RESULTADOS-CHAVE: ${JSON.stringify(contextData.keyResults, null, 2)}
OBJETIVOS: ${JSON.stringify(contextData.objectives, null, 2)}

Para cada insight, forneça:
1. Tipo (risk/opportunity/info)
2. Categoria (projects/indicators/objectives/strategic)
3. Título conciso
4. Descrição detalhada
5. Severidade (low/medium/high/critical)
6. Ações recomendadas específicas
7. Prioridade das ações (low/medium/high)
8. Impacto estimado (low/medium/high)

Formato JSON: {"insights": [{"type": "", "category": "", "title": "", "description": "", "severity": "", "recommendations": []}]}

Foque em:
- Projetos atrasados ou em risco
- Metas não atingidas ou super executadas  
- Tendências preocupantes ou positivas
- Oportunidades de melhoria
- Gargalos e dependências críticas`;

        const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4.1-2025-04-14',
            messages: [
              {
                role: 'system',
                content: 'Você é um consultor estratégico especializado em análise de dados empresariais. Forneça insights práticos e acionáveis.'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            max_completion_tokens: 2000
          }),
        });

        if (openAIResponse.ok) {
          const aiResult = await openAIResponse.json();
          const aiContent = aiResult.choices[0]?.message?.content;
          
          try {
            const parsedAI = JSON.parse(aiContent);
            if (parsedAI.insights) {
              for (const aiInsight of parsedAI.insights) {
                insights.push({
                  insight_type: aiInsight.type || 'info',
                  category: aiInsight.category || 'strategic',
                  title: aiInsight.title,
                  description: aiInsight.description,
                  severity: aiInsight.severity || 'medium',
                  confidence_score: 0.85,
                  related_entity_type: aiInsight.category === 'projects' ? 'project' : 
                                     aiInsight.category === 'indicators' ? 'key_result' : 'objective',
                  actionable: true,
                  metadata: {
                    source: 'ai_analysis',
                    recommendations: aiInsight.recommendations || [],
                    ai_generated: true
                  }
                });

                // Create recommendations for each insight
                if (aiInsight.recommendations && Array.isArray(aiInsight.recommendations)) {
                  aiInsight.recommendations.forEach((rec: any) => {
                    aiRecommendations.push({
                      title: typeof rec === 'string' ? rec : rec.title || rec.action,
                      description: typeof rec === 'string' ? rec : rec.description,
                      action_type: 'improvement',
                      priority: rec.priority || 'medium',
                      estimated_impact: rec.impact || 'medium',
                      effort_required: rec.effort || 'medium',
                      status: 'pending'
                    });
                  });
                }
              }
            }
          } catch (parseError) {
            console.log('AI response was not valid JSON, using fallback analysis');
          }
        }
      } catch (aiError) {
        console.log('AI analysis failed, continuing with rule-based analysis:', aiError);
      }
    }

    // Enhanced rule-based analysis (improved from original)
    console.log('Starting rule-based analysis...');
    console.log(`Projects: ${analysis.projects?.length || 0}, Indicators: ${analysis.indicators?.length || 0}, Objectives: ${analysis.objectives?.length || 0}`);
    
    if (analysis.projects && analysis.projects.length > 0) {
      console.log('Analyzing projects...');
      for (const project of analysis.projects) {
        const progress = project.progress || 0;
        const startDate = project.start_date ? new Date(project.start_date) : null;
        const endDate = project.end_date ? new Date(project.end_date) : null;
        const now = new Date();
        
        console.log(`Project: ${project.name}, Progress: ${progress}%, Status: ${project.status}`);

        // Critical: Overdue projects
        if (endDate && endDate < now && project.status !== 'completed') {
          const daysOverdue = Math.ceil((now.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24));
          insights.push({
            insight_type: 'risk',
            category: 'projects',
            title: `Projeto "${project.name}" Atrasado`,
            description: `O projeto "${project.name}" está ${daysOverdue} dias atrasado (prazo: ${endDate.toLocaleDateString('pt-BR')}). Status: ${project.status}, Progresso: ${progress}%. Ação urgente necessária.`,
            severity: daysOverdue > 30 ? 'critical' : 'high',
            confidence_score: 0.95,
            related_entity_type: 'project',
            related_entity_id: project.id,
            actionable: true,
            metadata: {
              project_name: project.name,
              days_overdue: daysOverdue,
              current_progress: progress,
              status: project.status,
              priority: project.priority
            }
          });
        }

        // Risk: Projects at risk
        if (endDate && progress < 75) {
          const daysUntilDeadline = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          if (daysUntilDeadline <= 30 && daysUntilDeadline > 0) {
            insights.push({
              insight_type: 'risk',
              category: 'projects',
              title: `Risco de Atraso: "${project.name}"`,
              description: `Projeto "${project.name}" com ${progress}% concluído e apenas ${daysUntilDeadline} dias restantes. Taxa atual sugere possível atraso.`,
              severity: progress < 50 ? 'high' : 'medium',
              confidence_score: 0.80,
              related_entity_type: 'project',
              related_entity_id: project.id,
              actionable: true,
              metadata: {
                project_name: project.name,
                days_until_deadline: daysUntilDeadline,
                current_progress: progress,
                expected_progress: Math.max(0, 100 - (daysUntilDeadline * 2))
              }
            });
          }
        }

        // Opportunity: Ahead of schedule
        if (progress > 80 && endDate) {
          const daysUntilDeadline = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          if (daysUntilDeadline > 15) {
            insights.push({
              insight_type: 'opportunity',
              category: 'projects',
              title: `Projeto "${project.name}" Adiantado`,
              description: `Excelente progresso! O projeto está ${progress}% concluído com ${daysUntilDeadline} dias de folga. Considere realocar recursos ou antecipar entrega.`,
              severity: 'low',
              confidence_score: 0.85,
              related_entity_type: 'project',
              related_entity_id: project.id,
              actionable: true,
              metadata: {
                project_name: project.name,
                days_ahead: daysUntilDeadline,
                current_progress: progress,
                potential_early_delivery: true
              }
            });
          }
        }
      }
    }

    // Enhanced Key Results analysis
    if (analysis.indicators && analysis.indicators.length > 0) {
      console.log('Analyzing indicators...');
      for (const indicator of analysis.indicators) {
        const currentValue = indicator.current_value || 0;
        const targetValue = indicator.target_value || 0;
        const achievement = targetValue > 0 ? (currentValue / targetValue) * 100 : 0;
        
        console.log(`Indicator: ${indicator.name}, Current: ${currentValue}, Target: ${targetValue}, Achievement: ${achievement.toFixed(1)}%`);

        // Critical underperformance
        if (achievement < 50) {
          insights.push({
            insight_type: 'risk',
            category: 'indicators',
            title: `Meta Crítica: "${indicator.name}"`,
            description: `O resultado-chave "${indicator.name}" está severamente abaixo da meta com apenas ${achievement.toFixed(1)}% de atingimento. Valor: ${currentValue} ${indicator.unit || ''} / Meta: ${targetValue} ${indicator.unit || ''}. Intervenção imediata necessária.`,
            severity: 'critical',
            confidence_score: 0.95,
            related_entity_type: 'key_result',
            related_entity_id: indicator.id,
            actionable: true,
            metadata: {
              indicator_name: indicator.name,
              current_value: currentValue,
              target_value: targetValue,
              achievement_percentage: achievement,
              unit: indicator.unit,
              gap: targetValue - currentValue
            }
          });
        } else if (achievement < 70) {
          insights.push({
            insight_type: 'risk',
            category: 'indicators',
            title: `Atenção: "${indicator.name}" Abaixo da Meta`,
            description: `Resultado-chave "${indicator.name}" com ${achievement.toFixed(1)}% da meta atingida. Necessário plano de ação para alcançar ${targetValue} ${indicator.unit || ''}.`,
            severity: 'high',
            confidence_score: 0.85,
            related_entity_type: 'key_result',
            related_entity_id: indicator.id,
            actionable: true,
            metadata: {
              indicator_name: indicator.name,
              current_value: currentValue,
              target_value: targetValue,
              achievement_percentage: achievement
            }
          });
        }

        // Outstanding performance
        if (achievement > 130) {
          insights.push({
            insight_type: 'opportunity',
            category: 'indicators',
            title: `Desempenho Excepcional: "${indicator.name}"`,
            description: `Parabéns! O resultado "${indicator.name}" está ${achievement.toFixed(1)}% acima da meta. Valor: ${currentValue} vs Meta: ${targetValue} ${indicator.unit || ''}. Considere revisar metas ou identificar fatores de sucesso para replicar.`,
            severity: 'low',
            confidence_score: 0.90,
            related_entity_type: 'key_result',
            related_entity_id: indicator.id,
            actionable: true,
            metadata: {
              indicator_name: indicator.name,
              current_value: currentValue,
              target_value: targetValue,
              achievement_percentage: achievement,
              overperformance_factor: achievement / 100,
              success_story: true
            }
          });
        }
      }
    }

    // Enhanced Objectives analysis
    if (analysis.objectives && analysis.objectives.length > 0) {
      console.log('Analyzing objectives...');
      for (const objective of analysis.objectives) {
        const progress = objective.progress || 0;
        const targetDate = objective.target_date ? new Date(objective.target_date) : null;
        const now = new Date();
        
        console.log(`Objective: ${objective.title}, Progress: ${progress}%, Status: ${objective.status}`);

        if (targetDate) {
          const daysUntilTarget = Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          
          if (progress < 60 && daysUntilTarget <= 60 && daysUntilTarget > 0) {
            insights.push({
              insight_type: 'risk',
              category: 'objectives',
              title: `Objetivo em Risco: "${objective.title}"`,
              description: `O objetivo "${objective.title}" tem ${progress}% de progresso com ${daysUntilTarget} dias restantes. Velocidade atual insuficiente para atingir meta no prazo.`,
              severity: progress < 40 ? 'critical' : 'high',
              confidence_score: 0.80,
              related_entity_type: 'objective',
              related_entity_id: objective.id,
              actionable: true,
              metadata: {
                objective_title: objective.title,
                current_progress: progress,
                days_until_target: daysUntilTarget,
                required_velocity: Math.ceil((100 - progress) / (daysUntilTarget / 7))
              }
            });
      }
    }

    // Always generate at least some basic insights about the data state
    if (insights.length === 0) {
      console.log('No specific insights generated, creating general overview...');
      
      // Generate overview insights
      if (analysis.projects && analysis.projects.length > 0) {
        const totalProjects = analysis.projects.length;
        const activeProjects = analysis.projects.filter(p => p.status !== 'completed').length;
        const completedProjects = totalProjects - activeProjects;
        
        insights.push({
          insight_type: 'info',
          category: 'projects',
          title: 'Visão Geral dos Projetos',
          description: `Você possui ${totalProjects} projetos no total: ${activeProjects} em andamento e ${completedProjects} concluídos. Continue acompanhando o progresso para manter o controle estratégico.`,
          severity: 'low',
          confidence_score: 1.0,
          related_entity_type: 'project',
          actionable: true,
          metadata: {
            total_projects: totalProjects,
            active_projects: activeProjects,
            completed_projects: completedProjects,
            source: 'overview_analysis'
          }
        });
      }

      if (analysis.indicators && analysis.indicators.length > 0) {
        const totalIndicators = analysis.indicators.length;
        const averageAchievement = analysis.indicators.reduce((acc, ind) => {
          const achievement = ind.target_value > 0 ? (ind.current_value / ind.target_value) * 100 : 0;
          return acc + achievement;
        }, 0) / totalIndicators;

        insights.push({
          insight_type: 'info',
          category: 'indicators',
          title: 'Performance dos Indicadores',
          description: `Você está monitorando ${totalIndicators} indicadores-chave com uma média de ${averageAchievement.toFixed(1)}% de atingimento das metas. Continue acompanhando para identificar oportunidades de melhoria.`,
          severity: 'low',
          confidence_score: 0.85,
          related_entity_type: 'key_result',
          actionable: true,
          metadata: {
            total_indicators: totalIndicators,
            average_achievement: averageAchievement,
            source: 'overview_analysis'
          }
        });
      }

      if (analysis.objectives && analysis.objectives.length > 0) {
        const totalObjectives = analysis.objectives.length;
        const inProgressObjectives = analysis.objectives.filter(o => o.status === 'in_progress').length;
        const averageProgress = analysis.objectives.reduce((acc, obj) => acc + (obj.progress || 0), 0) / totalObjectives;

        insights.push({
          insight_type: 'info',
          category: 'objectives',
          title: 'Status dos Objetivos Estratégicos',
          description: `Você possui ${totalObjectives} objetivos estratégicos, sendo ${inProgressObjectives} em progresso ativo. O progresso médio é de ${averageProgress.toFixed(1)}%. Mantenha o foco na execução.`,
          severity: 'low',
          confidence_score: 0.90,
          related_entity_type: 'objective',
          actionable: true,
          metadata: {
            total_objectives: totalObjectives,
            in_progress_objectives: inProgressObjectives,
            average_progress: averageProgress,
            source: 'overview_analysis'
          }
        });
      }

      // If no data at all, provide guidance
      if ((!analysis.projects || analysis.projects.length === 0) && 
          (!analysis.indicators || analysis.indicators.length === 0) && 
          (!analysis.objectives || analysis.objectives.length === 0)) {
        insights.push({
          insight_type: 'info',
          category: 'strategic',
          title: 'Começando sua Jornada Estratégica',
          description: 'Para gerar insights mais específicos, comece adicionando projetos, objetivos estratégicos e indicadores-chave. O sistema analisará automaticamente seu progresso e identificará oportunidades de melhoria.',
          severity: 'low',
          confidence_score: 1.0,
          actionable: true,
          metadata: {
            recommendation: 'setup_data',
            source: 'onboarding_guidance'
          }
        });
      }
    }

    console.log(`Total insights generated: ${insights.length}`);
      }
    }

    // Insert insights into database
    let insertedInsights = 0;
    for (const insight of insights) {
      try {
        const { error } = await supabaseClient
          .from('ai_insights')
          .insert([{
            ...insight,
            user_id: user_id,
            company_id: company_id,
            status: 'active'
          }]);
        
        if (!error) {
          insertedInsights++;
        } else {
          console.error('Error inserting insight:', error);
        }
      } catch (err) {
        console.error('Error processing insight:', err);
      }
    }

    // Insert AI recommendations
    let insertedRecommendations = 0;
    for (const rec of aiRecommendations) {
      try {
        const { error } = await supabaseClient
          .from('ai_recommendations')
          .insert([rec]);
        
        if (!error) {
          insertedRecommendations++;
        }
      } catch (err) {
        console.error('Error inserting recommendation:', err);
      }
    }

    console.log(`Generated ${insights.length} insights, inserted ${insertedInsights}`);
    console.log(`Generated ${aiRecommendations.length} recommendations, inserted ${insertedRecommendations}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        insights_generated: insights.length,
        insights_inserted: insertedInsights,
        recommendations_generated: aiRecommendations.length,
        recommendations_inserted: insertedRecommendations,
        ai_enhanced: openAIKey ? true : false,
        insights: insights.slice(0, 5) // Return first 5 for preview
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating insights:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});