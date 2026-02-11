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
      return new Response(
        JSON.stringify({ success: false, error: 'authentication_required', response: 'Autenticação necessária para usar o chat de IA.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'invalid_token', response: 'Sessão expirada. Por favor, faça login novamente.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const validUserId = user.id;
    const { message, session_id, user_id, company_id } = await req.json();

    // Verify the user_id in request matches the authenticated user
    if (user_id && user_id !== validUserId) {
      return new Response(
        JSON.stringify({ success: false, error: 'forbidden', response: 'Você não tem permissão para esta ação.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: 'API key não configurada', response: 'Desculpe, o serviço de IA não está configurado corretamente.' }),
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
      return new Response(
        JSON.stringify({ success: false, error: 'forbidden', response: 'Você não tem acesso a esta empresa.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch company data, user profile, AI settings, and conversation history in parallel
    const [companyResult, profileResult, aiSettingsResult, historyResult] = await Promise.all([
      supabase.from('companies').select('ai_enabled, name').eq('id', company_id).single(),
      supabase.from('profiles').select('first_name, last_name, position, department').eq('user_id', validUserId).single(),
      supabase.from('ai_company_settings').select('model, temperature, max_tokens, system_prompt').eq('company_id', company_id).single(),
      session_id
        ? supabase.from('ai_chat_messages').select('role, content').eq('session_id', session_id).order('created_at', { ascending: true }).limit(20)
        : Promise.resolve({ data: [] }),
    ]);

    if (!companyResult.data?.ai_enabled) {
      return new Response(
        JSON.stringify({ success: false, response: 'O acesso à IA não está habilitado para sua empresa. Entre em contato com o administrador.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const companyName = companyResult.data.name || 'Empresa';
    const profile = profileResult.data;
    const userName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || 'Usuário';
    const userPosition = profile?.position || '';
    const userDepartment = profile?.department || '';
    const aiSettings = aiSettingsResult.data;
    const previousMessages = historyResult.data || [];

    const allowedModels = ['openai/gpt-5-mini', 'openai/gpt-5', 'openai/gpt-5-nano', 'openai/gpt-5.2', 'google/gemini-2.5-pro', 'google/gemini-2.5-flash', 'google/gemini-2.5-flash-lite', 'google/gemini-2.5-flash-image', 'google/gemini-3-pro-preview', 'google/gemini-3-flash-preview', 'google/gemini-3-pro-image-preview'];
    const rawModel = aiSettings?.model || 'google/gemini-3-flash-preview';
    const model = allowedModels.includes(rawModel) ? rawModel : 'google/gemini-3-flash-preview';
    const temperature = aiSettings?.temperature || 0.7;
    const maxTokens = aiSettings?.max_tokens || 2000;

    // Build user context string for the system prompt
    const userContext = `Você está conversando com ${userName}${userPosition ? `, ${userPosition}` : ''}${userDepartment ? ` do departamento ${userDepartment}` : ''} da empresa "${companyName}". Trate-o pelo primeiro nome e personalize suas respostas.`;

    const systemPrompt = aiSettings?.system_prompt ||
      `Você é o Account Pilot, um consultor estratégico inteligente da plataforma COFOUND. ${userContext}

Diretrizes:
- Seja profissional, objetivo e empático
- Use os dados reais da empresa para fundamentar suas análises
- Ofereça insights acionáveis e específicos, não genéricos
- Quando não houver dados suficientes, indique claramente e sugira próximos passos
- Responda em português brasileiro de forma natural e humanizada
- Use formatação markdown para organizar suas respostas (títulos, listas, negrito)
- Ao identificar riscos, sempre sugira ações concretas de mitigação`;

    // If using custom system_prompt, append user context
    const finalSystemPrompt = aiSettings?.system_prompt
      ? `${aiSettings.system_prompt}\n\n${userContext}`
      : systemPrompt;

    // Fetch contextual data filtered by company_id
    const { data: plans } = await supabase.from('strategic_plans').select('id').eq('company_id', company_id);
    const planIds = plans?.map(p => p.id) || [];

    const [objectivesResult, projectsResult, startupResult, mentoringResult] = await Promise.all([
      planIds.length > 0
        ? supabase.from('strategic_objectives').select('id, title, progress, status, target_date').in('plan_id', planIds).limit(20)
        : Promise.resolve({ data: [] }),
      planIds.length > 0
        ? supabase.from('strategic_projects').select('name, progress, status, start_date, end_date, priority').in('plan_id', planIds).limit(20)
        : Promise.resolve({ data: [] }),
      supabase.from('startup_hub_profiles').select('*').eq('company_id', company_id).single(),
      supabase.from('mentoring_sessions').select('session_date, session_type, status, notes').eq('startup_company_id', company_id).order('session_date', { ascending: false }).limit(10),
    ]);

    const objectives = objectivesResult.data || [];
    const objectiveIds = objectives.map(o => o.id);

    const { data: keyResults } = objectiveIds.length > 0
      ? await supabase.from('key_results').select('title, current_value, target_value, unit, due_date, priority').in('objective_id', objectiveIds).limit(30)
      : { data: [] };

    const projects = projectsResult.data || [];
    const startupProfile = startupResult.data;
    const mentoringSessions = mentoringResult.data || [];

    // Build context prompt with company data
    const contextParts: string[] = [`Dados disponíveis de ${companyName}:`];

    if (objectives.length > 0) {
      contextParts.push(`\n📊 Objetivos Estratégicos:\n${objectives.map(obj => `• ${obj.title}: ${obj.progress || 0}% concluído (Status: ${obj.status})`).join('\n')}`);
    }
    if (keyResults && keyResults.length > 0) {
      contextParts.push(`\n📊 Resultados Chave:\n${keyResults.map(kr => `• ${kr.title}: ${kr.current_value || 0}${kr.unit} de ${kr.target_value}${kr.unit}`).join('\n')}`);
    }
    if (projects.length > 0) {
      contextParts.push(`\n🚀 Projetos Estratégicos:\n${projects.map(proj => `• ${proj.name}: ${proj.progress || 0}% concluído (Status: ${proj.status})`).join('\n')}`);
    }
    if (startupProfile) {
      contextParts.push(`\n🎯 Startup Hub:\n• Startup: ${startupProfile.startup_name || 'Não informado'}\n• Setor: ${startupProfile.sector || 'Não informado'}\n• Estágio: ${startupProfile.stage || 'Não informado'}`);
    }
    if (mentoringSessions.length > 0) {
      contextParts.push(`\n👥 Sessões de Mentoria Recentes:\n${mentoringSessions.map(s => `• ${s.session_date}: ${s.session_type} (${s.status})`).join('\n')}`);
    }

    contextParts.push(`\nPergunta do usuário: "${message}"\n\nResponda de forma clara, objetiva e acionável, baseando-se EXCLUSIVAMENTE nos dados acima.`);
    const contextPrompt = contextParts.join('\n');

    // Build messages array with conversation history
    const aiMessages: { role: string; content: string }[] = [
      { role: 'system', content: finalSystemPrompt },
    ];

    // Add previous messages from this session (conversation memory)
    for (const msg of previousMessages) {
      aiMessages.push({ role: msg.role, content: msg.content });
    }

    // Add current user message with context data
    aiMessages.push({ role: 'user', content: contextPrompt });

    console.log(`🤖 AI Chat - user: ${userName}, company: ${companyName}, model: ${model}, history: ${previousMessages.length} msgs`);

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: aiMessages,
        temperature,
        max_tokens: maxTokens,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error(`❌ Lovable AI error (${aiResponse.status}):`, errorText);

      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: 'rate_limit', response: 'O limite de requisições foi atingido. Por favor, tente novamente em alguns instantes.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ success: false, error: 'payment_required', response: 'Os créditos de IA foram esgotados. Entre em contato com o administrador.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`AI Gateway error: ${errorText}`);
    }

    const aiData = await aiResponse.json();
    const assistantMessage = aiData.choices?.[0]?.message?.content || 'Desculpe, não consegui processar sua pergunta.';

    // Log analytics
    await supabase.from('ai_analytics').insert({
      user_id: validUserId,
      event_type: 'chat_completion',
      event_data: {
        company_id,
        session_id,
        model_used: model,
        user_name: userName,
        prompt_tokens: aiData.usage?.prompt_tokens,
        completion_tokens: aiData.usage?.completion_tokens,
        total_tokens: aiData.usage?.total_tokens,
        history_messages_count: previousMessages.length,
        context_summary: {
          objectives_count: objectives.length,
          key_results_count: keyResults?.length || 0,
          projects_count: projects.length,
          has_startup_profile: !!startupProfile,
          mentoring_sessions_count: mentoringSessions.length
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
          objectives: objectives.length,
          keyResults: keyResults?.length || 0,
          projects: projects.length
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Erro no ai-chat:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message, response: 'Ocorreu um erro ao processar sua solicitação. Por favor, tente novamente.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
