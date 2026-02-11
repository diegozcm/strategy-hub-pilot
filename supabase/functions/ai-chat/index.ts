import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Verify JWT token from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('❌ No authorization header provided');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'authentication_required',
          response: 'Autenticação necessária para usar o chat de IA.' 
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    // Create client with user token to verify identity
    const supabaseClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: {
        headers: { Authorization: `Bearer ${token}` }
      }
    });

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      console.error('❌ Invalid token or user not found:', userError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'invalid_token',
          response: 'Sessão expirada. Por favor, faça login novamente.' 
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const authenticatedUserId = user.id;
    console.log(`🔐 Authenticated user: ${authenticatedUserId} (${user.email})`);

    const { message, session_id, user_id, company_id } = await req.json();

    // Verify the user_id in request matches the authenticated user
    if (user_id && user_id !== authenticatedUserId) {
      console.error(`❌ User ID mismatch: request=${user_id}, authenticated=${authenticatedUserId}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'forbidden',
          response: 'Você não tem permissão para esta ação.' 
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use authenticated user ID for all operations
    const validUserId = authenticatedUserId;
    console.log(`🤖 AI Chat - user: ${validUserId}, company: ${company_id}`);

    if (!LOVABLE_API_KEY) {
      console.error('❌ LOVABLE_API_KEY não configurada');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'API key não configurada',
          response: 'Desculpe, o serviço de IA não está configurado corretamente.' 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create admin client for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user belongs to the company
    const { data: userCompanyRelation, error: relationError } = await supabase
      .from('user_company_relations')
      .select('id')
      .eq('user_id', validUserId)
      .eq('company_id', company_id)
      .single();

    if (relationError || !userCompanyRelation) {
      console.error(`❌ User ${validUserId} is not a member of company ${company_id}`);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'forbidden',
          response: 'Você não tem acesso a esta empresa.' 
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se a empresa tem AI habilitado e buscar nome
    const { data: companyData } = await supabase
      .from('companies')
      .select('ai_enabled, name')
      .eq('id', company_id)
      .single();

    if (!companyData?.ai_enabled) {
      console.log(`⚠️ Company ${company_id} não tem AI habilitada`);
      return new Response(
        JSON.stringify({ 
          success: false,
          response: 'O acesso à IA não está habilitado para sua empresa. Entre em contato com o administrador.' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const companyName = companyData.name || 'Empresa';

    // Buscar configurações de IA da empresa
    const { data: aiSettings } = await supabase
      .from('ai_company_settings')
      .select('model, temperature, max_tokens, system_prompt')
      .eq('company_id', company_id)
      .single();

    const model = aiSettings?.model || 'google/gemini-3-flash-preview';
    const temperature = aiSettings?.temperature || 0.7;
    const maxTokens = aiSettings?.max_tokens || 2000;
    const systemPrompt = aiSettings?.system_prompt || 
      `Você é o Account Pilot, um consultor estratégico inteligente da plataforma COFOUND. Você auxilia gestores e líderes da empresa "${companyName}" com análises estratégicas, diagnósticos de performance e recomendações práticas.

Diretrizes:
- Seja profissional, objetivo e empático
- Use os dados reais da empresa para fundamentar suas análises
- Ofereça insights acionáveis e específicos, não genéricos
- Quando não houver dados suficientes, indique claramente e sugira próximos passos
- Responda em português brasileiro de forma natural e humanizada
- Use formatação markdown para organizar suas respostas (títulos, listas, negrito)
- Ao identificar riscos, sempre sugira ações concretas de mitigação`;

    // Buscar dados contextuais FILTRADOS POR COMPANY_ID
    console.log(`📊 Buscando dados contextuais para company_id: ${company_id}`);

    // 1. Buscar strategic_plans da empresa
    const { data: plans } = await supabase
      .from('strategic_plans')
      .select('id')
      .eq('company_id', company_id);
    
    const planIds = plans?.map(p => p.id) || [];
    console.log(`📋 Planos encontrados: ${planIds.length}`);

    // 2. Buscar strategic_objectives dos planos
    const { data: objectives } = await supabase
      .from('strategic_objectives')
      .select('id, title, progress, status, target_date')
      .in('plan_id', planIds)
      .limit(20);
    
    const objectiveIds = objectives?.map(o => o.id) || [];
    console.log(`🎯 Objetivos encontrados: ${objectiveIds.length}`);

    // 3. Buscar key_results dos objetivos
    const { data: keyResults } = await supabase
      .from('key_results')
      .select('title, current_value, target_value, unit, due_date, priority')
      .in('objective_id', objectiveIds)
      .limit(30);
    
    console.log(`📊 KRs encontrados: ${keyResults?.length || 0}`);

    // 4. Buscar strategic_projects dos planos
    const { data: projects } = await supabase
      .from('strategic_projects')
      .select('name, progress, status, start_date, end_date, priority')
      .in('plan_id', planIds)
      .limit(20);
    
    console.log(`🚀 Projetos encontrados: ${projects?.length || 0}`);

    // 5. Buscar dados do Startup Hub (se aplicável)
    const { data: startupProfile } = await supabase
      .from('startup_hub_profiles')
      .select('*')
      .eq('company_id', company_id)
      .single();

    const { data: mentoringSessions } = await supabase
      .from('mentoring_sessions')
      .select('session_date, session_type, status, notes')
      .eq('startup_company_id', company_id)
      .order('session_date', { ascending: false })
      .limit(10);

    // Construir contexto rico
    const contextData = {
      objectives: objectives || [],
      keyResults: keyResults || [],
      projects: projects || [],
      startupProfile: startupProfile || null,
      mentoringSessions: mentoringSessions || []
    };

    const contextPrompt = `
Dados disponíveis de ${companyName}:

${contextData.objectives.length > 0 ? `
📊 Strategy Hub - Objetivos Estratégicos:
${contextData.objectives.map(obj => `• ${obj.title}: ${obj.progress || 0}% concluído (Status: ${obj.status})`).join('\n')}
` : ''}

${contextData.keyResults.length > 0 ? `
📊 Strategy Hub - Resultados Chave:
${contextData.keyResults.map(kr => `• ${kr.title}: ${kr.current_value || 0}${kr.unit} de ${kr.target_value}${kr.unit} (${Math.round(((kr.current_value || 0) / kr.target_value) * 100)}% concluído)`).join('\n')}
` : ''}

${contextData.projects.length > 0 ? `
🚀 Projetos Estratégicos:
${contextData.projects.map(proj => `• ${proj.name}: ${proj.progress || 0}% concluído (Status: ${proj.status})`).join('\n')}
` : ''}

${contextData.startupProfile ? `
🎯 Startup Hub:
• Startup: ${contextData.startupProfile.startup_name || 'Não informado'}
• Setor: ${contextData.startupProfile.sector || 'Não informado'}
• Estágio: ${contextData.startupProfile.stage || 'Não informado'}
` : ''}

${contextData.mentoringSessions.length > 0 ? `
👥 Sessões de Mentoria Recentes:
${contextData.mentoringSessions.map(s => `• ${s.session_date}: ${s.session_type} (${s.status})`).join('\n')}
` : ''}

Pergunta do usuário: "${message}"

Responda de forma clara, objetiva e acionável, baseando-se EXCLUSIVAMENTE nos dados acima.
`.trim();

    console.log(`🤖 Chamando Lovable AI (modelo: ${model})`);
    console.log(`📝 Contexto: ${contextData.objectives.length} objetivos, ${contextData.keyResults.length} KRs, ${contextData.projects.length} projetos`);

    // Chamar Lovable AI Gateway
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: contextPrompt }
        ],
        temperature,
        max_tokens: maxTokens,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error(`❌ Lovable AI error (${aiResponse.status}):`, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'rate_limit',
            response: 'O limite de requisições foi atingido. Por favor, tente novamente em alguns instantes.' 
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'payment_required',
            response: 'Os créditos de IA foram esgotados. Entre em contato com o administrador.' 
          }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      throw new Error(`AI Gateway error: ${errorText}`);
    }

    const aiData = await aiResponse.json();
    const assistantMessage = aiData.choices?.[0]?.message?.content || 'Desculpe, não consegui processar sua pergunta.';

    console.log('✅ Resposta gerada com sucesso');

    // Log de analytics
    await supabase.from('ai_analytics').insert({
      user_id: validUserId,
      event_type: 'chat_completion',
      event_data: {
        company_id,
        session_id,
        model_used: model,
        prompt_tokens: aiData.usage?.prompt_tokens,
        completion_tokens: aiData.usage?.completion_tokens,
        total_tokens: aiData.usage?.total_tokens,
        context_summary: {
          objectives_count: contextData.objectives.length,
          key_results_count: contextData.keyResults.length,
          projects_count: contextData.projects.length,
          has_startup_profile: !!contextData.startupProfile,
          mentoring_sessions_count: contextData.mentoringSessions.length
        }
      }
    });

    return new Response(
      JSON.stringify({ 
        success: true,
        response: assistantMessage,
        model_used: model,
        company_id,
        context_summary: {
          objectives: contextData.objectives.length,
          keyResults: contextData.keyResults.length,
          projects: contextData.projects.length
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Erro no ai-chat:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        response: 'Ocorreu um erro ao processar sua solicitação. Por favor, tente novamente.' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
