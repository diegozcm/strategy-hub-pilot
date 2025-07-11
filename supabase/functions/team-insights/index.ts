import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { analysis_type = 'team_overview' } = await req.json();

    if (!openAIApiKey) {
      throw new Error('OpenAI API key não configurada');
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get team data for analysis
    const [profilesRes, projectMembersRes, projectsRes, indicatorsRes, tasksRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('status', 'active'),
      supabase.from('project_members').select('*'),
      supabase.from('strategic_projects').select('*'),
      supabase.from('indicators').select('*'),
      supabase.from('project_tasks').select('*')
    ]);

    const teamData = {
      profiles: profilesRes.data || [],
      projectMembers: projectMembersRes.data || [],
      projects: projectsRes.data || [],
      indicators: indicatorsRes.data || [],
      tasks: tasksRes.data || []
    };

    // Calculate team metrics
    const teamMetrics = calculateTeamMetrics(teamData);

    // Prepare context for AI analysis
    let contextPrompt = `Você é um especialista em gestão de pessoas e análise organizacional. 
    Analise os dados da equipe e forneça insights acionáveis para otimizar performance e bem-estar.

    DADOS DA EQUIPE:
    Total de colaboradores: ${teamMetrics.totalMembers}
    Departamentos: ${teamMetrics.departments.join(', ')}
    
    DISTRIBUIÇÃO POR DEPARTAMENTO:
    ${teamMetrics.departmentDistribution.map(d => 
      `- ${d.department}: ${d.count} pessoas (${d.percentage}%)`
    ).join('\n')}

    ALOCAÇÃO EM PROJETOS:
    Projetos ativos: ${teamMetrics.activeProjects}
    Colaboradores sobrecarregados (>100% alocação): ${teamMetrics.overallocatedMembers}
    Colaboradores subalocados (<50% alocação): ${teamMetrics.underallocatedMembers}

    MÉTRICAS DE PERFORMANCE:
    Tarefas concluídas este mês: ${teamMetrics.completedTasks}
    Tarefas em atraso: ${teamMetrics.overdueTasks}
    Taxa de conclusão média: ${teamMetrics.completionRate}%

    ANÁLISE SOLICITADA: ${analysis_type}

    Forneça insights em formato JSON com a seguinte estrutura:
    {
      "insights": [
        {
          "id": "unique_id",
          "type": "workload|skills|retention|performance|collaboration",
          "severity": "low|medium|high|critical", 
          "title": "Título do insight",
          "description": "Descrição detalhada",
          "recommendation": "Ação recomendada",
          "confidence": 0.85,
          "affected_members": ["list of affected member names"],
          "impact": "low|medium|high",
          "effort": "low|medium|high"
        }
      ],
      "recommendations": [
        {
          "title": "Recomendação principal",
          "description": "Detalhes da recomendação",
          "priority": "high|medium|low",
          "timeline": "prazo sugerido",
          "resources_needed": "recursos necessários"
        }
      ],
      "metrics_to_track": [
        {
          "metric": "Nome da métrica",
          "current_value": "valor atual",
          "target_value": "valor alvo",
          "tracking_frequency": "frequência de acompanhamento"
        }
      ]
    }`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: contextPrompt
          },
          { 
            role: 'user', 
            content: `Analise os dados da equipe e gere insights para ${analysis_type}. Foque em identificar padrões, riscos e oportunidades de otimização.`
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    let aiResponse = data.choices[0].message.content;

    // Try to parse JSON response
    let insights;
    try {
      // Extract JSON from response if it's wrapped in markdown
      const jsonMatch = aiResponse.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        aiResponse = jsonMatch[1];
      }
      insights = JSON.parse(aiResponse);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      // Fallback to structured response
      insights = {
        insights: [
          {
            id: 'fallback_1',
            type: 'performance',
            severity: 'medium',
            title: 'Análise da Equipe',
            description: 'Análise geral da performance da equipe baseada nos dados disponíveis.',
            recommendation: aiResponse.substring(0, 200) + '...',
            confidence: 0.75,
            affected_members: [],
            impact: 'medium',
            effort: 'medium'
          }
        ],
        recommendations: [],
        metrics_to_track: []
      };
    }

    // Store insights in database
    const insightsToStore = insights.insights.map((insight: any) => ({
      user_id: 'system', // System-generated insights
      insight_type: insight.type,
      category: 'team_management',
      title: insight.title,
      description: insight.description,
      severity: insight.severity,
      confidence_score: insight.confidence,
      actionable: true,
      status: 'active',
      metadata: {
        recommendation: insight.recommendation,
        affected_members: insight.affected_members,
        impact: insight.impact,
        effort: insight.effort,
        analysis_type: analysis_type
      }
    }));

    if (insightsToStore.length > 0) {
      await supabase.from('ai_insights').insert(insightsToStore);
    }

    return new Response(JSON.stringify({ 
      insights: insights,
      team_metrics: teamMetrics,
      success: true 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in team-insights function:', error);
    
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function calculateTeamMetrics(teamData: any) {
  const { profiles, projectMembers, projects, tasks } = teamData;

  // Calculate department distribution
  const departmentCounts: { [key: string]: number } = {};
  profiles.forEach((profile: any) => {
    if (profile.department) {
      departmentCounts[profile.department] = (departmentCounts[profile.department] || 0) + 1;
    }
  });

  const departmentDistribution = Object.entries(departmentCounts).map(([department, count]) => ({
    department,
    count,
    percentage: Math.round((count / profiles.length) * 100)
  }));

  // Calculate allocation metrics
  const memberAllocations: { [key: string]: number } = {};
  projectMembers.forEach((member: any) => {
    const userId = member.user_id;
    memberAllocations[userId] = (memberAllocations[userId] || 0) + member.allocation_percentage;
  });

  const overallocatedMembers = Object.values(memberAllocations).filter(allocation => allocation > 100).length;
  const underallocatedMembers = Object.values(memberAllocations).filter(allocation => allocation < 50).length;

  // Calculate task metrics
  const completedTasks = tasks.filter((task: any) => task.status === 'done').length;
  const overdueTasks = tasks.filter((task: any) => 
    task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done'
  ).length;
  
  const completionRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  return {
    totalMembers: profiles.length,
    departments: Object.keys(departmentCounts),
    departmentDistribution,
    activeProjects: projects.filter((p: any) => p.status === 'in_progress').length,
    overallocatedMembers,
    underallocatedMembers,
    completedTasks,
    overdueTasks,
    completionRate
  };
}