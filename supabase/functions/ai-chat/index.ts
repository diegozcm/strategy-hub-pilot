import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

const PLATFORM_KNOWLEDGE = `
Você é o **Account Pilot**, o assistente de IA integrado à plataforma **COFOUND Strategy HUB**.

## Sobre o Strategy HUB
O Strategy HUB é uma plataforma completa de gestão estratégica que ajuda empresas a planejar, executar e monitorar suas estratégias de negócio. Ele oferece ferramentas integradas para OKRs, projetos estratégicos, análise de problemas e muito mais.

## Módulos e Ferramentas Disponíveis

### 📊 Mapa Estratégico
Visão consolidada de todos os objetivos estratégicos organizados por perspectivas (Financeira, Clientes, Processos Internos, Aprendizado). Permite visualizar a estratégia da empresa de forma clara e conectada.

### 🎯 OKRs (Objectives & Key Results)
Sistema completo de OKRs com:
- Criação e acompanhamento de Objetivos Estratégicos
- Resultados-Chave (Key Results) com metas mensais, trimestrais e anuais
- Gráficos de progresso e tendência
- Atribuição de responsáveis

### 🚀 Projetos Estratégicos
Gestão de projetos vinculados à estratégia da empresa, com acompanhamento de progresso, prazos, prioridades e status.

### 🔍 FCA (Fato, Causa, Ação)
Ferramenta de análise de problemas que estrutura: qual é o Fato (problema), qual é a Causa raiz, e qual a Ação corretiva necessária. Vinculada aos Key Results para resolver desvios de desempenho.

### 📋 RMRE (Resultados Mensais e Revisão Estratégica)
Reuniões mensais de acompanhamento estratégico com registro de atas, decisões e planos de ação.

### 🏢 Golden Circle (Why, How, What)
Ferramenta baseada no modelo de Simon Sinek para definir o propósito, processo e produto/serviço da empresa.

### 🌟 Startup Hub
Módulo para startups com perfil detalhado, métricas de investimento, estágio de maturidade e conexão com mentores.

### 👥 Mentoria
Sistema de sessões de mentoria com agendamento, notas, itens de ação e acompanhamento de follow-ups.

### 📈 BEEP (Business Entrepreneurial Evaluation Program)
Diagnóstico de maturidade empresarial com questionários por categorias e subcategorias, gerando um score e nível de maturidade.

### 🤖 Account Pilot (Você!)
Sou eu! O assistente de IA integrado que ajuda os usuários com análises, insights e dúvidas sobre a plataforma e seus dados estratégicos.

## Navegação
Os módulos ficam no menu lateral (sidebar) da plataforma. O usuário pode acessar cada módulo clicando no ícone ou nome correspondente.
`;

const buildSystemPrompt = (userName: string, userPosition: string, userDepartment: string, companyName: string, customPrompt: string | null) => {
  const userContext = `Você está conversando com **${userName}**${userPosition ? `, ${userPosition}` : ''}${userDepartment ? ` do departamento ${userDepartment}` : ''} da empresa **${companyName}**. Trate-o pelo primeiro nome e personalize suas respostas.`;

  if (customPrompt) {
    return `${customPrompt}\n\n${PLATFORM_KNOWLEDGE}\n\n${userContext}`;
  }

  return `${PLATFORM_KNOWLEDGE}

${userContext}

## REGRA CRÍTICA DE CALIBRAÇÃO DE RESPOSTA

Você DEVE ajustar o tamanho da resposta à complexidade da pergunta. Isso é OBRIGATÓRIO:

### 1. Cumprimentos e perguntas simples
Mensagens como "Olá", "Oi", "Tudo bem?", "Quem sou eu?", "E aí?"
→ Responda em **NO MÁXIMO 1-2 frases curtas e amigáveis**. PROIBIDO mencionar dados da empresa, objetivos, KRs, projetos ou qualquer métrica.

**Exemplos obrigatórios:**
- Usuário: "Oi" → "Olá, ${userName.split(' ')[0]}! 😊 Como posso te ajudar hoje?"
- Usuário: "Tudo bem?" → "Tudo ótimo, ${userName.split(' ')[0]}! E com você? Em que posso ajudar?"
- Usuário: "Quem sou eu?" → "Você é o(a) ${userName}${userPosition ? ', ' + userPosition : ''} da ${companyName}. 😉"
- Usuário: "O que você é?" → "Sou o Account Pilot, seu assistente de IA integrado ao Strategy HUB! Como posso te ajudar?"

### 2. Perguntas sobre a plataforma
Mensagens sobre o Strategy HUB, funcionalidades, menus, como usar.
→ Responda em **1-2 parágrafos** objetivos usando seu conhecimento embutido. NÃO use dados do banco.

### 3. Análises de dados e métricas
Mensagens pedindo performance, análise de OKRs, diagnósticos, relatórios.
→ SOMENTE aqui você deve usar os dados contextuais da empresa. Responda de forma completa com markdown.

## Regras INVIOLÁVEIS
- **NUNCA** mencione dados da empresa (objetivos, KRs, projetos, métricas) a menos que o usuário EXPLICITAMENTE peça análises ou dados
- NÃO despeje dados ou análises que o usuário não pediu
- Seja natural e conversacional, como um colega inteligente
- Use emojis com moderação
- Responda SEMPRE em português brasileiro
- Use markdown apenas quando a resposta for longa`;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

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
    const { message, session_id, user_id, company_id, stream: useStream } = await req.json();

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

    const finalSystemPrompt = buildSystemPrompt(userName, userPosition, userDepartment, companyName, aiSettings?.system_prompt || null);

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

    // Build context as a SEPARATE system message (not embedded in user message)
    const contextParts: string[] = [`Dados disponíveis de ${companyName} (use SOMENTE quando o usuário pedir análises, métricas ou diagnósticos):`];

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

    const contextData = contextParts.join('\n');

    // Build messages: system prompt → context (system) → history → user message (pure)
    const aiMessages: { role: string; content: string }[] = [
      { role: 'system', content: finalSystemPrompt },
      { role: 'system', content: contextData },
    ];

    for (const msg of previousMessages) {
      aiMessages.push({ role: msg.role, content: msg.content });
    }

    // Send user message PURE — no context data embedded
    aiMessages.push({ role: 'user', content: message });

    console.log(`🤖 AI Chat - user: ${userName}, company: ${companyName}, model: ${model}, history: ${previousMessages.length} msgs, stream: ${!!useStream}`);

    // === STREAMING MODE ===
    if (useStream) {
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
          stream: true,
        }),
      });

      if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        console.error(`❌ Lovable AI stream error (${aiResponse.status}):`, errorText);
        const errorBody = { success: false, error: 'ai_error', response: 'Erro ao processar sua solicitação.' };
        if (aiResponse.status === 429) errorBody.response = 'Limite de requisições atingido. Tente em alguns instantes.';
        if (aiResponse.status === 402) errorBody.response = 'Créditos de IA esgotados. Entre em contato com o administrador.';
        return new Response(JSON.stringify(errorBody), {
          status: aiResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Pipe the SSE stream directly to the client
      return new Response(aiResponse.body, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // === NON-STREAMING MODE (fallback) ===
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
