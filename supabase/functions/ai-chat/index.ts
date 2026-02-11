import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

const PLATFORM_KNOWLEDGE = `
Você é o **Atlas**, o assistente de IA integrado à plataforma **COFOUND Strategy HUB**.

## Sobre o Strategy HUB
O Strategy HUB é uma plataforma completa de gestão estratégica que ajuda empresas a planejar, executar e monitorar suas estratégias de negócio. Ele oferece ferramentas integradas para OKRs, projetos estratégicos, análise de problemas e muito mais.

## Módulos e Ferramentas Disponíveis

### 📊 Strategy Hub (Mapa Estratégico + OKRs)
No menu lateral, o módulo "Strategy Hub" contém:
- **Pilares Estratégicos**: grandes temas da estratégia (ex: Financeiro, Clientes, Processos)
- **Objetivos Estratégicos**: metas dentro de cada pilar
- **Resultados-Chave (KRs)**: indicadores mensuráveis dentro de cada objetivo
- **Iniciativas**: ações/projetos vinculados a cada KR
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

### 🤖 Atlas (Você!)
Sou eu! O assistente de IA integrado que ajuda os usuários com análises, insights e dúvidas sobre a plataforma e seus dados estratégicos.

## Navegação
Os módulos ficam no menu lateral (sidebar) da plataforma. O usuário pode acessar cada módulo clicando no ícone ou nome correspondente.

## Guia de Navegação Detalhado (SIGA EXATAMENTE ESTES PASSOS)

### Como adicionar um KR (Resultado-Chave)
1. No menu lateral esquerdo, clique em **"Strategy Hub"**
2. Na tela principal, você verá os **Pilares Estratégicos** (cards grandes)
3. Clique no **Pilar** desejado para expandir e ver seus **Objetivos Estratégicos**
4. Dentro do Objetivo desejado, clique no botão **"+"** (Adicionar Resultado-Chave)
5. Preencha os campos: **Título**, **Tipo de métrica** (número, %, moeda), **Valor atual**, **Meta**, **Responsável**
6. Clique em **"Salvar"**
⚠️ PERMISSÃO: Apenas usuários com papel de **gestor** ou **admin** no módulo Strategy Hub podem criar KRs. Membros NÃO podem criar.

### Como fazer check-in de um KR
1. No menu lateral, clique em **"Strategy Hub"**
2. Localize o KR desejado (dentro do Pilar > Objetivo)
3. Clique no **KR** para abrir seus detalhes
4. Na aba de valores, atualize o **valor atual** para o período
5. Clique em **"Salvar"**
⚠️ PERMISSÃO: Membros podem fazer check-in APENAS nos KRs onde são o **responsável atribuído**. Gestores e admins podem atualizar qualquer KR.

### Como adicionar um Objetivo Estratégico
1. No menu lateral, clique em **"Strategy Hub"**
2. Localize o **Pilar** onde o objetivo será criado
3. Clique no botão **"+"** dentro do Pilar (Adicionar Objetivo)
4. Preencha: **Título**, **Descrição**, **Data limite**, **Perspectiva**
5. Clique em **"Salvar"**
⚠️ PERMISSÃO: Apenas **gestores** e **admins** podem criar objetivos.

### Como adicionar uma Iniciativa
1. No **Strategy Hub**, localize o KR ao qual a iniciativa será vinculada
2. Dentro do KR, clique no botão **"+"** (Adicionar Iniciativa)
3. Preencha: **Título**, **Descrição**, **Data início**, **Data fim**, **Responsável**, **Prioridade**
4. Clique em **"Salvar"**
⚠️ PERMISSÃO: Gestores e admins podem criar. Membros podem atualizar **progresso** e **status** de qualquer iniciativa.

### Como criar uma análise FCA
1. No **Strategy Hub**, localize o KR com desvio de performance
2. Clique no KR e vá para a aba **"FCA"**
3. Clique em **"Nova FCA"**
4. Preencha: **Fato** (o que aconteceu), **Causa** (por quê), **Ação** (o que fazer)
5. Defina **prioridade** e clique em **"Salvar"**

### Como acessar o Startup Hub
1. No menu lateral, clique em **"Startup Hub"**
2. Você verá o perfil da startup: nome, setor, estágio, métricas
3. Para editar o perfil, clique em **"Editar"** (se tiver permissão)
⚠️ PERMISSÃO: Depende do papel do usuário no módulo Startup Hub.

### Como acessar Sessões de Mentoria
1. No menu lateral, clique em **"Mentoria"**
2. Você verá a lista de sessões (passadas e futuras)
3. Para criar uma nova sessão, clique em **"Nova Sessão"**
4. Preencha: **Data**, **Tipo**, **Notas**
⚠️ PERMISSÃO: Depende do papel do usuário no módulo.

### Como responder o BEEP (Diagnóstico)
1. No menu lateral, clique em **"BEEP"**
2. Inicie ou continue um diagnóstico existente
3. Responda as perguntas de cada categoria/subcategoria
4. Ao final, veja seu **score** e **nível de maturidade**
`;

const buildSystemPrompt = (userName: string, userPosition: string, userDepartment: string, companyName: string, customPrompt: string | null, userPermissions: string) => {
  const userContext = `Você está conversando com **${userName}**${userPosition ? `, ${userPosition}` : ''}${userDepartment ? ` do departamento ${userDepartment}` : ''} da empresa **${companyName}**. Trate-o pelo primeiro nome e personalize suas respostas.`;

  const permissionsContext = userPermissions
    ? `\n## Permissões de ${userName}\n${userPermissions}\n\n**IMPORTANTE**: Quando o usuário perguntar como fazer algo, VERIFIQUE as permissões acima. Se ele não tiver acesso ao módulo, informe educadamente que ele precisa solicitar acesso ao administrador.`
    : '';

  if (customPrompt) {
    return `${customPrompt}\n\n${PLATFORM_KNOWLEDGE}\n\n${userContext}${permissionsContext}`;
  }

  return `## REGRA CRÍTICA (LEIA PRIMEIRO!)
Você DEVE calibrar o tamanho da resposta pela complexidade da pergunta. Cumprimentos e perguntas simples = 1-2 frases MÁXIMO. NUNCA despeje dados, métricas ou análises que o usuário NÃO pediu.

${PLATFORM_KNOWLEDGE}

${userContext}
${permissionsContext}

## CALIBRAÇÃO DE RESPOSTA (OBRIGATÓRIO)

### 1. Cumprimentos e perguntas simples
Mensagens como "Olá", "Oi", "Tudo bem?", "Quem sou eu?", "E aí?", "Como vai?"
→ Responda em **NO MÁXIMO 1-2 frases curtas e amigáveis**. PROIBIDO mencionar dados da empresa, objetivos, KRs, projetos ou qualquer métrica.

**Exemplos OBRIGATÓRIOS (siga EXATAMENTE este formato):**
- "Oi" → "Olá, ${userName.split(' ')[0]}! 😊 Como posso te ajudar hoje?"
- "Tudo bem?" → "Tudo ótimo, ${userName.split(' ')[0]}! E com você? Em que posso ajudar?"
- "Quem sou eu?" → "Você é o(a) ${userName}${userPosition ? ', ' + userPosition : ''} da ${companyName}. 😉"
- "O que você é?" → "Sou o Atlas, seu assistente de IA do Strategy HUB! Como posso te ajudar?"
- "Como vai seu dia?" → "Tudo excelente por aqui, ${userName.split(' ')[0]}! E o seu? 😊"

### 2. Perguntas sobre a plataforma e navegação
Mensagens sobre o Strategy HUB, funcionalidades, menus, como usar, como adicionar algo.
→ Responda em **1-2 parágrafos** objetivos usando o Guia de Navegação Detalhado acima. VERIFIQUE as permissões do usuário antes de orientar. NÃO use dados do banco.

### 3. Análises de dados e métricas
Mensagens pedindo performance, análise de OKRs, diagnósticos, relatórios.
→ SOMENTE aqui você deve usar os dados contextuais da empresa. Responda de forma completa com markdown.

## Regras INVIOLÁVEIS
- **NUNCA** mencione dados da empresa (objetivos, KRs, projetos, métricas) a menos que o usuário EXPLICITAMENTE peça análises ou dados
- NÃO despeje dados ou análises que o usuário não pediu
- Seja natural e conversacional, como um colega inteligente
- Use emojis com moderação
- Responda SEMPRE em português brasileiro
- Use markdown apenas quando a resposta for longa
- Ao orientar navegação, siga EXATAMENTE os passos do Guia de Navegação Detalhado

## LEMBRETE FINAL: Para cumprimentos simples, responda em 1-2 frases. NUNCA mais que isso.`;
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
    const { message, session_id, user_id, company_id, stream: useStream, image } = await req.json();

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

    // Fetch company data, user profile, AI settings, conversation history, and user permissions in parallel
    const [companyResult, profileResult, aiSettingsResult, historyResult, userModuleRolesResult] = await Promise.all([
      supabase.from('companies').select('ai_enabled, name').eq('id', company_id).single(),
      supabase.from('profiles').select('first_name, last_name, position, department').eq('user_id', validUserId).single(),
      supabase.from('ai_company_settings').select('model, temperature, max_tokens, system_prompt').eq('company_id', company_id).single(),
      session_id
        ? supabase.from('ai_chat_messages').select('role, content').eq('session_id', session_id).order('created_at', { ascending: true }).limit(20)
        : Promise.resolve({ data: [] }),
      supabase.from('user_module_roles')
        .select('role, active, module_id, system_modules!inner(name, slug)')
        .eq('user_id', validUserId)
        .eq('active', true),
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

    // Build user permissions string
    const moduleRoles = userModuleRolesResult.data || [];
    const roleTranslation: Record<string, string> = { admin: 'administrador', manager: 'gestor', member: 'membro' };
    const allModules = ['Strategy HUB', 'Startup HUB', 'AI Copilot'];
    const moduleSlugToName: Record<string, string> = { 'strategic-planning': 'Strategy HUB', 'startup-hub': 'Startup HUB', 'ai': 'AI Copilot' };

    const userPermissionLines: string[] = [];
    const accessedSlugs = new Set<string>();

    for (const mr of moduleRoles) {
      const mod = (mr as any).system_modules;
      if (mod?.slug) {
        accessedSlugs.add(mod.slug);
        const moduleName = moduleSlugToName[mod.slug] || mod.name;
        const roleName = roleTranslation[mr.role as string] || mr.role;
        let capabilities = '';
        if (mr.role === 'admin' || mr.role === 'manager') {
          capabilities = ' (pode criar, editar e deletar)';
        } else if (mr.role === 'member') {
          if (mod.slug === 'strategic-planning') {
            capabilities = ' (pode visualizar tudo, fazer check-in nos KRs onde é responsável, e atualizar progresso de iniciativas)';
          } else {
            capabilities = ' (somente visualização)';
          }
        }
        userPermissionLines.push(`- ${moduleName}: ${roleName}${capabilities}`);
      }
    }

    // Add modules the user does NOT have access to
    for (const [slug, name] of Object.entries(moduleSlugToName)) {
      if (!accessedSlugs.has(slug)) {
        userPermissionLines.push(`- ${name}: sem acesso`);
      }
    }

    const userPermissions = userPermissionLines.join('\n');

    const allowedModels = ['openai/gpt-5-mini', 'openai/gpt-5', 'openai/gpt-5-nano', 'openai/gpt-5.2', 'google/gemini-2.5-pro', 'google/gemini-2.5-flash', 'google/gemini-2.5-flash-lite', 'google/gemini-2.5-flash-image', 'google/gemini-3-pro-preview', 'google/gemini-3-flash-preview', 'google/gemini-3-pro-image-preview'];
    const rawModel = aiSettings?.model || 'google/gemini-3-flash-preview';
    const model = allowedModels.includes(rawModel) ? rawModel : 'google/gemini-3-flash-preview';
    const temperature = aiSettings?.temperature || 0.7;
    const maxTokens = aiSettings?.max_tokens || 2000;

    const finalSystemPrompt = buildSystemPrompt(userName, userPosition, userDepartment, companyName, aiSettings?.system_prompt || null, userPermissions);

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

    // Build context data string
    const contextParts: string[] = [`CONTEXTO DE REFERÊNCIA da ${companyName} — Use SOMENTE quando a mensagem do usuário pedir análises, métricas, diagnósticos ou dados específicos. Para cumprimentos e perguntas simples, IGNORE completamente estes dados:`];

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

    // Build messages: system prompt → history → user message → context data (AFTER user message)
    const aiMessages: { role: string; content: string | any[] }[] = [
      { role: 'system', content: finalSystemPrompt },
    ];

    for (const msg of previousMessages) {
      aiMessages.push({ role: msg.role, content: msg.content });
    }

    // Build user message — support multimodal (text + image)
    if (image) {
      aiMessages.push({
        role: 'user',
        content: [
          { type: 'text', text: message },
          { type: 'image_url', image_url: { url: image } },
        ],
      });
    } else {
      aiMessages.push({ role: 'user', content: message });
    }

    // Add context data AFTER user message so the AI doesn't feel compelled to use it
    aiMessages.push({ role: 'system', content: contextData });

    console.log(`🤖 Atlas Chat - user: ${userName}, company: ${companyName}, model: ${model}, history: ${previousMessages.length} msgs, stream: ${!!useStream}, hasImage: ${!!image}`);

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
        console.error(`❌ Atlas AI stream error (${aiResponse.status}):`, errorText);
        const errorBody = { success: false, error: 'ai_error', response: 'Erro ao processar sua solicitação.' };
        if (aiResponse.status === 429) errorBody.response = 'Limite de requisições atingido. Tente em alguns instantes.';
        if (aiResponse.status === 402) errorBody.response = 'Créditos de IA esgotados. Entre em contato com o administrador.';
        return new Response(JSON.stringify(errorBody), {
          status: aiResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

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
      console.error(`❌ Atlas AI error (${aiResponse.status}):`, errorText);
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
    console.error('❌ Erro no Atlas chat:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message, response: 'Ocorreu um erro ao processar sua solicitação. Por favor, tente novamente.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
