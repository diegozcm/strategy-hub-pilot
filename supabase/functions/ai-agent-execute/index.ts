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
              .select('id, objective_id')
              .ilike('title', `%${d.kr_title}%`)
              .limit(1)
              .maybeSingle();
            // Validate KR belongs to this company's plan
            if (foundKR) {
              const { data: objCheck } = await supabase
                .from('strategic_objectives')
                .select('id')
                .eq('id', foundKR.objective_id)
                .eq('plan_id', plan.id)
                .maybeSingle();
              if (!objCheck) {
                results.push({ type: actionType, success: false, error: `KR "${d.kr_title}" não pertence a esta empresa.` });
                continue;
              }
            }
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
          // variation_threshold com aliases
          const variationVal = d.variation_threshold ?? d.target_variation_value ?? d.variation_rate;
          if (variationVal !== undefined) updateData.variation_threshold = variationVal;

          const { data: updated, error: updateErr } = await supabase
            .from('key_results')
            .update(updateData)
            .eq('id', resolvedKrId)
            .select('id, title')
            .maybeSingle();

          if (updateErr) throw updateErr;
          if (!updated) {
            results.push({ type: actionType, success: false, error: `KR "${d.kr_title || resolvedKrId}" não encontrado ou sem permissão.` });
            continue;
          }
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

        // ===================== UPDATE OBJECTIVE =====================
        } else if (actionType === 'update_objective') {
          const d = action.data;
          const objId = d.objective_id || d.id;

          if (!objId && !d.objective_title) {
            results.push({ type: actionType, success: false, error: 'ID ou título do objetivo não informado.' });
            continue;
          }

          let resolvedId = objId;
          if (!resolvedId && d.objective_title) {
            const { data: found } = await supabase
              .from('strategic_objectives')
              .select('id')
              .eq('plan_id', plan.id)
              .ilike('title', `%${d.objective_title}%`)
              .limit(1)
              .maybeSingle();
            if (found) resolvedId = found.id;
          }

          if (!resolvedId) {
            results.push({ type: actionType, success: false, error: `Objetivo "${d.objective_title}" não encontrado.` });
            continue;
          }

          const updateData: any = {};
          if (d.title) updateData.title = d.title;
          if (d.description) updateData.description = d.description;
          if (d.target_date) updateData.target_date = d.target_date;
          if (d.weight !== undefined && d.weight !== null) updateData.weight = d.weight;
          if (d.status) updateData.status = d.status;

          const { data: updated, error: updateErr } = await supabase
            .from('strategic_objectives')
            .update(updateData)
            .eq('id', resolvedId)
            .select('id, title')
            .single();

          if (updateErr) throw updateErr;
          results.push({ type: actionType, success: true, id: updated.id, title: updated.title });

        // ===================== UPDATE PILLAR =====================
        } else if (actionType === 'update_pillar') {
          const d = action.data;
          const pillarId = d.pillar_id || d.id;

          if (!pillarId && !d.pillar_name) {
            results.push({ type: actionType, success: false, error: 'ID ou nome do pilar não informado.' });
            continue;
          }

          let resolvedId = pillarId;
          if (!resolvedId && d.pillar_name) {
            const found = await findPillar(supabase, company_id, d.pillar_name);
            if (found) resolvedId = found.id;
          }

          if (!resolvedId) {
            results.push({ type: actionType, success: false, error: `Pilar "${d.pillar_name}" não encontrado.` });
            continue;
          }

          const updateData: any = {};
          if (d.name) updateData.name = d.name;
          if (d.description !== undefined) updateData.description = d.description;
          if (d.color) updateData.color = d.color;

          const { data: updated, error: updateErr } = await supabase
            .from('strategic_pillars')
            .update(updateData)
            .eq('id', resolvedId)
            .select('id, name')
            .single();

          if (updateErr) throw updateErr;
          results.push({ type: actionType, success: true, id: updated.id, title: updated.name });

        // ===================== UPDATE PROJECT =====================
        } else if (actionType === 'update_project') {
          const d = action.data;
          const projId = d.project_id || d.id;

          if (!projId && !d.project_name) {
            results.push({ type: actionType, success: false, error: 'ID ou nome do projeto não informado.' });
            continue;
          }

          let resolvedId = projId;
          if (!resolvedId && d.project_name) {
            const { data: found } = await supabase
              .from('strategic_projects')
              .select('id')
              .eq('company_id', company_id)
              .ilike('name', `%${d.project_name}%`)
              .limit(1)
              .maybeSingle();
            if (found) resolvedId = found.id;
          }

          if (!resolvedId) {
            results.push({ type: actionType, success: false, error: `Projeto "${d.project_name}" não encontrado.` });
            continue;
          }

          const updateData: any = {};
          if (d.name) updateData.name = d.name;
          if (d.description !== undefined) updateData.description = d.description;
          if (d.priority) updateData.priority = d.priority;
          if (d.start_date) updateData.start_date = d.start_date;
          if (d.end_date) updateData.end_date = d.end_date;
          if (d.budget !== undefined) updateData.budget = d.budget;
          if (d.status) updateData.status = d.status;
          if (d.progress !== undefined) updateData.progress = d.progress;

          const { data: updated, error: updateErr } = await supabase
            .from('strategic_projects')
            .update(updateData)
            .eq('id', resolvedId)
            .select('id, name')
            .single();

          if (updateErr) throw updateErr;
          results.push({ type: actionType, success: true, id: updated.id, title: updated.name });

        // ===================== DELETE PILLAR =====================
        } else if (actionType === 'delete_pillar') {
          const d = action.data;
          let resolvedId = d.pillar_id || d.id;

          if (!resolvedId && d.pillar_name) {
            const found = await findPillar(supabase, company_id, d.pillar_name);
            if (found) resolvedId = found.id;
          }

          if (!resolvedId) {
            results.push({ type: actionType, success: false, error: `Pilar "${d.pillar_name}" não encontrado.` });
            continue;
          }

          // Cascade: get objectives -> KRs -> delete children
          const { data: objs } = await supabase.from('strategic_objectives').select('id').eq('pillar_id', resolvedId);
          const objIds = (objs || []).map((o: any) => o.id);

          if (objIds.length > 0) {
            const { data: krs } = await supabase.from('key_results').select('id').in('objective_id', objIds);
            const krIds = (krs || []).map((k: any) => k.id);

            if (krIds.length > 0) {
              await supabase.from('kr_actions_history').delete().in('action_id', 
                (await supabase.from('kr_monthly_actions').select('id').in('key_result_id', krIds)).data?.map((a: any) => a.id) || []);
              await supabase.from('kr_monthly_actions').delete().in('key_result_id', krIds);
              await supabase.from('kr_fca').delete().in('key_result_id', krIds);
              await supabase.from('kr_status_reports').delete().in('key_result_id', krIds);
              await supabase.from('key_result_values').delete().in('key_result_id', krIds);
              await supabase.from('key_results_history').delete().in('key_result_id', krIds);
              await supabase.from('kr_initiatives').delete().in('key_result_id', krIds);
              await supabase.from('project_kr_relations').delete().in('kr_id', krIds);
            }

            await supabase.from('key_results').delete().in('objective_id', objIds);
            await supabase.from('project_objective_relations').delete().in('objective_id', objIds);
            await supabase.from('strategic_objectives').delete().eq('pillar_id', resolvedId);
          }

          const { error: delErr } = await supabase.from('strategic_pillars').delete().eq('id', resolvedId);
          if (delErr) throw delErr;
          results.push({ type: actionType, success: true, id: resolvedId, title: d.pillar_name || resolvedId });

        // ===================== DELETE OBJECTIVE =====================
        } else if (actionType === 'delete_objective') {
          const d = action.data;
          let resolvedId = d.objective_id || d.id;

          if (!resolvedId && d.objective_title) {
            const { data: found } = await supabase
              .from('strategic_objectives')
              .select('id')
              .eq('plan_id', plan.id)
              .ilike('title', `%${d.objective_title}%`)
              .limit(1)
              .maybeSingle();
            if (found) resolvedId = found.id;
          }

          if (!resolvedId) {
            results.push({ type: actionType, success: false, error: `Objetivo "${d.objective_title}" não encontrado.` });
            continue;
          }

          // Cascade: KRs -> children
          const { data: krs } = await supabase.from('key_results').select('id').eq('objective_id', resolvedId);
          const krIds = (krs || []).map((k: any) => k.id);

          if (krIds.length > 0) {
            await supabase.from('kr_actions_history').delete().in('action_id',
              (await supabase.from('kr_monthly_actions').select('id').in('key_result_id', krIds)).data?.map((a: any) => a.id) || []);
            await supabase.from('kr_monthly_actions').delete().in('key_result_id', krIds);
            await supabase.from('kr_fca').delete().in('key_result_id', krIds);
            await supabase.from('kr_status_reports').delete().in('key_result_id', krIds);
            await supabase.from('key_result_values').delete().in('key_result_id', krIds);
            await supabase.from('key_results_history').delete().in('key_result_id', krIds);
            await supabase.from('kr_initiatives').delete().in('key_result_id', krIds);
            await supabase.from('project_kr_relations').delete().in('kr_id', krIds);
          }

          await supabase.from('key_results').delete().eq('objective_id', resolvedId);
          await supabase.from('project_objective_relations').delete().eq('objective_id', resolvedId);

          const { error: delErr } = await supabase.from('strategic_objectives').delete().eq('id', resolvedId);
          if (delErr) throw delErr;
          results.push({ type: actionType, success: true, id: resolvedId, title: d.objective_title || resolvedId });

        // ===================== DELETE KEY RESULT =====================
        } else if (actionType === 'delete_key_result' || actionType === 'delete_kr') {
          const d = action.data;
          let resolvedId = d.kr_id || d.key_result_id || d.id;

          if (!resolvedId && d.kr_title) {
            const { data: found } = await supabase
              .from('key_results')
              .select('id')
              .ilike('title', `%${d.kr_title}%`)
              .limit(1)
              .maybeSingle();
            if (found) resolvedId = found.id;
          }

          if (!resolvedId) {
            results.push({ type: actionType, success: false, error: `KR "${d.kr_title}" não encontrado.` });
            continue;
          }

          // Cascade children
          await supabase.from('kr_actions_history').delete().in('action_id',
            (await supabase.from('kr_monthly_actions').select('id').eq('key_result_id', resolvedId)).data?.map((a: any) => a.id) || []);
          await supabase.from('kr_monthly_actions').delete().eq('key_result_id', resolvedId);
          await supabase.from('kr_fca').delete().eq('key_result_id', resolvedId);
          await supabase.from('kr_status_reports').delete().eq('key_result_id', resolvedId);
          await supabase.from('key_result_values').delete().eq('key_result_id', resolvedId);
          await supabase.from('key_results_history').delete().eq('key_result_id', resolvedId);
          await supabase.from('kr_initiatives').delete().eq('key_result_id', resolvedId);
          await supabase.from('project_kr_relations').delete().eq('kr_id', resolvedId);

          const { error: delErr } = await supabase.from('key_results').delete().eq('id', resolvedId);
          if (delErr) throw delErr;
          results.push({ type: actionType, success: true, id: resolvedId, title: d.kr_title || resolvedId });

        // ===================== DELETE INITIATIVE =====================
        } else if (actionType === 'delete_initiative') {
          const d = action.data;
          let resolvedId = d.initiative_id || d.id;

          if (!resolvedId && d.initiative_title) {
            const { data: found } = await supabase
              .from('kr_initiatives')
              .select('id')
              .eq('company_id', company_id)
              .ilike('title', `%${d.initiative_title}%`)
              .limit(1)
              .maybeSingle();
            if (found) resolvedId = found.id;
          }

          if (!resolvedId) {
            results.push({ type: actionType, success: false, error: `Iniciativa "${d.initiative_title}" não encontrada.` });
            continue;
          }

          const { error: delErr } = await supabase.from('kr_initiatives').delete().eq('id', resolvedId);
          if (delErr) throw delErr;
          results.push({ type: actionType, success: true, id: resolvedId, title: d.initiative_title || resolvedId });

        // ===================== DELETE PROJECT =====================
        } else if (actionType === 'delete_project') {
          const d = action.data;
          let resolvedId = d.project_id || d.id;

          if (!resolvedId && d.project_name) {
            const { data: found } = await supabase
              .from('strategic_projects')
              .select('id')
              .eq('company_id', company_id)
              .ilike('name', `%${d.project_name}%`)
              .limit(1)
              .maybeSingle();
            if (found) resolvedId = found.id;
          }

          if (!resolvedId) {
            results.push({ type: actionType, success: false, error: `Projeto "${d.project_name}" não encontrado.` });
            continue;
          }

          // Cascade children
          await supabase.from('project_members').delete().eq('project_id', resolvedId);
          await supabase.from('project_tasks').delete().eq('project_id', resolvedId);
          await supabase.from('project_kr_relations').delete().eq('project_id', resolvedId);
          await supabase.from('project_objective_relations').delete().eq('project_id', resolvedId);

          const { error: delErr } = await supabase.from('strategic_projects').delete().eq('id', resolvedId);
          if (delErr) throw delErr;
          results.push({ type: actionType, success: true, id: resolvedId, title: d.project_name || resolvedId });

        // ===================== BULK IMPORT =====================
        } else if (actionType === 'bulk_import') {
          let importPayload = action.data;

          if (!importPayload || typeof importPayload !== 'object') {
            results.push({ type: actionType, success: false, error: 'Dados de importação inválidos.' });
            continue;
          }

          // Unwrap nested "data" envelope if Atlas wrapped it
          if (importPayload.data && typeof importPayload.data === 'object' && (importPayload.data.pillars || importPayload.data.strategic_pillars)) {
            importPayload = importPayload.data;
          }

          // Detect nested hierarchical format (pillars array with embedded objectives/key_results)
          if (importPayload.pillars && Array.isArray(importPayload.pillars)) {
            try {
              const createdKRs: Record<string, string> = {}; // title -> id
              let pillarCount = 0, objCount = 0, krCount = 0, projCount = 0, linkCount = 0;
              const errors: string[] = [];

              // Get next order_index for pillars
              const { data: existingPillars } = await supabase
                .from('strategic_pillars')
                .select('order_index')
                .eq('company_id', company_id)
                .order('order_index', { ascending: false })
                .limit(1);
              let nextOrder = (existingPillars?.[0]?.order_index ?? -1) + 1;

              for (const pillarData of importPayload.pillars) {
                const pillarName = pillarData.name || pillarData.title;
                if (!pillarName) { errors.push('Pilar sem nome, ignorado.'); continue; }

                const { data: pillar, error: pErr } = await supabase
                  .from('strategic_pillars')
                  .insert({
                    company_id,
                    name: pillarName,
                    description: pillarData.description || null,
                    color: pillarData.color || '#3B82F6',
                    order_index: nextOrder++,
                  })
                  .select('id')
                  .single();

                if (pErr) { errors.push(`Pilar "${pillarName}": ${pErr.message}`); continue; }
                pillarCount++;

                const objectives = pillarData.objectives || [];
                for (const objData of objectives) {
                  const objTitle = objData.title || objData.name;
                  if (!objTitle) { errors.push('Objetivo sem título, ignorado.'); continue; }

                  const { data: obj, error: oErr } = await supabase
                    .from('strategic_objectives')
                    .insert({
                      plan_id: plan.id,
                      pillar_id: pillar.id,
                      title: objTitle,
                      description: objData.description || null,
                      owner_id: user.id,
                      target_date: objData.target_date || null,
                      status: 'not_started',
                      weight: objData.weight || 1,
                    })
                    .select('id')
                    .single();

                  if (oErr) { errors.push(`Objetivo "${objTitle}": ${oErr.message}`); continue; }
                  objCount++;

                  const keyResults = objData.key_results || [];
                  for (const krData of keyResults) {
                    const krTitle = krData.title || krData.name;
                    if (!krTitle) { errors.push('KR sem título, ignorado.'); continue; }

                    // Normalize unit
                    let unit = krData.unit || '%';
                    if (unit === 'percentage' || unit === 'percent' || unit === 'porcentagem') unit = '%';
                    if (unit === 'unit' || unit === 'units' || unit === 'unidade' || unit === 'unidades' || unit === 'número' || unit === 'numero') unit = 'un';
                    if (unit === 'reais' || unit === 'real' || unit === 'BRL') unit = 'R$';

                    const krInsert: any = {
                      objective_id: obj.id,
                      title: krTitle,
                      description: krData.description || null,
                      target_value: krData.target_value || 100,
                      current_value: krData.current_value || 0,
                      unit,
                      owner_id: user.id,
                      weight: krData.weight || 1,
                    };

                    if (krData.frequency) krInsert.frequency = krData.frequency;
                    if (krData.monthly_targets) krInsert.monthly_targets = krData.monthly_targets;
                    if (krData.yearly_target != null) krInsert.yearly_target = krData.yearly_target;
                    if (krData.start_month) krInsert.start_month = krData.start_month;
                    if (krData.end_month) krInsert.end_month = krData.end_month;
                    if (krData.aggregation_type) krInsert.aggregation_type = krData.aggregation_type;
                    if (krData.comparison_type) krInsert.comparison_type = krData.comparison_type;
                    if (krData.target_direction) krInsert.target_direction = krData.target_direction;
                    if (krData.due_date) krInsert.due_date = krData.due_date;
                    if (krData.responsible) krInsert.responsible = krData.responsible;

                    const { data: kr, error: kErr } = await supabase
                      .from('key_results')
                      .insert(krInsert)
                      .select('id')
                      .single();

                    if (kErr) { errors.push(`KR "${krTitle}": ${kErr.message}`); continue; }
                    krCount++;
                    createdKRs[krTitle] = kr.id;
                  }
                }
              }

              // Process projects
              const projects = importPayload.projects || [];
              const VALID_PROJECT_STATUSES = ['planning', 'active', 'on_hold', 'completed', 'cancelled'];
              for (const projData of projects) {
                const projName = projData.name || projData.title;
                if (!projName) { errors.push('Projeto sem nome, ignorado.'); continue; }

                let status = (projData.status || 'planning').toLowerCase();
                if (status === 'in_progress') status = 'active';
                if (!VALID_PROJECT_STATUSES.includes(status)) status = 'planning';

                const { data: proj, error: prErr } = await supabase
                  .from('strategic_projects')
                  .insert({
                    plan_id: plan.id,
                    company_id,
                    owner_id: user.id,
                    name: projName,
                    description: projData.description || null,
                    status,
                    progress: projData.progress || 0,
                    priority: projData.priority || 'medium',
                    start_date: projData.start_date || null,
                    end_date: projData.end_date || null,
                    budget: projData.budget ? parseFloat(String(projData.budget)) : null,
                  })
                  .select('id')
                  .single();

                if (prErr) { errors.push(`Projeto "${projName}": ${prErr.message}`); continue; }
                projCount++;

                // Link KRs by title matching
                const linkedKrs = projData.linked_krs || [];
                for (const krRef of linkedKrs) {
                  // Find KR by partial title match
                  let krId: string | null = null;
                  const refLower = (krRef || '').toLowerCase();
                  for (const [title, id] of Object.entries(createdKRs)) {
                    if (title.toLowerCase().includes(refLower) || refLower.includes(title.toLowerCase())) {
                      krId = id as string;
                      break;
                    }
                  }
                  // Also try exact prefix match (e.g. "KR01" matches "KR01 - ...")
                  if (!krId) {
                    for (const [title, id] of Object.entries(createdKRs)) {
                      if (title.toLowerCase().startsWith(refLower.split(' - ')[0].split(' — ')[0].trim())) {
                        krId = id as string;
                        break;
                      }
                    }
                  }

                  if (krId) {
                    const { error: linkErr } = await supabase
                      .from('project_kr_relations')
                      .insert({ project_id: proj.id, kr_id: krId });
                    if (!linkErr) linkCount++;
                  } else {
                    errors.push(`Projeto "${projName}": KR "${krRef}" não encontrado para vincular.`);
                  }
                }
              }

              results.push({
                type: actionType,
                success: true,
                title: 'Importação em massa concluída',
                details: {
                  pillars: pillarCount,
                  objectives: objCount,
                  key_results: krCount,
                  projects: projCount,
                  kr_links: linkCount,
                  errors: errors.length > 0 ? errors : undefined,
                },
              });
            } catch (bulkErr: any) {
              results.push({ type: actionType, success: false, error: `Erro na importação hierárquica: ${bulkErr.message}` });
            }
          } else {
            // Fallback: flat format — call import-company-data
            try {
              const importResponse = await fetch(`${supabaseUrl}/functions/v1/import-company-data`, {
                method: 'POST',
                headers: {
                  'Authorization': authHeader,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  company_id,
                  mode: 'merge',
                  data: importPayload,
                }),
              });

              const importResult = await importResponse.json();

              if (importResponse.ok && importResult.success !== false) {
                results.push({
                  type: actionType,
                  success: true,
                  title: 'Importação em massa concluída',
                  details: {
                    total_records: importResult.total_records,
                    tables_imported: importResult.tables_imported,
                  },
                });
              } else {
                results.push({
                  type: actionType,
                  success: false,
                  error: importResult.error || 'Erro na importação em massa',
                  details: importResult.errors,
                });
              }
            } catch (importErr: any) {
              results.push({ type: actionType, success: false, error: `Erro na importação: ${importErr.message}` });
            }
          }

        // ===================== CREATE FCA =====================
        } else if (actionType === 'create_fca') {
          const d = action.data;
          const krId = d.kr_id || d.key_result_id;
          const krTitle = d.kr_title;

          if (!krId && !krTitle) {
            results.push({ type: actionType, success: false, error: 'ID ou título do KR não informado para criar FCA.' });
            continue;
          }

          let resolvedKrId = krId;
          if (!resolvedKrId && krTitle) {
            const { data: foundKR } = await supabase
              .from('key_results')
              .select('id, objective_id')
              .ilike('title', `%${krTitle}%`)
              .limit(1)
              .maybeSingle();
            if (foundKR) {
              // Validate KR belongs to this company
              const { data: objCheck } = await supabase
                .from('strategic_objectives')
                .select('id')
                .eq('id', foundKR.objective_id)
                .eq('plan_id', plan.id)
                .maybeSingle();
              if (objCheck) {
                resolvedKrId = foundKR.id;
              }
            }
          }

          if (!resolvedKrId) {
            results.push({ type: actionType, success: false, error: `KR "${krTitle}" não encontrado.` });
            continue;
          }

          if (!d.title || !d.fact || !d.cause) {
            results.push({ type: actionType, success: false, error: 'Campos obrigatórios: title, fact, cause.' });
            continue;
          }

          const fcaInsert: any = {
            key_result_id: resolvedKrId,
            title: d.title,
            fact: d.fact,
            cause: d.cause,
            created_by: user.id,
            priority: d.priority || 'medium',
            status: d.status || 'active',
          };
          if (d.description) fcaInsert.description = d.description;
          if (d.linked_update_month) fcaInsert.linked_update_month = d.linked_update_month;
          if (d.linked_update_value !== undefined) fcaInsert.linked_update_value = d.linked_update_value;

          const { data: fca, error: fcaErr } = await supabase
            .from('kr_fca')
            .insert(fcaInsert)
            .select('id, title')
            .maybeSingle();

          if (fcaErr) throw fcaErr;
          if (!fca) {
            results.push({ type: actionType, success: false, error: 'Erro ao criar FCA (sem retorno).' });
            continue;
          }
          results.push({ type: actionType, success: true, id: fca.id, title: fca.title });

        // ===================== CREATE MEETING =====================
        } else if (actionType === 'create_meeting') {
          const d = action.data;
          if (!d.title || !d.meeting_type || !d.scheduled_date) {
            results.push({ type: actionType, success: false, error: 'Campos obrigatórios: title, meeting_type, scheduled_date.' });
            continue;
          }

          const meetingInsert: any = {
            company_id,
            created_by: user.id,
            title: d.title,
            meeting_type: d.meeting_type,
            scheduled_date: d.scheduled_date,
            status: 'scheduled',
          };
          if (d.scheduled_time) meetingInsert.scheduled_time = d.scheduled_time;
          if (d.duration_minutes) meetingInsert.duration_minutes = parseInt(String(d.duration_minutes));
          if (d.location) meetingInsert.location = d.location;
          if (d.notes) meetingInsert.notes = d.notes;

          const { data: meeting, error: meetingErr } = await supabase
            .from('governance_meetings')
            .insert(meetingInsert)
            .select('id, title')
            .single();

          if (meetingErr) throw meetingErr;

          // Create agenda items if provided
          if (d.agenda_items && Array.isArray(d.agenda_items)) {
            for (let ai = 0; ai < d.agenda_items.length; ai++) {
              const item = d.agenda_items[ai];
              await supabase.from('governance_agenda_items').insert({
                meeting_id: meeting.id,
                title: item.title,
                description: item.description || null,
                order_index: ai,
                created_by: user.id,
              });
            }
          }

          results.push({ type: actionType, success: true, id: meeting.id, title: meeting.title });

        // ===================== UPDATE MEETING =====================
        } else if (actionType === 'update_meeting') {
          const d = action.data;
          let resolvedId = d.meeting_id || d.id;

          if (!resolvedId && d.meeting_title) {
            const { data: found } = await supabase
              .from('governance_meetings')
              .select('id')
              .eq('company_id', company_id)
              .ilike('title', `%${d.meeting_title}%`)
              .limit(1)
              .maybeSingle();
            if (found) resolvedId = found.id;
          }

          if (!resolvedId) {
            results.push({ type: actionType, success: false, error: `Reunião "${d.meeting_title}" não encontrada.` });
            continue;
          }

          const updateData: any = {};
          if (d.title) updateData.title = d.title;
          if (d.scheduled_date) updateData.scheduled_date = d.scheduled_date;
          if (d.scheduled_time) updateData.scheduled_time = d.scheduled_time;
          if (d.status) updateData.status = d.status;
          if (d.notes !== undefined) updateData.notes = d.notes;
          if (d.location !== undefined) updateData.location = d.location;
          if (d.duration_minutes) updateData.duration_minutes = parseInt(String(d.duration_minutes));
          if (d.meeting_type) updateData.meeting_type = d.meeting_type;

          const { data: updated, error: updateErr } = await supabase
            .from('governance_meetings')
            .update(updateData)
            .eq('id', resolvedId)
            .select('id, title')
            .single();

          if (updateErr) throw updateErr;
          results.push({ type: actionType, success: true, id: updated.id, title: updated.title });

        // ===================== DELETE MEETING =====================
        } else if (actionType === 'delete_meeting') {
          const d = action.data;
          let resolvedId = d.meeting_id || d.id;

          if (!resolvedId && d.meeting_title) {
            const { data: found } = await supabase
              .from('governance_meetings')
              .select('id')
              .eq('company_id', company_id)
              .ilike('title', `%${d.meeting_title}%`)
              .limit(1)
              .maybeSingle();
            if (found) resolvedId = found.id;
          }

          if (!resolvedId) {
            results.push({ type: actionType, success: false, error: `Reunião "${d.meeting_title}" não encontrada.` });
            continue;
          }

          // Cascade: agenda items and atas
          await supabase.from('governance_agenda_items').delete().eq('meeting_id', resolvedId);
          await supabase.from('governance_atas').delete().eq('meeting_id', resolvedId);

          const { error: delErr } = await supabase.from('governance_meetings').delete().eq('id', resolvedId);
          if (delErr) throw delErr;
          results.push({ type: actionType, success: true, id: resolvedId, title: d.meeting_title || resolvedId });

        // ===================== CREATE AGENDA ITEM =====================
        } else if (actionType === 'create_agenda_item') {
          const d = action.data;
          let meetingId = d.meeting_id;

          if (!meetingId && d.meeting_title) {
            const { data: found } = await supabase
              .from('governance_meetings')
              .select('id')
              .eq('company_id', company_id)
              .ilike('title', `%${d.meeting_title}%`)
              .limit(1)
              .maybeSingle();
            if (found) meetingId = found.id;
          }

          if (!meetingId) {
            results.push({ type: actionType, success: false, error: `Reunião "${d.meeting_title}" não encontrada.` });
            continue;
          }

          if (!d.title) {
            results.push({ type: actionType, success: false, error: 'Título do item de pauta é obrigatório.' });
            continue;
          }

          // Auto-calculate order_index
          const { data: existingItems } = await supabase
            .from('governance_agenda_items')
            .select('order_index')
            .eq('meeting_id', meetingId)
            .order('order_index', { ascending: false })
            .limit(1);

          const nextOrder = (existingItems?.[0]?.order_index ?? -1) + 1;

          const { data: agendaItem, error: agendaErr } = await supabase
            .from('governance_agenda_items')
            .insert({
              meeting_id: meetingId,
              title: d.title,
              description: d.description || null,
              order_index: nextOrder,
              created_by: user.id,
            })
            .select('id, title')
            .single();

          if (agendaErr) throw agendaErr;
          results.push({ type: actionType, success: true, id: agendaItem.id, title: agendaItem.title });

        // ===================== UPDATE GOLDEN CIRCLE =====================
        } else if (actionType === 'update_golden_circle') {
          const d = action.data;
          const upsertData: any = {
            company_id,
            created_by: user.id,
            updated_by: user.id,
          };
          if (d.why_question !== undefined) upsertData.why_question = d.why_question;
          if (d.how_question !== undefined) upsertData.how_question = d.how_question;
          if (d.what_question !== undefined) upsertData.what_question = d.what_question;

          const { data: gc, error: gcErr } = await supabase
            .from('golden_circle')
            .upsert(upsertData, { onConflict: 'company_id' })
            .select('id')
            .single();

          if (gcErr) throw gcErr;
          results.push({ type: actionType, success: true, id: gc.id, title: 'Golden Circle atualizado' });

        // ===================== UPDATE SWOT =====================
        } else if (actionType === 'update_swot') {
          const d = action.data;
          const upsertData: any = {
            company_id,
            created_by: user.id,
            updated_by: user.id,
          };
          if (d.strengths !== undefined) upsertData.strengths = d.strengths;
          if (d.weaknesses !== undefined) upsertData.weaknesses = d.weaknesses;
          if (d.opportunities !== undefined) upsertData.opportunities = d.opportunities;
          if (d.threats !== undefined) upsertData.threats = d.threats;

          const { data: swot, error: swotErr } = await supabase
            .from('swot_analysis')
            .upsert(upsertData, { onConflict: 'company_id' })
            .select('id')
            .single();

          if (swotErr) throw swotErr;
          results.push({ type: actionType, success: true, id: swot.id, title: 'Análise SWOT atualizada' });

        // ===================== UPDATE VISION ALIGNMENT =====================
        } else if (actionType === 'update_vision_alignment') {
          const d = action.data;
          const upsertData: any = {
            company_id,
            created_by: user.id,
            updated_by: user.id,
          };
          if (d.shared_objectives !== undefined) upsertData.shared_objectives = d.shared_objectives;
          if (d.shared_commitments !== undefined) upsertData.shared_commitments = d.shared_commitments;
          if (d.shared_resources !== undefined) upsertData.shared_resources = d.shared_resources;
          if (d.shared_risks !== undefined) upsertData.shared_risks = d.shared_risks;

          const { data: va, error: vaErr } = await supabase
            .from('vision_alignment')
            .upsert(upsertData, { onConflict: 'company_id' })
            .select('id')
            .single();

          if (vaErr) throw vaErr;
          results.push({ type: actionType, success: true, id: va.id, title: 'Alinhamento de Visão atualizado' });

        // ===================== CREATE TASK =====================
        } else if (actionType === 'create_task') {
          const d = action.data;

          if (!d.title) {
            results.push({ type: actionType, success: false, error: 'Título da task não informado.' });
            continue;
          }

          // Resolve project_id
          let projectId = d.project_id;
          if (!projectId && d.project_ref !== undefined && d.project_ref !== null && results[d.project_ref]?.id) {
            projectId = results[d.project_ref].id;
          }
          if (!projectId && d.project_name) {
            const { data: found } = await supabase
              .from('strategic_projects')
              .select('id')
              .eq('company_id', company_id)
              .ilike('name', `%${d.project_name}%`)
              .limit(1)
              .maybeSingle();
            if (found) projectId = found.id;
          }

          if (!projectId) {
            results.push({ type: actionType, success: false, error: `Projeto não encontrado para a task "${d.title}".` });
            continue;
          }

          // Calculate next position
          const { data: maxPosData } = await supabase
            .from('project_tasks')
            .select('position')
            .eq('project_id', projectId)
            .order('position', { ascending: false })
            .limit(1);
          const nextPosition = ((maxPosData?.[0]?.position ?? -1) + 1);

          const VALID_TASK_STATUSES = ['todo', 'in_progress', 'review', 'done'];
          const VALID_TASK_PRIORITIES = ['low', 'medium', 'high', 'critical'];
          const rawStatus = d.status || 'todo';
          const sanitizedStatus = VALID_TASK_STATUSES.includes(rawStatus) ? rawStatus : 'todo';
          const rawPriority = d.priority || 'medium';
          const sanitizedPriority = VALID_TASK_PRIORITIES.includes(rawPriority) ? rawPriority : 'medium';

          const taskData: any = {
            project_id: projectId,
            title: d.title,
            status: sanitizedStatus,
            priority: sanitizedPriority,
            position: nextPosition,
          };
          if (d.description) taskData.description = d.description;
          if (d.due_date) taskData.due_date = d.due_date;
          if (d.estimated_hours) taskData.estimated_hours = d.estimated_hours;

          const { data: task, error: taskErr } = await supabase
            .from('project_tasks')
            .insert(taskData)
            .select('id, title')
            .single();

          if (taskErr) throw taskErr;
          results.push({ type: actionType, success: true, id: task.id, title: task.title });

        // ===================== UPDATE TASK =====================
        } else if (actionType === 'update_task') {
          const d = action.data;
          let resolvedId = d.task_id || d.id;

          if (!resolvedId && d.task_title) {
            let query = supabase.from('project_tasks').select('id, project_id').ilike('title', `%${d.task_title}%`);
            if (d.project_name) {
              const { data: proj } = await supabase.from('strategic_projects').select('id').eq('company_id', company_id).ilike('name', `%${d.project_name}%`).limit(1).maybeSingle();
              if (proj) query = query.eq('project_id', proj.id);
            }
            const { data: found } = await query.limit(1).maybeSingle();
            if (found) resolvedId = found.id;
          }

          if (!resolvedId) {
            results.push({ type: actionType, success: false, error: `Task "${d.task_title || ''}" não encontrada.` });
            continue;
          }

          const VALID_STATUSES_UPD = ['todo', 'in_progress', 'review', 'done'];
          const VALID_PRIORITIES_UPD = ['low', 'medium', 'high', 'critical'];
          const updateData: any = {};
          if (d.title) updateData.title = d.title;
          if (d.description !== undefined) updateData.description = d.description;
          if (d.status) updateData.status = VALID_STATUSES_UPD.includes(d.status) ? d.status : 'todo';
          if (d.priority) updateData.priority = VALID_PRIORITIES_UPD.includes(d.priority) ? d.priority : 'medium';
          if (d.due_date) updateData.due_date = d.due_date;
          if (d.estimated_hours !== undefined) updateData.estimated_hours = d.estimated_hours;
          if (d.actual_hours !== undefined) updateData.actual_hours = d.actual_hours;

          const { data: updated, error: updateErr } = await supabase
            .from('project_tasks')
            .update(updateData)
            .eq('id', resolvedId)
            .select('id, title')
            .single();

          if (updateErr) throw updateErr;
          results.push({ type: actionType, success: true, id: updated.id, title: updated.title });

        // ===================== DELETE TASK =====================
        } else if (actionType === 'delete_task') {
          const d = action.data;
          let resolvedId = d.task_id || d.id;

          if (!resolvedId && d.task_title) {
            let query = supabase.from('project_tasks').select('id').ilike('title', `%${d.task_title}%`);
            if (d.project_name) {
              const { data: proj } = await supabase.from('strategic_projects').select('id').eq('company_id', company_id).ilike('name', `%${d.project_name}%`).limit(1).maybeSingle();
              if (proj) query = query.eq('project_id', proj.id);
            }
            const { data: found } = await query.limit(1).maybeSingle();
            if (found) resolvedId = found.id;
          }

          if (!resolvedId) {
            results.push({ type: actionType, success: false, error: `Task "${d.task_title || ''}" não encontrada.` });
            continue;
          }

          const { error: delErr } = await supabase.from('project_tasks').delete().eq('id', resolvedId);
          if (delErr) throw delErr;
          results.push({ type: actionType, success: true, id: resolvedId, title: d.task_title || resolvedId });

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
