import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Authenticate user
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
      .single();

    if (!relation) {
      return new Response(
        JSON.stringify({ success: false, error: 'Sem acesso a esta empresa.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user has manager or admin role in strategic-planning
    const { data: moduleRole } = await supabase
      .from('user_module_roles')
      .select('role, system_modules!inner(slug)')
      .eq('user_id', user.id)
      .eq('active', true)
      .single();

    // Check if any role is manager/admin for strategic-planning
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

    // Get active strategic plan for the company
    const { data: plan } = await supabase
      .from('strategic_plans')
      .select('id')
      .eq('company_id', company_id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!plan) {
      return new Response(
        JSON.stringify({ success: false, error: 'Nenhum plano estratégico ativo encontrado para esta empresa. Crie um plano primeiro.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Execute actions sequentially (order matters for references)
    const results: any[] = [];

    for (let i = 0; i < actions.length; i++) {
      const action = actions[i];
      try {
        if (action.type === 'create_objective') {
          // Find pillar by name
          const { data: pillar } = await supabase
            .from('strategic_pillars')
            .select('id')
            .eq('company_id', company_id)
            .ilike('name', `%${action.data.pillar_name}%`)
            .limit(1)
            .single();

          if (!pillar) {
            results.push({ type: action.type, success: false, error: `Pilar "${action.data.pillar_name}" não encontrado.` });
            continue;
          }

          const { data: obj, error: objError } = await supabase
            .from('strategic_objectives')
            .insert({
              plan_id: plan.id,
              pillar_id: pillar.id,
              title: action.data.title,
              description: action.data.description || null,
              owner_id: user.id,
              target_date: action.data.target_date || null,
              status: 'not_started',
            })
            .select()
            .single();

          if (objError) throw objError;
          results.push({ type: action.type, success: true, id: obj.id, title: obj.title });

        } else if (action.type === 'create_key_result') {
          // Resolve objective reference
          let objectiveId = action.data.objective_id;
          if (action.data.objective_ref !== undefined && results[action.data.objective_ref]?.id) {
            objectiveId = results[action.data.objective_ref].id;
          }

          if (!objectiveId) {
            results.push({ type: action.type, success: false, error: 'Objetivo de referência não encontrado.' });
            continue;
          }

          const krData: any = {
            objective_id: objectiveId,
            title: action.data.title,
            target_value: action.data.target_value || 100,
            unit: action.data.unit || '%',
            owner_id: user.id,
            current_value: action.data.current_value || 0,
            weight: action.data.weight || 1,
          };

          if (action.data.due_date) krData.due_date = action.data.due_date;
          if (action.data.priority) krData.priority = action.data.priority;
          if (action.data.frequency) krData.frequency = action.data.frequency;
          if (action.data.description) krData.description = action.data.description;
          if (action.data.monthly_targets) krData.monthly_targets = action.data.monthly_targets;
          if (action.data.yearly_target) krData.yearly_target = action.data.yearly_target;

          const { data: kr, error: krError } = await supabase
            .from('key_results')
            .insert(krData)
            .select()
            .single();

          if (krError) throw krError;
          results.push({ type: action.type, success: true, id: kr.id, title: kr.title });

        } else if (action.type === 'create_initiative') {
          // Resolve key_result reference
          let keyResultId = action.data.key_result_id;
          if (action.data.key_result_ref !== undefined && results[action.data.key_result_ref]?.id) {
            keyResultId = results[action.data.key_result_ref].id;
          }

          if (!keyResultId) {
            results.push({ type: action.type, success: false, error: 'Resultado-chave de referência não encontrado.' });
            continue;
          }

          const today = new Date().toISOString().split('T')[0];
          const sixMonthsLater = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

          const { data: initiative, error: initError } = await supabase
            .from('kr_initiatives')
            .insert({
              key_result_id: keyResultId,
              company_id: company_id,
              title: action.data.title,
              description: action.data.description || null,
              start_date: action.data.start_date || today,
              end_date: action.data.end_date || sixMonthsLater,
              status: action.data.status || 'planning',
              priority: action.data.priority || 'medium',
              created_by: user.id,
              progress_percentage: action.data.progress_percentage || 0,
            })
            .select()
            .single();

          if (initError) throw initError;
          results.push({ type: action.type, success: true, id: initiative.id, title: initiative.title });

        } else {
          results.push({ type: action.type, success: false, error: `Tipo de ação desconhecido: ${action.type}` });
        }
      } catch (err: any) {
        console.error(`❌ Error executing action ${i} (${action.type}):`, err);
        results.push({ type: action.type, success: false, error: err.message || 'Erro interno' });
      }
    }

    const allSucceeded = results.every(r => r.success);

    console.log(`✅ Atlas Agent Execute - user: ${user.id}, company: ${company_id}, actions: ${actions.length}, success: ${allSucceeded}`);

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
