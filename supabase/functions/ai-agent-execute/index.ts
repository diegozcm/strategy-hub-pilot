import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';

// Normalize action data field names to handle LLM variations
function normalizeObjectiveData(data: any) {
  return {
    title: data.title || data.name,
    description: data.description || data.descricao || null,
    pillar_name: data.pillar_name || data.pilar || data.pillar || data.perspective || null,
    target_date: data.target_date || data.deadline || data.due_date || null,
    weight: data.weight || 1,
  };
}

function normalizeKRData(data: any) {
  return {
    title: data.title || data.name,
    description: data.description || data.descricao || null,
    objective_id: data.objective_id || null,
    objective_ref: data.objective_ref ?? null,
    parent_objective: data.parent_objective || data.parent_objective_title || data.objective_title || null,
    target_value: data.target_value || data.goal_value || data.meta || 100,
    current_value: data.current_value || data.initial_value || 0,
    unit: data.unit || data.metric_type || data.unidade || '%',
    weight: data.weight || 1,
    due_date: data.due_date || data.deadline || null,
    priority: data.priority || null,
    frequency: data.frequency || data.frequencia || null,
    monthly_targets: data.monthly_targets || null,
    yearly_target: data.yearly_target || null,
    aggregation_type: data.aggregation_type || 'sum',
    comparison_type: data.comparison_type || 'cumulative',
    target_direction: data.target_direction || 'maximize',
    start_month: data.start_month || null,
    end_month: data.end_month || null,
    assigned_owner_id: data.assigned_owner_id || null,
    responsible: data.responsible || null,
  };
}

function normalizeInitiativeData(data: any) {
  const VALID_STATUSES = ['planned', 'in_progress', 'completed', 'cancelled', 'on_hold'];
  let status = data.status || 'planned';
  if (status === 'planning') status = 'planned';
  if (!VALID_STATUSES.includes(status)) status = 'planned';

  return {
    title: data.title,
    description: data.description || null,
    key_result_id: data.key_result_id || null,
    key_result_ref: data.key_result_ref ?? null,
    parent_kr: data.parent_kr || data.parent_kr_title || null,
    priority: data.priority || 'medium',
    start_date: data.start_date || null,
    end_date: data.end_date || null,
    status,
    progress_percentage: data.progress_percentage || 0,
    responsible: data.responsible || null,
    budget: data.budget ? parseFloat(String(data.budget)) : null,
  };
}

function normalizePillarData(data: any) {
  return {
    name: data.name || data.title,
    description: data.description || null,
    color: data.color || '#3B82F6',
  };
}

function normalizeProjectData(data: any) {
  return {
    name: data.name || data.title,
    description: data.description || null,
    priority: data.priority || 'medium',
    start_date: data.start_date || null,
    end_date: data.end_date || null,
    budget: data.budget ? parseFloat(String(data.budget)) : null,
    objective_refs: data.objective_refs || [],
    objective_ids: data.objective_ids || [],
    kr_refs: data.kr_refs || [],
    kr_ids: data.kr_ids || [],
  };
}

// Helper: search pillar by name with fallback for & vs e
async function findPillar(supabase: any, companyId: string, pillarName: string) {
  const { data: pillar } = await supabase
    .from('strategic_pillars')
    .select('id')
    .eq('company_id', companyId)
    .ilike('name', `%${pillarName}%`)
    .limit(1)
    .maybeSingle();

  if (pillar) return pillar;

  const altName = pillarName.includes('&')
    ? pillarName.replace(/&/g, 'e')
    : pillarName.replace(/ e /gi, ' & ');

  if (altName === pillarName) return null;

  const { data: altPillar } = await supabase
    .from('strategic_pillars')
    .select('id')
    .eq('company_id', companyId)
    .ilike('name', `%${altName}%`)
    .limit(1)
    .maybeSingle();

  return altPillar;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ success: false, error: 'Autenticação necessária.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const anonClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    const { data: { user }, error: userError } = await anonClient.auth.getUser(token);
    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Sessão expirada. Faça login novamente.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { company_id, actions } = await req.json();
    if (!company_id || !actions || !Array.isArray(actions) || actions.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Dados inválidos. company_id e actions são obrigatórios.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user belongs to company
    const { data: relation } = await supabase
      .from('user_company_relations')
      .select('id')
      .eq('user_id', user.id)
      .eq('company_id', company_id)
      .maybeSingle();

    if (!relation) {
      return new Response(
        JSON.stringify({ success: false, error: 'Sem acesso a esta empresa.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: roles } = await supabase
      .from('user_module_roles')
      .select('role, system_modules!inner(slug)')
      .eq('user_id', user.id)
      .eq('active', true);

    const hasPermission = (roles || []).some((r: any) =>
      r.system_modules?.slug === 'strategic-planning' &&
      (r.role === 'manager' || r.role === 'admin')
    );

    if (!hasPermission) {
      return new Response(
        JSON.stringify({ success: false, error: 'Você precisa ser gestor ou admin do Strategy HUB para criar itens estratégicos.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get active strategic plan
    const { data: plan } = await supabase
      .from('strategic_plans')
      .select('id')
      .eq('company_id', company_id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!plan) {
      return new Response(
        JSON.stringify({ success: false, error: 'Nenhum plano estratégico ativo encontrado para esta empresa. Crie um plano primeiro.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results: any[] = [];

    for (let i = 0; i < actions.length; i++) {
      let action = actions[i];
      try {
        // Normalize: if "action" field used instead of "type", fix it
        if (!action.type && action.action) {
          const { action: actionName, ...rest } = action;
          action = { type: actionName, data: action.data || rest };
        }
        // If "data" is missing, extract all non-meta fields as "data"
        if (!action.data) {
          const { type: _t, action: _a, ...rest } = action;
          if (Object.keys(rest).length > 0) {
            action = { ...action, data: rest };
          } else {
            results.push({ type: action.type || '', success: false, error: 'Dados da ação ausentes.' });
            continue;
          }
        }
        const actionType = (action.type || '').toLowerCase()
          .replace('create_kr', 'create_key_result')
          .replace('update_kr', 'update_key_result')
          .replace('create_strategic_pillar', 'create_pillar')
          .replace('create_strategic_project', 'create_project');

        // ===================== CREATE PILLAR =====================
        if (actionType === 'create_pillar') {
          const d = normalizePillarData(action.data);

          if (!d.name) {
            results.push({ type: actionType, success: false, error: 'Nome do pilar não informado.' });
            continue;
          }

          // Get next order_index
          const { data: existingPillars } = await supabase
            .from('strategic_pillars')
            .select('order_index')
            .eq('company_id', company_id)
            .order('order_index', { ascending: false })
            .limit(1);

          const nextOrder = (existingPillars?.[0]?.order_index ?? -1) + 1;

          const { data: pillar, error: pillarError } = await supabase
            .from('strategic_pillars')
            .insert({
              company_id,
              name: d.name,
              description: d.description,
              color: d.color,
              order_index: nextOrder,
            })
            .select()
            .single();

          if (pillarError) throw pillarError;
          results.push({ type: actionType, success: true, id: pillar.id, title: pillar.name });

        // ===================== CREATE OBJECTIVE =====================
        } else if (actionType === 'create_objective') {
          const d = normalizeObjectiveData(action.data);

          if (!d.pillar_name) {
            results.push({ type: actionType, success: false, error: 'Nome do pilar não informado.' });
            continue;
          }

          // Try finding pillar, also check if a pillar was just created in this batch
          let pillar = await findPillar(supabase, company_id, d.pillar_name);

          if (!pillar) {
            // Check if a pillar was created earlier in this batch with a matching name
            const createdPillar = results.find(r => r.success && r.type === 'create_pillar' && r.title?.toLowerCase().includes(d.pillar_name!.toLowerCase()));
            if (createdPillar) {
              pillar = { id: createdPillar.id };
            }
          }

          if (!pillar) {
            results.push({ type: actionType, success: false, error: `Pilar "${d.pillar_name}" não encontrado.` });
            continue;
          }

          const { data: obj, error: objError } = await supabase
            .from('strategic_objectives')
            .insert({
              plan_id: plan.id,
              pillar_id: pillar.id,
              title: d.title,
              description: d.description,
              owner_id: user.id,
              target_date: d.target_date,
              status: 'not_started',
              weight: d.weight,
            })
            .select()
            .single();

          if (objError) throw objError;
          results.push({ type: actionType, success: true, id: obj.id, title: obj.title });

        // ===================== CREATE KEY RESULT =====================
        } else if (actionType === 'create_key_result') {
          const d = normalizeKRData(action.data);

          let objectiveId = d.objective_id;
          if (!objectiveId && d.objective_ref !== null && results[d.objective_ref]?.id) {
            objectiveId = results[d.objective_ref].id;
          }
          if (!objectiveId && d.parent_objective) {
            const { data: foundObj } = await supabase
              .from('strategic_objectives')
              .select('id')
              .eq('plan_id', plan.id)
              .ilike('title', `%${d.parent_objective}%`)
              .limit(1)
              .maybeSingle();
            if (foundObj) objectiveId = foundObj.id;
          }

          if (!objectiveId) {
            const refResult = d.objective_ref !== null ? results[d.objective_ref] : null;
            const reason = refResult && !refResult.success
              ? ` (o objetivo na posição ${d.objective_ref} falhou: ${refResult.error})`
              : '';
            results.push({ type: actionType, success: false, error: `Objetivo de referência não encontrado.${reason}` });
            continue;
          }

          let unit = d.unit;
          if (unit === 'percentage' || unit === 'percent' || unit === 'porcentagem') unit = '%';
          if (unit === 'unit' || unit === 'units' || unit === 'unidade' || unit === 'unidades' || unit === 'número' || unit === 'numero') unit = 'un';
          if (unit === 'reais' || unit === 'real' || unit === 'BRL') unit = 'R$';

          const krData: any = {
            objective_id: objectiveId,
            title: d.title,
            target_value: d.target_value,
            unit,
            owner_id: user.id,
            current_value: d.current_value,
            weight: d.weight,
          };

          if (d.due_date) krData.due_date = d.due_date;
          if (d.priority) krData.priority = d.priority;
          if (d.frequency) krData.frequency = d.frequency;
          if (d.description) krData.description = d.description;
          if (d.monthly_targets) krData.monthly_targets = d.monthly_targets;
          if (d.yearly_target) krData.yearly_target = d.yearly_target;
          if (d.aggregation_type) krData.aggregation_type = d.aggregation_type;
          if (d.comparison_type) krData.comparison_type = d.comparison_type;
          if (d.target_direction) krData.target_direction = d.target_direction;
          if (d.start_month) krData.start_month = d.start_month;
          if (d.end_month) krData.end_month = d.end_month;
          if (d.assigned_owner_id) krData.assigned_owner_id = d.assigned_owner_id;

          const { data: kr, error: krError } = await supabase
            .from('key_results')
            .insert(krData)
            .select()
            .single();

          if (krError) throw krError;
          results.push({ type: actionType, success: true, id: kr.id, title: kr.title });

        // ===================== CREATE INITIATIVE =====================
        } else if (actionType === 'create_initiative') {
          const d = normalizeInitiativeData(action.data);

          let keyResultId = d.key_result_id;
          if (!keyResultId && d.key_result_ref !== null && results[d.key_result_ref]?.id) {
            keyResultId = results[d.key_result_ref].id;
          }
          if (!keyResultId && d.parent_kr) {
            const batchObjectiveId = results.find(r => r.success && r.type === 'create_objective')?.id;

            let query = supabase
              .from('key_results')
              .select('id, objective_id')
              .ilike('title', `%${d.parent_kr}%`)
              .limit(1);

            if (batchObjectiveId) {
              query = query.eq('objective_id', batchObjectiveId);
            }

            const { data: foundKR } = await query.maybeSingle();
            if (foundKR) keyResultId = foundKR.id;
          }

          if (!keyResultId) {
            const refResult = d.key_result_ref !== null ? results[d.key_result_ref] : null;
            const reason = refResult && !refResult.success
              ? ` (o KR na posição ${d.key_result_ref} falhou: ${refResult.error})`
              : '';
            results.push({ type: actionType, success: false, error: `Resultado-chave de referência não encontrado.${reason}` });
            continue;
          }

          const today = new Date().toISOString().split('T')[0];
          const sixMonthsLater = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

          const { data: initiative, error: initError } = await supabase
            .from('kr_initiatives')
            .insert({
              key_result_id: keyResultId,
              company_id: company_id,
              title: d.title,
              description: d.description,
              start_date: d.start_date || today,
              end_date: d.end_date || sixMonthsLater,
              status: d.status,
              priority: d.priority,
              created_by: user.id,
              progress_percentage: d.progress_percentage,
              responsible: d.responsible,
              budget: d.budget,
            })
            .select()
            .single();

          if (initError) throw initError;
          results.push({ type: actionType, success: true, id: initiative.id, title: initiative.title });

        // ===================== CREATE PROJECT =====================
        } else if (actionType === 'create_project') {
          const d = normalizeProjectData(action.data);

          if (!d.name) {
            results.push({ type: actionType, success: false, error: 'Nome do projeto não informado.' });
            continue;
          }

          const { data: project, error: projError } = await supabase
            .from('strategic_projects')
            .insert({
              plan_id: plan.id,
              company_id: company_id,
              owner_id: user.id,
              name: d.name,
              description: d.description,
              priority: d.priority,
              start_date: d.start_date,
              end_date: d.end_date,
              budget: d.budget,
              status: 'planning',
              progress: 0,
            })
            .select()
            .single();

          if (projError) throw projError;

          // Resolve objective relations
          const objectiveIds: string[] = [...d.objective_ids];
          for (const ref of d.objective_refs) {
            if (results[ref]?.id) objectiveIds.push(results[ref].id);
          }
          for (const objId of objectiveIds) {
            await supabase.from('project_objective_relations').insert({
              project_id: project.id,
              objective_id: objId,
            });
          }

          // Resolve KR relations
          const krIds: string[] = [...d.kr_ids];
          for (const ref of d.kr_refs) {
            if (results[ref]?.id) krIds.push(results[ref].id);
          }
          for (const krId of krIds) {
            await supabase.from('project_kr_relations').insert({
              project_id: project.id,
              kr_id: krId,
            });
          }

          results.push({ type: actionType, success: true, id: project.id, title: project.name });

        // ===================== UPDATE KEY RESULT =====================
        } else if (actionType === 'update_key_result_progress' || actionType === 'update_kr_progress' || actionType === 'update_key_result') {
          const d = action.data;
          const krId = d.key_result_id || d.kr_id;
          const currentValue = d.current_value ?? d.value;

          if (!krId && !d.kr_title) {
            results.push({ type: actionType, success: false, error: 'ID ou título do KR não informado.' });
            continue;
          }

          let resolvedKrId = krId;
          if (!resolvedKrId && d.kr_title) {
            const { data: foundKR } = await supabase
              .from('key_results')
              .select('id')
              .ilike('title', `%${d.kr_title}%`)
              .limit(1)
              .maybeSingle();
            if (foundKR) resolvedKrId = foundKR.id;
          }

          if (!resolvedKrId) {
            results.push({ type: actionType, success: false, error: `KR "${d.kr_title}" não encontrado.` });
            continue;
          }

          const updateData: any = {};
          if (currentValue !== undefined && currentValue !== null) updateData.current_value = currentValue;
          if (d.monthly_actual) updateData.monthly_actual = d.monthly_actual;
          if (d.monthly_targets) updateData.monthly_targets = d.monthly_targets;
          if (d.yearly_target !== undefined && d.yearly_target !== null) updateData.yearly_target = d.yearly_target;
          if (d.target_value !== undefined && d.target_value !== null) updateData.target_value = d.target_value;
          if (d.frequency) updateData.frequency = d.frequency;
          if (d.unit) updateData.unit = d.unit;
          if (d.description) updateData.description = d.description;
          if (d.weight !== undefined && d.weight !== null) updateData.weight = d.weight;
          if (d.due_date) updateData.due_date = d.due_date;

          const { data: updated, error: updateErr } = await supabase
            .from('key_results')
            .update(updateData)
            .eq('id', resolvedKrId)
            .select('id, title')
            .single();

          if (updateErr) throw updateErr;
          results.push({ type: actionType, success: true, id: updated.id, title: updated.title });

        // ===================== UPDATE INITIATIVE =====================
        } else if (actionType === 'update_initiative') {
          const d = action.data;
          const initId = d.initiative_id || d.id;

          if (!initId && !d.initiative_title) {
            results.push({ type: actionType, success: false, error: 'ID ou título da iniciativa não informado.' });
            continue;
          }

          let resolvedInitId = initId;
          if (!resolvedInitId && d.initiative_title) {
            const { data: foundInit } = await supabase
              .from('kr_initiatives')
              .select('id')
              .eq('company_id', company_id)
              .ilike('title', `%${d.initiative_title}%`)
              .limit(1)
              .maybeSingle();
            if (foundInit) resolvedInitId = foundInit.id;
          }

          if (!resolvedInitId) {
            results.push({ type: actionType, success: false, error: `Iniciativa "${d.initiative_title}" não encontrada.` });
            continue;
          }

          const VALID_STATUSES = ['planned', 'in_progress', 'completed', 'cancelled', 'on_hold'];
          const updateData: any = {};
          if (d.title) updateData.title = d.title;
          if (d.description) updateData.description = d.description;
          if (d.status) {
            let status = d.status;
            if (status === 'planning') status = 'planned';
            if (VALID_STATUSES.includes(status)) updateData.status = status;
          }
          if (d.progress_percentage !== undefined && d.progress_percentage !== null) updateData.progress_percentage = d.progress_percentage;
          if (d.priority) updateData.priority = d.priority;
          if (d.start_date) updateData.start_date = d.start_date;
          if (d.end_date) updateData.end_date = d.end_date;

          const { data: updated, error: updateErr } = await supabase
            .from('kr_initiatives')
            .update(updateData)
            .eq('id', resolvedInitId)
            .select('id, title')
            .single();

          if (updateErr) throw updateErr;
          results.push({ type: actionType, success: true, id: updated.id, title: updated.title });

        } else {
          results.push({ type: actionType, success: false, error: `Tipo de ação desconhecido: ${actionType}` });
        }
      } catch (err: any) {
        console.error(`❌ Error executing action ${i} (${action.type}):`, err);
        results.push({ type: action.type, success: false, error: err.message || 'Erro interno' });
      }
    }

    const allSucceeded = results.every(r => r.success);

    console.log(`✅ Atlas Agent Execute - user: ${user.id}, company: ${company_id}, actions: ${actions.length}, success: ${allSucceeded}, results: ${JSON.stringify(results)}`);

    return new Response(
      JSON.stringify({ success: allSucceeded, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Atlas Agent Execute error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Erro interno do servidor.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
