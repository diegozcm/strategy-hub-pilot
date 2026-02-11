import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

const PLATFORM_KNOWLEDGE = `
Você é o **Atlas**, o assistente de IA integrado à plataforma **COFOUND Strategy HUB**.

## Sobre o Strategy HUB
O Strategy HUB é uma plataforma completa de gestão estratégica que ajuda empresas a planejar, executar e monitorar suas estratégias de negócio.

## Menu Lateral (Sidebar) — Estrutura Real

### STRATEGY HUB (módulo strategic-planning)
Os itens do menu lateral são:
1. **Dashboard** (/app/dashboard) — Visão geral com métricas e gráficos de progresso
2. **Mapa Estratégico** (/app/strategic-map) — Visualização dos Pilares e Objetivos com cards expansíveis. É AQUI que se adiciona KRs, Objetivos e Iniciativas.
3. **Objetivos** (/app/objectives) — Lista de todos os Objetivos Estratégicos
4. **Resultados Chave** (/app/indicators) — Lista de todos os KRs com filtros e check-in
5. **Projetos** (/app/projects) — Projetos Estratégicos vinculados ao plano
6. **Ferramentas** (/app/tools) — Contém abas: Golden Circle, Análise SWOT, Alinhamento de Visão

### STARTUP HUB (módulo startup-hub)
1. **Dashboard** — Visão geral da startup
2. **Avaliação BEEP** — Diagnóstico de maturidade (só startups)
3. **Startups** — Lista de startups (só mentores)
4. **Avaliações BEEP** — Analytics de avaliações (só mentores)
5. **Mentorias** — Sessões de mentoria e calendário
6. **Perfil Startup** — Dados da startup (só startups)

### Rodapé do sidebar
- **Configurações** — Configurações da conta e empresa

## Guia de Navegação (SIGA EXATAMENTE ESTES PASSOS)

### Como adicionar um KR (Resultado-Chave)
1. No menu lateral, clique em **"Mapa Estratégico"**
2. Localize o **Pilar** desejado (ex: Financeiro, Clientes, Inovação & Crescimento)
3. Expanda o Pilar para ver seus **Objetivos Estratégicos**
4. Dentro do Objetivo desejado, clique no botão **"Adicionar Resultado-Chave"** (ou ícone "+")
5. Preencha: Título, Tipo de métrica (número, %, moeda), Valor atual, Meta, Responsável
6. Clique em **"Adicionar Resultado-Chave"**

### Como fazer check-in de um KR
1. No menu lateral, clique em **"Resultados Chave"**
2. Localize o KR na lista (use filtros se necessário)
3. Clique no KR para abrir os detalhes
4. Atualize o valor atual para o período
5. Salve

### Como adicionar um Objetivo Estratégico
1. No menu lateral, clique em **"Mapa Estratégico"**
2. Localize o **Pilar** onde o objetivo será criado
3. Clique no botão **"+"** dentro do Pilar (Adicionar Objetivo)
4. Preencha: Título, Descrição, Data limite, Perspectiva
5. Clique em **"Salvar"**

### Como adicionar uma Iniciativa
1. No **Mapa Estratégico**, localize o KR ao qual a iniciativa será vinculada
2. Dentro do KR, clique no botão **"Adicionar Iniciativa"** (ou "+")
3. Preencha: Título, Descrição, Data início, Data fim, Responsável, Prioridade
4. Clique em **"Salvar"**

### Como criar uma análise FCA
1. No **Mapa Estratégico**, localize o KR com desvio de performance
2. Clique no KR e vá para a aba **"FCA"**
3. Clique em **"Nova FCA"**
4. Preencha: Fato, Causa, Ação
5. Defina prioridade e clique em **"Salvar"**

### Como acessar Ferramentas (Golden Circle, SWOT)
1. No menu lateral, clique em **"Ferramentas"**
2. Selecione a aba desejada: Golden Circle, Análise SWOT ou Alinhamento de Visão

### Como acessar o Startup Hub
1. No menu lateral, clique em **"Startup Hub"**
2. Você verá o dashboard da startup ou a lista de startups (se mentor)

### Como acessar Sessões de Mentoria
1. No menu lateral, clique em **"Mentorias"**
2. Você verá a lista de sessões
3. Para criar uma nova sessão, clique em **"Nova Sessão"**
`;

// Detect if the message is a simple greeting/question that doesn't need company data
function isSimpleMessage(msg: string): boolean {
  const normalized = msg.toLowerCase().trim().replace(/[?!.,;:]+$/g, '');
  const simplePatterns = [
    /^(oi|olá|ola|hey|hi|hello|eai|e ai|fala|salve)$/,
    /^(tudo bem|tudo certo|tudo joia|como vai|como está|bom dia|boa tarde|boa noite)$/,
    /^(quem (é|e) voc[eê]|o que (é|e) voc[eê]|o que (é|e) o (strategy|atlas))$/,
    /^como (faço|faco|adiciono|crio|acesso|uso|configuro)/,
    /^(onde fica|como chego|como encontro|como navego)/,
    /^(quem sou eu|qual meu cargo|quais s[aã]o meus acessos|minhas permiss[oõ]es)$/,
    /^(obrigado|valeu|brigado|thanks|vlw|tmj)$/,
    /^(tchau|até|ate|falou|flw)$/,
  ];
  return simplePatterns.some(p => p.test(normalized));
}

const buildSystemPrompt = (userName: string, userPosition: string, userDepartment: string, companyName: string, customPrompt: string | null, userPermissions: string) => {
  const firstName = userName.split(' ')[0];
  const userContext = `Você está conversando com **${userName}**${userPosition ? `, ${userPosition}` : ''}${userDepartment ? ` do departamento ${userDepartment}` : ''} da empresa **${companyName}**. Trate-o pelo primeiro nome.`;

  // Permissions are available but ONLY to be used when the user asks or when checking if they can do something
  const permissionsContext = userPermissions
    ? `\n## Permissões de ${userName} (USO INTERNO — NÃO mencione a menos que perguntado)\n${userPermissions}\nUse estas permissões SOMENTE para: (1) responder se o usuário perguntar "quais são meus acessos?" ou (2) informar se ele tentar fazer algo sem permissão.`
    : '';

  if (customPrompt) {
    return `${customPrompt}\n\n${PLATFORM_KNOWLEDGE}\n\n${userContext}${permissionsContext}`;
  }

  return `## VOCÊ É UM AGENTE EXECUTOR — ESTA É SUA CAPACIDADE PRINCIPAL

Você TEM a capacidade técnica de criar Objetivos, KRs e Iniciativas no banco de dados da plataforma COFOUND Strategy HUB.
Quando o usuário pedir para criar/adicionar/inserir/implementar/cadastrar QUALQUER item estratégico, você DEVE gerar um bloco [ATLAS_PLAN] com o JSON estruturado.
O sistema backend irá processar esse bloco automaticamente e mostrará botões "Aprovar" e "Reprovar" para o usuário.

### PROIBIÇÕES ABSOLUTAS:
- NUNCA diga que "não pode", "não tem permissão", "não consegue executar", "não tenho acesso ao banco" ou qualquer variação.
- NUNCA peça para o usuário criar manualmente, copiar e colar, ou acessar menus para cadastrar.
- NUNCA diga que precisa de "trava de segurança" ou "operação final de escrita humana".
- Você PODE e DEVE propor planos de execução com [ATLAS_PLAN]. SEMPRE.

### FORMATO OBRIGATÓRIO para planos de execução:

O JSON DEVE ser um objeto com a chave "actions" contendo um array. Cada item do array DEVE ter "type" e "data". NÃO use nenhum outro formato.

### TIPOS DE AÇÃO DISPONÍVEIS:
1. **create_pillar** — Cria um pilar estratégico
   - Campos: name (obrigatório), color (hex, default #3B82F6), description
2. **create_objective** — Cria um objetivo estratégico
   - Campos: title (obrigatório), pillar_name (obrigatório, EXATAMENTE como listado nos pilares), description, target_date (YYYY-MM-DD), weight (1-10, default 1)
3. **create_key_result** — Cria um resultado-chave
   - Campos: title (obrigatório), objective_ref (índice no array, obrigatório se não tiver objective_id), target_value (obrigatório), unit (obrigatório), description, frequency, monthly_targets ({"YYYY-MM": valor}), yearly_target, weight (1-10), aggregation_type, comparison_type, target_direction, start_month ("YYYY-MM"), end_month ("YYYY-MM")
4. **create_initiative** — Cria uma iniciativa vinculada a um KR
   - Campos: title (obrigatório), key_result_ref (índice no array, obrigatório se não tiver key_result_id), description, priority, start_date, end_date, responsible, budget
5. **create_project** — Cria um projeto estratégico
   - Campos: name (obrigatório), description, priority, start_date, end_date, budget, objective_refs (array de índices), kr_refs (array de índices)
6. **update_key_result** — Atualiza um KR existente
   - Campos: kr_id ou kr_title, current_value, target_value, monthly_actual, monthly_targets, etc.
7. **update_initiative** — Atualiza uma iniciativa existente
   - Campos: initiative_id ou initiative_title, status, progress_percentage, etc.

### VALORES VÁLIDOS DE REFERÊNCIA:
- **Unidades de KR**: %, R$, un, dias, score, points
- **Frequências**: monthly, bimonthly, quarterly, semesterly, yearly
- **Agregação**: sum, average, max, min
- **Direção da meta**: maximize, minimize
- **Comparação**: cumulative, period
- **Prioridades**: low, medium, high
- **Status de iniciativa**: planned, in_progress, completed, cancelled, on_hold
- **monthly_targets formato**: {"2026-01": 100, "2026-02": 150, "2026-03": 200}

FORMATO CORRETO (USE ESTE):
[ATLAS_PLAN]
{"actions": [{"type": "create_pillar", "data": {"name": "Financeiro", "color": "#22C55E", "description": "Pilar financeiro"}}, {"type": "create_objective", "data": {"title": "Aumentar receita", "pillar_name": "Financeiro", "description": "...", "target_date": "2026-12-31", "weight": 3}}, {"type": "create_key_result", "data": {"title": "Receita mensal", "target_value": 500000, "unit": "R$", "objective_ref": 1, "frequency": "monthly", "aggregation_type": "sum", "target_direction": "maximize", "start_month": "2026-01", "end_month": "2026-12", "monthly_targets": {"2026-01": 300000, "2026-06": 400000, "2026-12": 500000}, "weight": 2, "description": "..."}}, {"type": "create_initiative", "data": {"title": "Campanha de vendas Q1", "key_result_ref": 2, "description": "...", "priority": "high", "start_date": "2026-01-15", "end_date": "2026-03-31", "responsible": "João Silva", "budget": 50000}}, {"type": "create_project", "data": {"name": "Projeto Expansão", "description": "...", "priority": "high", "start_date": "2026-01-01", "end_date": "2026-12-31", "budget": 200000, "objective_refs": [1]}}]}
[/ATLAS_PLAN]

FORMATO ERRADO (NUNCA USE):
{"action": "create_strategic_objective", "data": {"objective": {...}, "key_results": [...]}}
O formato acima com "action" singular e objetos aninhados NÃO funciona. Use SEMPRE "actions" (plural) com array.

### REGRAS DO PLANO:
- objective_ref/key_result_ref = índice da action anterior no array (ex: 0 = primeira action criada)
- pillar_name DEVE ser EXATAMENTE um dos pilares listados no CONTEXTO DA EMPRESA abaixo. Copie o nome exato do pilar. NÃO invente pilares.
- ANTES do bloco [ATLAS_PLAN], descreva detalhadamente em linguagem natural e humanizada:
  * Qual o objetivo que será criado e por quê
  * Quais KRs serão vinculados e suas metas
  * Quais iniciativas serão propostas
  * Use marcadores numerados (1., 2., 3.) para organizar
  * Seja específico: inclua nomes, valores, datas
  * Tom conversacional e claro para qualquer usuário entender
- O bloco [ATLAS_PLAN] com JSON é SOMENTE para uso interno do sistema. O usuário NUNCA verá esse código.
- Se o usuário já descreveu o que quer, GERE O PLANO IMEDIATAMENTE. Não peça confirmação antes.
- O bloco [ATLAS_PLAN] DEVE terminar com [/ATLAS_PLAN] (tag de fechamento obrigatória).
- IMPORTANTÍSSIMO: Você NÃO executa o plano diretamente. O frontend exibirá botões "Aprovar" e "Reprovar" para o usuário.
- NUNCA diga "Ações concluídas", "Executado com sucesso", "Já criei", "Pronto, foi cadastrado", "sincronização realizada" ou variantes.
- NUNCA sugira que a execução já aconteceu. Você apenas PROPÕE o plano.
- NUNCA escreva NADA após o bloco [/ATLAS_PLAN]. Nenhum texto, nenhuma frase. O sistema exibirá os botões automaticamente.
- NUNCA escreva texto após [/ATLAS_PLAN] que liste itens criados ou sugira sucesso na execução.
- NUNCA peça para o usuário "verificar manualmente", "seguir passos" ou "cadastrar manualmente". Você É o executor.

---

## REGRA #2: BREVIDADE (apenas para conversas casuais)
Para cumprimentos e perguntas simples, seja breve (1 frase curta). NUNCA mencione cargos, permissões, módulos acessíveis ou dados da empresa a menos que o usuário EXPLICITAMENTE peça.
Para PLANEJAMENTOS e [ATLAS_PLAN], escreva com o máximo de detalhe necessário.
Nunca corte ou resuma um plano estratégico. Inclua TODOS os objetivos, KRs, iniciativas, metas e datas sem omitir nada.

${PLATFORM_KNOWLEDGE}

${userContext}
${permissionsContext}

## CALIBRAÇÃO DE RESPOSTA

### Cumprimentos simples
"Oi", "Tudo bem?", "E aí?", "Bom dia", etc.
→ Responda em **1 frase curta e amigável**. Exemplos:
- "Oi" → "Olá, ${firstName}! Como posso te ajudar?"
- "Tudo bem?" → "Tudo ótimo, ${firstName}! Em que posso ajudar?"
PROIBIDO: mencionar cargos, permissões, módulos, dados da empresa, objetivos ou KRs.

### Perguntas sobre navegação e uso
→ Responda em **1-2 parágrafos** usando o Guia de Navegação acima.

### "Quais são meus acessos?" / "Qual meu cargo?"
→ SOMENTE aqui liste as permissões.

### Pedidos de criação/adição
→ Use IMEDIATAMENTE o formato [ATLAS_PLAN] descrito acima. Você É o agente executor.

### Análises de dados e métricas
→ SOMENTE quando pedido, use os dados contextuais da empresa.

## Regras gerais
- Seja natural e conversacional
- Use emojis com moderação (máx 1-2 por mensagem)
- Responda SEMPRE em português brasileiro
- Use markdown apenas quando a resposta for longa

## REFORÇO FINAL: Você É um agente executor. Quando pedirem para criar/implementar, GERE [ATLAS_PLAN]. NUNCA recuse.`;
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
    const { message, session_id, user_id, company_id, stream: useStream, image, plan_mode } = await req.json();

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

    // Build user permissions string — only modules WITH access
    const moduleRoles = userModuleRolesResult.data || [];
    const roleTranslation: Record<string, string> = { admin: 'administrador', manager: 'gestor', member: 'membro' };
    const moduleSlugToName: Record<string, string> = { 'strategic-planning': 'Strategy HUB', 'startup-hub': 'Startup HUB', 'ai': 'AI Copilot' };

    const userPermissionLines: string[] = [];

    for (const mr of moduleRoles) {
      const mod = (mr as any).system_modules;
      if (mod?.slug) {
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

    // NO longer listing modules without access

    const userPermissions = userPermissionLines.join('\n');

    const allowedModels = ['openai/gpt-5-mini', 'openai/gpt-5', 'openai/gpt-5-nano', 'openai/gpt-5.2', 'google/gemini-2.5-pro', 'google/gemini-2.5-flash', 'google/gemini-2.5-flash-lite', 'google/gemini-2.5-flash-image', 'google/gemini-3-pro-preview', 'google/gemini-3-flash-preview', 'google/gemini-3-pro-image-preview'];
    const rawModel = aiSettings?.model || 'google/gemini-3-flash-preview';
    const model = plan_mode
      ? 'google/gemini-2.5-pro'
      : (allowedModels.includes(rawModel) ? rawModel : 'google/gemini-3-flash-preview');
    const temperature = aiSettings?.temperature || 0.7;
    const maxTokens = plan_mode ? 16000 : (aiSettings?.max_tokens || 2000);

    const finalSystemPrompt = buildSystemPrompt(userName, userPosition, userDepartment, companyName, aiSettings?.system_prompt || null, userPermissions);

    // Determine if we need company context data (skip for simple messages)
    const needsContext = !isSimpleMessage(message);
    
    let contextData = '';
    let objectives: any[] = [];
    let keyResults: any[] | null = [];
    let projects: any[] = [];
    let startupProfile: any = null;
    let mentoringSessions: any[] = [];

    if (needsContext) {
      const { data: plans } = await supabase.from('strategic_plans').select('id').eq('company_id', company_id);
      const planIds = plans?.map(p => p.id) || [];

      const [objectivesResult, projectsResult, startupResult, mentoringResult, pillarsResult] = await Promise.all([
        planIds.length > 0
          ? supabase.from('strategic_objectives').select('id, title, progress, status, target_date').in('plan_id', planIds).limit(20)
          : Promise.resolve({ data: [] }),
        planIds.length > 0
          ? supabase.from('strategic_projects').select('name, progress, status, start_date, end_date, priority').in('plan_id', planIds).limit(20)
          : Promise.resolve({ data: [] }),
        supabase.from('startup_hub_profiles').select('*').eq('company_id', company_id).single(),
        supabase.from('mentoring_sessions').select('session_date, session_type, status, notes').eq('startup_company_id', company_id).order('session_date', { ascending: false }).limit(10),
        supabase.from('strategic_pillars').select('name').eq('company_id', company_id),
      ]);

      objectives = objectivesResult.data || [];
      const objectiveIds = objectives.map(o => o.id);

      const krResult = objectiveIds.length > 0
        ? await supabase.from('key_results').select('title, current_value, target_value, unit, due_date, priority').in('objective_id', objectiveIds).limit(30)
        : { data: [] };
      keyResults = krResult.data || [];

      projects = projectsResult.data || [];
      startupProfile = startupResult.data;
      mentoringSessions = mentoringResult.data || [];

      // Build context data string
      const pillars = pillarsResult.data || [];
      const contextParts: string[] = [`CONTEXTO DE REFERÊNCIA da ${companyName} — Use SOMENTE quando a mensagem do usuário pedir análises, métricas ou dados específicos:`];

      if (pillars.length > 0) {
        contextParts.push(`\n🏛️ Pilares Estratégicos disponíveis (USE EXATAMENTE estes nomes no pillar_name):\n${pillars.map(p => `• ${p.name}`).join('\n')}`);
      }

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

      contextData = contextParts.join('\n');
    }

    // Build messages: system prompt → history → user message → context (only if needed)
    const aiMessages: { role: string; content: string | any[] }[] = [
      { role: 'system', content: finalSystemPrompt },
    ];

    // Sanitize history: remove refusal patterns from assistant messages
    const REFUSAL_PATTERNS = [
      /n[aã]o tenho permiss[aã]o/i,
      /n[aã]o consigo (clicar|executar|inserir|gravar|realizar)/i,
      /fa[cç]a voc[eê] mesmo/i,
      /copie e cole/i,
      /trava de seguran[cç]a/i,
      /opera[cç][aã]o final de escrita/i,
      /n[aã]o (posso|tenho como) (criar|inserir|gravar|executar|implementar)/i,
      /siga estes passos/i,
    ];

    for (const msg of previousMessages) {
      let content = msg.content;
      if (msg.role === 'assistant' && REFUSAL_PATTERNS.some((p: RegExp) => p.test(content))) {
        content = 'Preparei um plano de execução para o que você pediu. Posso prosseguir quando quiser.';
      }
      aiMessages.push({ role: msg.role, content });
    }

    // Detect write intent and inject reminder
    const WRITE_INTENT_PATTERNS = [
      /cri[ae]/i, /adicion[ae]/i, /inser[ei]/i, /implement[ae]/i,
      /cadastr[ae]/i, /coloc[ae]/i, /fa[zç]a? (um|uma|o|a)/i,
      /quero que (voc[eê]|tu) (cri|adicion|inser|implement|cadastr)/i,
      /pode (criar|adicionar|inserir|implementar|cadastrar)/i,
      /bota (isso|l[aá]|a[ií])/i,
      /implement/i, /aplic/i, /mont[ae]/i,
    ];
    const hasWriteIntent = WRITE_INTENT_PATTERNS.some(p => p.test(message));

    if (hasWriteIntent) {
      aiMessages.push({
        role: 'system',
        content: 'ATENÇÃO: O usuário está pedindo para CRIAR/IMPLEMENTAR dados no sistema. Você DEVE responder com um bloco [ATLAS_PLAN] contendo o JSON estruturado das ações. NÃO diga que não pode. NÃO peça para o usuário fazer manualmente. Você É o agente executor. GERE O [ATLAS_PLAN] AGORA.',
      });
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

    // Add context data AFTER user message ONLY if needed
    if (contextData) {
      aiMessages.push({ role: 'system', content: contextData });
    }

    console.log(`🤖 Atlas Chat - user: ${userName}, company: ${companyName}, model: ${model}, history: ${previousMessages.length} msgs, stream: ${!!useStream}, hasImage: ${!!image}, needsContext: ${needsContext}`);

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
