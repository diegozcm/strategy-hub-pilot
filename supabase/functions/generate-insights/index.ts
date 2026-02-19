// @ts-nocheck
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    const { user_id, company_id } = await req.json();

    if (!user_id || !company_id) {
      throw new Error('User ID and Company ID are required');
    }

    // Verify company has AI access enabled and get company details
    const { data: company, error: companyError } = await supabaseClient
      .from('companies')
      .select('ai_enabled, name, mission, vision, values')
      .eq('id', company_id)
      .single();

    if (companyError || !company?.ai_enabled) {
      return new Response(
        JSON.stringify({ error: 'Empresa não tem acesso aos recursos de IA' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const companyName = company.name || 'Empresa';
    console.log(`Generating insights for user: ${user_id}, company: ${companyName} (${company_id})`);

    // ========== FETCH ALL DATA ==========

    // Step 1: Get strategic plans
    const { data: strategicPlans } = await supabaseClient
      .from('strategic_plans')
      .select('id')
      .eq('company_id', company_id);

    const planIds = strategicPlans?.map(p => p.id) || [];

    // Step 2: Fetch pillars, objectives, and strategic tools in parallel
    const [
      pillarsRes,
      objectivesRes,
      goldenCircleRes,
      swotRes,
      visionAlignmentRes,
      beepRes,
      startupProfilesRes,
      mentorSessionsRes,
      projectsRes,
      govMeetingsRes,
      govAtasRes,
      govRuleDocRes
    ] = await Promise.all([
      // Pillars
      supabaseClient
        .from('strategic_pillars')
        .select('id, name, description, color, order_index')
        .eq('company_id', company_id),
      // Objectives
      planIds.length > 0
        ? supabaseClient
            .from('strategic_objectives')
            .select('id, title, progress, status, target_date, plan_id, pillar_id, weight, responsible, deadline')
            .in('plan_id', planIds)
        : Promise.resolve({ data: [], error: null }),
      // Golden Circle
      supabaseClient
        .from('golden_circle')
        .select('why_question, how_question, what_question')
        .eq('company_id', company_id)
        .maybeSingle(),
      // SWOT
      supabaseClient
        .from('swot_analysis')
        .select('*')
        .eq('company_id', company_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      // Vision Alignment
      supabaseClient
        .from('vision_alignment')
        .select('*')
        .eq('company_id', company_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      // BEEP Assessments
      supabaseClient
        .from('beep_assessments')
        .select('id, status, final_score, maturity_level, progress_percentage, completed_at')
        .eq('company_id', company_id)
        .order('created_at', { ascending: false })
        .limit(3),
      // Startup profiles
      supabaseClient
        .from('startup_hub_profiles')
        .select('*')
        .eq('company_id', company_id),
      // Mentoring sessions
      supabaseClient
        .from('mentoring_sessions')
        .select('*')
        .eq('startup_company_id', company_id)
        .order('session_date', { ascending: false })
        .limit(20),
      // Projects
      planIds.length > 0
        ? supabaseClient
            .from('strategic_projects')
            .select('id, name, progress, status, start_date, end_date, budget, priority, plan_id, responsible')
            .in('plan_id', planIds)
        : Promise.resolve({ data: [], error: null }),
      // Governance meetings
      supabaseClient
        .from('governance_meetings')
        .select('title, meeting_type, scheduled_date, status')
        .eq('company_id', company_id)
        .order('scheduled_date', { ascending: false })
        .limit(10),
      // Governance atas
      supabaseClient
        .from('governance_atas')
        .select('content, decisions, participants, created_at')
        .order('created_at', { ascending: false })
        .limit(5),
      // Governance rule document
      supabaseClient
        .from('governance_rule_documents')
        .select('file_name')
        .eq('company_id', company_id)
        .maybeSingle(),
    ]);

    const pillars = pillarsRes.data || [];
    const objectives = objectivesRes.data || [];
    const objectiveIds = objectives.map(o => o.id);
    const projects = projectsRes.data || [];
    const projectIds = projects.map(p => p.id);
    const goldenCircle = goldenCircleRes.data;
    const swot = swotRes.data;
    const visionAlignment = visionAlignmentRes.data;
    const beepAssessments = beepRes.data || [];
    const startupProfiles = startupProfilesRes.data || [];
    const mentorSessions = mentorSessionsRes.data || [];
    const govMeetings = govMeetingsRes.data || [];
    const govAtas = govAtasRes.data || [];
    const govRuleDoc = govRuleDocRes.data;

    // Step 3: Fetch KRs (with full fields), initiatives, monthly actions, FCA, project tasks
    const [keyResultsRes, initiativesRes, projectTasksRes] = await Promise.all([
      objectiveIds.length > 0
        ? supabaseClient
            .from('key_results')
            .select('id, title, current_value, target_value, unit, due_date, priority, objective_id, frequency, monthly_targets, monthly_actual, yearly_target, yearly_actual, start_month, end_month, weight, ytd_percentage, monthly_percentage, yearly_percentage, responsible, assigned_owner_id')
            .in('objective_id', objectiveIds)
        : Promise.resolve({ data: [], error: null }),
      objectiveIds.length > 0
        ? supabaseClient
            .from('kr_initiatives')
            .select('id, key_result_id, title, status, priority, progress_percentage, budget, responsible, start_date, end_date')
            .eq('company_id', company_id)
        : Promise.resolve({ data: [], error: null }),
      projectIds.length > 0
        ? supabaseClient
            .from('project_tasks')
            .select('id, project_id, title, status, priority, estimated_hours, actual_hours, due_date')
            .in('project_id', projectIds)
        : Promise.resolve({ data: [], error: null })
    ]);

    const keyResults = keyResultsRes.data || [];
    const krIds = keyResults.map(kr => kr.id);
    const initiatives = initiativesRes.data || [];
    const projectTasks = projectTasksRes.data || [];

    // Step 4: Fetch FCA and monthly actions for KRs
    const [fcaRes, monthlyActionsRes] = await Promise.all([
      krIds.length > 0
        ? supabaseClient
            .from('kr_fca')
            .select('id, key_result_id, title, fact, cause, priority, status')
            .in('key_result_id', krIds)
        : Promise.resolve({ data: [], error: null }),
      krIds.length > 0
        ? supabaseClient
            .from('kr_monthly_actions')
            .select('id, key_result_id, action_title, status, completion_percentage, planned_value, actual_value, month_year, priority')
            .in('key_result_id', krIds)
        : Promise.resolve({ data: [], error: null })
    ]);

    const fcaAnalyses = fcaRes.data || [];
    const monthlyActions = monthlyActionsRes.data || [];

    console.log('Data fetched:', {
      pillars: pillars.length,
      objectives: objectives.length,
      key_results: keyResults.length,
      initiatives: initiatives.length,
      monthly_actions: monthlyActions.length,
      fca: fcaAnalyses.length,
      projects: projects.length,
      project_tasks: projectTasks.length,
      golden_circle: !!goldenCircle,
      swot: !!swot,
      vision_alignment: !!visionAlignment,
      beep: beepAssessments.length,
      startups: startupProfiles.length,
      mentoring: mentorSessions.length
    });

    // ========== BUILD CONTEXT FOR AI ==========
    const contextData = {
      company: {
        name: companyName,
        mission: company.mission,
        vision: company.vision,
        values: company.values
      },
      pillars: pillars.map(p => ({ name: p.name, description: p.description })),
      objectives: objectives.map(o => ({
        id: o.id,
        title: o.title,
        progress: o.progress,
        status: o.status,
        target_date: o.target_date,
        weight: o.weight,
        responsible: o.responsible
      })),
      keyResults: keyResults.map(kr => ({
        id: kr.id,
        title: kr.title,
        current_value: kr.current_value,
        target_value: kr.target_value,
        unit: kr.unit,
        frequency: kr.frequency,
        ytd_percentage: kr.ytd_percentage,
        monthly_percentage: kr.monthly_percentage,
        yearly_percentage: kr.yearly_percentage,
        weight: kr.weight,
        due_date: kr.due_date,
        priority: kr.priority,
        objective_id: kr.objective_id
      })),
      initiatives: initiatives.map(i => ({
        title: i.title,
        status: i.status,
        progress: i.progress_percentage,
        priority: i.priority,
        budget: i.budget,
        responsible: i.responsible,
        key_result_id: i.key_result_id
      })),
      monthlyActions: monthlyActions.slice(0, 50).map(a => ({
        title: a.action_title,
        status: a.status,
        completion: a.completion_percentage,
        planned: a.planned_value,
        actual: a.actual_value,
        month: a.month_year,
        priority: a.priority
      })),
      fcaAnalyses: fcaAnalyses.map(f => ({
        title: f.title,
        fact: f.fact,
        cause: f.cause,
        priority: f.priority,
        status: f.status
      })),
      projects: projects.map(p => ({
        id: p.id,
        name: p.name,
        progress: p.progress,
        status: p.status,
        start_date: p.start_date,
        end_date: p.end_date,
        budget: p.budget,
        priority: p.priority
      })),
      projectTasks: projectTasks.slice(0, 50).map(t => ({
        title: t.title,
        status: t.status,
        priority: t.priority,
        estimated_hours: t.estimated_hours,
        actual_hours: t.actual_hours,
        due_date: t.due_date,
        project_id: t.project_id
      })),
      goldenCircle: goldenCircle ? {
        why: goldenCircle.why_question,
        how: goldenCircle.how_question,
        what: goldenCircle.what_question
      } : null,
      swot: swot ? {
        strengths: swot.strengths,
        weaknesses: swot.weaknesses,
        opportunities: swot.opportunities,
        threats: swot.threats
      } : null,
      visionAlignment: visionAlignment || null,
      beepAssessments: beepAssessments.map(b => ({
        score: b.final_score,
        maturity: b.maturity_level,
        status: b.status,
        completed_at: b.completed_at
      })),
      startupProfiles: startupProfiles.map(sp => ({
        name: sp.startup_name,
        stage: sp.stage,
        description: sp.business_description,
        industry: sp.industry
      })),
      mentoringSessions: mentorSessions.slice(0, 10).map(ms => ({
        date: ms.session_date,
        type: ms.session_type,
        status: ms.status,
        notes: ms.notes?.substring(0, 200)
      })),
      governance: {
        meetings: govMeetings.map(m => ({ title: m.title, type: m.meeting_type, date: m.scheduled_date, status: m.status })),
        atas: govAtas.map(a => ({ decisions: a.decisions, participants: a.participants, date: a.created_at })),
        ruleDocument: govRuleDoc?.file_name || null,
      }
    };

    // ========== GENERATE INSIGHTS ==========
    const insights = [];
    const aiRecommendations = [];

    const hasData = objectives.length > 0 || keyResults.length > 0 || projects.length > 0 || 
                    startupProfiles.length > 0 || mentorSessions.length > 0 || initiatives.length > 0 ||
                    govMeetings.length > 0;

    if (lovableApiKey && hasData) {
      try {
        const prompt = `Você é o Atlas, consultor estratégico da empresa "${companyName}". Analise TODOS os dados abaixo e gere um diagnóstico completo em português.

IDENTIDADE DA EMPRESA:
- Missão: ${company.mission || 'Não definida'}
- Visão: ${company.vision || 'Não definida'}
- Valores: ${company.values?.join(', ') || 'Não definidos'}
${goldenCircle ? `- Golden Circle: WHY: ${goldenCircle.why_question || '—'} | HOW: ${goldenCircle.how_question || '—'} | WHAT: ${goldenCircle.what_question || '—'}` : ''}
${swot ? `- SWOT: Forças: ${JSON.stringify(swot.strengths)} | Fraquezas: ${JSON.stringify(swot.weaknesses)} | Oportunidades: ${JSON.stringify(swot.opportunities)} | Ameaças: ${JSON.stringify(swot.threats)}` : ''}

PILARES ESTRATÉGICOS (${pillars.length}):
${JSON.stringify(contextData.pillars, null, 1)}

OBJETIVOS ESTRATÉGICOS (${objectives.length}):
${JSON.stringify(contextData.objectives, null, 1)}

RESULTADOS-CHAVE (${keyResults.length}):
${JSON.stringify(contextData.keyResults, null, 1)}

INICIATIVAS DOS KRs (${initiatives.length}):
${JSON.stringify(contextData.initiatives, null, 1)}

AÇÕES MENSAIS (${monthlyActions.length}):
${JSON.stringify(contextData.monthlyActions, null, 1)}

ANÁLISES FCA (${fcaAnalyses.length}):
${JSON.stringify(contextData.fcaAnalyses, null, 1)}

PROJETOS (${projects.length}):
${JSON.stringify(contextData.projects, null, 1)}

TAREFAS DOS PROJETOS (${projectTasks.length}):
${JSON.stringify(contextData.projectTasks, null, 1)}

${beepAssessments.length > 0 ? `AVALIAÇÃO BEEP DE MATURIDADE: ${JSON.stringify(contextData.beepAssessments, null, 1)}` : ''}

${startupProfiles.length > 0 ? `STARTUP HUB (${startupProfiles.length} startups): ${JSON.stringify(contextData.startupProfiles, null, 1)}` : ''}

${mentorSessions.length > 0 ? `MENTORIAS (${mentorSessions.length} sessões): ${JSON.stringify(contextData.mentoringSessions, null, 1)}` : ''}

${govMeetings.length > 0 || govAtas.length > 0 || govRuleDoc ? `GOVERNANÇA RMRE:
${govMeetings.length > 0 ? `Reuniões: ${JSON.stringify(contextData.governance.meetings, null, 1)}` : ''}
${govAtas.length > 0 ? `Atas: ${JSON.stringify(contextData.governance.atas, null, 1)}` : ''}
${govRuleDoc ? `Documento de regras: ${govRuleDoc.file_name}` : ''}` : ''}

INSTRUÇÕES:
1. Escreva em tom conversacional e consultivo, como um consultor falando diretamente com o gestor. Use frases como "Identifiquei que...", "Recomendo que...", "Atenção:".
2. Para cada insight, OBRIGATORIAMENTE inclua o campo "related_entity_id" com o UUID real da entidade analisada (objective, key_result, project) quando disponível nos dados.
3. Faça análise cruzada: compare SWOT com performance dos KRs, Golden Circle com alinhamento dos objetivos, FCA com ações pendentes.
4. Gere entre 5 e 15 insights cobrindo diferentes módulos.

Formato JSON OBRIGATÓRIO:
{
  "insights": [
    {
      "type": "risk|opportunity|info|recommendation",
      "category": "projects|indicators|objectives|startups|mentoring|strategic|initiatives|tools|governance",
      "title": "Título conciso",
      "description": "Texto narrativo do Atlas, em tom de consultor, detalhando a situação e recomendação",
      "severity": "low|medium|high|critical",
      "confidence": 0.85,
      "related_entity_type": "key_result|objective|project|startup|initiative",
      "related_entity_id": "uuid-da-entidade-se-disponível",
      "recommendations": ["Recomendação 1", "Recomendação 2"]
    }
  ]
}`;

        const openAIResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${lovableApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-3-flash-preview',
            messages: [
              {
                role: 'system',
                content: 'Você é o Atlas, um consultor estratégico especializado. Responda APENAS com JSON válido, sem markdown ou texto extra. Sempre inclua related_entity_id quando os dados fornecerem UUIDs.'
              },
              { role: 'user', content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 4000
          }),
        });

        if (openAIResponse.ok) {
          const aiResult = await openAIResponse.json();
          let aiContent = aiResult.choices[0]?.message?.content || '';
          
          // Clean markdown if present
          aiContent = aiContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          
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
                  confidence_score: aiInsight.confidence || 0.85,
                  related_entity_type: aiInsight.related_entity_type || (
                    aiInsight.category === 'projects' ? 'project' :
                    aiInsight.category === 'indicators' ? 'key_result' :
                    aiInsight.category === 'objectives' ? 'objective' : null
                  ),
                  related_entity_id: aiInsight.related_entity_id || null,
                  actionable: true,
                  metadata: {
                    source: 'atlas_ai_analysis',
                    recommendations: aiInsight.recommendations || [],
                    ai_generated: true
                  }
                });

                if (aiInsight.recommendations && Array.isArray(aiInsight.recommendations)) {
                  aiInsight.recommendations.forEach((rec) => {
                    aiRecommendations.push({
                      title: typeof rec === 'string' ? rec : rec.title || rec.action,
                      description: typeof rec === 'string' ? rec : rec.description,
                      action_type: 'improvement',
                      priority: aiInsight.severity === 'critical' ? 'high' : aiInsight.severity === 'high' ? 'high' : 'medium',
                      estimated_impact: 'medium',
                      effort_required: 'medium',
                      status: 'pending'
                    });
                  });
                }
              }
            }
          } catch (parseError) {
            console.log('AI response was not valid JSON, using fallback:', parseError.message);
            console.log('AI content preview:', aiContent.substring(0, 200));
          }
        } else {
          console.log('AI API error:', openAIResponse.status, await openAIResponse.text());
        }
      } catch (aiError) {
        console.log('AI analysis failed:', aiError.message);
      }
    }

    // ========== RULE-BASED FALLBACK ==========
    // Projects analysis
    if (projects.length > 0) {
      for (const project of projects) {
        const progress = project.progress || 0;
        const endDate = project.end_date ? new Date(project.end_date) : null;
        const now = new Date();

        if (endDate && endDate < now && project.status !== 'completed') {
          const daysOverdue = Math.ceil((now.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24));
          insights.push({
            insight_type: 'risk',
            category: 'projects',
            title: `Projeto "${project.name}" Atrasado`,
            description: `Identifiquei que o projeto "${project.name}" está ${daysOverdue} dias atrasado com apenas ${progress}% concluído. Recomendo uma reunião de realinhamento urgente para definir novas prioridades e prazos.`,
            severity: daysOverdue > 30 ? 'critical' : 'high',
            confidence_score: 0.95,
            related_entity_type: 'project',
            related_entity_id: project.id,
            actionable: true,
            metadata: { project_name: project.name, days_overdue: daysOverdue, current_progress: progress, recommendations: ['Realizar reunião de realinhamento', 'Redefinir prioridades e prazos', 'Verificar alocação de recursos'] }
          });
        }
      }
    }

    // KR analysis
    if (keyResults.length > 0) {
      for (const kr of keyResults) {
        const current = kr.current_value || 0;
        const target = kr.target_value || 0;
        const achievement = target > 0 ? (current / target) * 100 : 0;

        if (achievement < 50 && target > 0) {
          insights.push({
            insight_type: 'risk',
            category: 'indicators',
            title: `KR Crítico: "${kr.title}"`,
            description: `O resultado-chave "${kr.title}" está com apenas ${achievement.toFixed(1)}% de atingimento (${current} ${kr.unit || ''} de ${target} ${kr.unit || ''}). Recomendo revisar as iniciativas vinculadas e criar um plano de ação imediato.`,
            severity: 'critical',
            confidence_score: 0.95,
            related_entity_type: 'key_result',
            related_entity_id: kr.id,
            actionable: true,
            metadata: { indicator_name: kr.title, current_value: current, target_value: target, achievement_percentage: achievement, unit: kr.unit, recommendations: ['Revisar iniciativas vinculadas', 'Criar plano de ação imediato', 'Agendar check-in semanal'] }
          });
        }
      }
    }

    // Objectives analysis
    if (objectives.length > 0) {
      for (const obj of objectives) {
        const progress = obj.progress || 0;
        const targetDate = obj.target_date ? new Date(obj.target_date) : null;
        const now = new Date();

        if (targetDate) {
          const daysLeft = Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          if (progress < 60 && daysLeft <= 60 && daysLeft > 0) {
            insights.push({
              insight_type: 'risk',
              category: 'objectives',
              title: `Objetivo em Risco: "${obj.title}"`,
              description: `O objetivo "${obj.title}" tem ${progress}% de progresso com apenas ${daysLeft} dias restantes. A velocidade atual é insuficiente. Recomendo priorizar os KRs vinculados e revisar as metas.`,
              severity: progress < 40 ? 'critical' : 'high',
              confidence_score: 0.80,
              related_entity_type: 'objective',
              related_entity_id: obj.id,
              actionable: true,
              metadata: { objective_title: obj.title, current_progress: progress, days_until_target: daysLeft, recommendations: ['Priorizar KRs vinculados', 'Revisar metas', 'Realocar recursos'] }
            });
          }
        }
      }
    }

    // If no data at all
    if (insights.length === 0) {
      insights.push({
        insight_type: 'info',
        category: 'strategic',
        title: 'Começando sua Jornada Estratégica',
        description: 'Para gerar diagnósticos mais completos, adicione projetos, objetivos, KRs e ferramentas estratégicas (Golden Circle, SWOT) no Strategy Hub. O Atlas analisará automaticamente seu progresso.',
        severity: 'low',
        confidence_score: 1.0,
        actionable: true,
        metadata: { source: 'onboarding', recommendations: ['Cadastrar pilares estratégicos', 'Definir objetivos e KRs', 'Preencher Golden Circle e SWOT'] }
      });
    }

    console.log(`Total insights generated: ${insights.length}`);

    // ========== INSERT INTO DATABASE ==========
    let insertedInsights = 0;
    for (const insight of insights) {
      try {
        const enrichedMetadata = {
          ...(insight.metadata || {}),
          source_company_id: company_id,
          generated_at: new Date().toISOString(),
          data_scope: 'company_only'
        };

        const { error } = await supabaseClient
          .from('ai_insights')
          .insert([{
            ...insight,
            user_id: user_id,
            company_id: company_id,
            status: 'active',
            metadata: enrichedMetadata
          }]);

        if (!error) insertedInsights++;
        else console.error('Error inserting insight:', error);
      } catch (err) {
        console.error('Error processing insight:', err);
      }
    }

    let insertedRecommendations = 0;
    for (const rec of aiRecommendations) {
      try {
        const { error } = await supabaseClient
          .from('ai_recommendations')
          .insert([rec]);
        if (!error) insertedRecommendations++;
      } catch (err) {
        console.error('Error inserting recommendation:', err);
      }
    }

    console.log(`Inserted ${insertedInsights}/${insights.length} insights, ${insertedRecommendations}/${aiRecommendations.length} recommendations`);

    return new Response(
      JSON.stringify({
        success: true,
        company_id,
        user_id,
        insights_generated: insights.length,
        insights_inserted: insertedInsights,
        recommendations_generated: aiRecommendations.length,
        recommendations_inserted: insertedRecommendations,
        ai_enhanced: !!lovableApiKey,
        data_summary: {
          pillars: pillars.length,
          objectives: objectives.length,
          key_results: keyResults.length,
          initiatives: initiatives.length,
          monthly_actions: monthlyActions.length,
          fca_analyses: fcaAnalyses.length,
          projects: projects.length,
          project_tasks: projectTasks.length,
          golden_circle: !!goldenCircle,
          swot: !!swot,
          beep: beepAssessments.length,
          startups: startupProfiles.length,
          mentoring: mentorSessions.length
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating insights:', error);
    return new Response(
      JSON.stringify({ error: error.message, success: false }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
