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
6. **Ferramentas** (/app/tools) — Contém abas: Golden Circle, Análise SWOT, Alinhamento de Visão, Governança RMRE (calendário de reuniões de monitoramento e revisão)

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

// Detect if a message needs the Pro model (complex strategic intent)
function needsProModel(msg: string): boolean {
  const normalized = msg.toLowerCase().trim();
  
  // Strategic entities
  const entities = '(objetivo|objetivos|kr|key.?result|resultado.?chave|pilar|pilares|iniciativa|iniciativas|projeto|projetos|swot|golden.?circle|fca|reuni[aã]o|reunioes|task|tarefa|tarefas|planejamento|bsc|balanced.?scorecard|mapa.?estrat[eé]gico|vis[aã]o|miss[aã]o|an[aá]lise|insight|insights)';
  
  // Creation/modification patterns
  const createPatterns = new RegExp(`(cri[ae]r?|adicionar?|cadastrar?|implementar?|montar?|estruturar?|gerar?|elaborar?|desenvolver?|propor?|sugerir?|definir?|planejar?|organizar?|configurar?).*${entities}`, 'i');
  
  // Deep analysis patterns
  const analysisPatterns = new RegExp(`(analis[ae]r?|diagnosticar?|avaliar?|comparar?|detalhar?|investigar?).*${entities}`, 'i');
  
  // Destructive operations
  const deletePatterns = new RegExp(`(deletar?|remover?|excluir?|apagar?).*${entities}`, 'i');
  
  // Structure update (not simple check-in)
  const updatePatterns = new RegExp(`(atualizar?|editar?|modificar?|alterar?|mudar?).*${entities}`, 'i');
  
  // Direct strategic keywords (no verb needed)
  const directPatterns = /plano estrat[eé]gico|import(ar|e|ação).*(bulk|massa|plan|estrat)|bulk.?import|crie.*completo|monte.*estrutura|fa[cç]a.*planejamento/i;
  
  // Complex multi-entity requests
  const complexPatterns = /com\s+\d+\s+(kr|objetivo|iniciativa|pilar)|incluindo.*kr|vinculad[oa]|hierarquia|cascata/i;

  // Check-in exclusion (simple value updates stay on Flash)
  const isSimpleCheckin = /^(atualiz|check.?in|registr).*(valor|progresso|avan[cç]o)\s*(do|da|de)?\s*(kr|resultado)/i.test(normalized);
  if (isSimpleCheckin) return false;

  return createPatterns.test(normalized) || 
         analysisPatterns.test(normalized) || 
         deletePatterns.test(normalized) || 
         updatePatterns.test(normalized) ||
         directPatterns.test(normalized) ||
         complexPatterns.test(normalized);
}

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

### REGRA DE DIVISÃO DE PLANOS GRANDES:
- Se o plano tiver mais de 8 ações (ex: muitos objetivos + KRs + iniciativas), DIVIDA em múltiplas etapas.
- Sugira ao usuário executar 1 pilar por vez. Ex: "Vou começar pelo pilar Pessoas & Cultura. Após aprovar, criarei os próximos."
- NUNCA gere um bloco [ATLAS_PLAN] com mais de 25 ações de uma vez. Prefira dividir em blocos menores para garantir a qualidade.

### FORMATO OBRIGATÓRIO para planos de execução:

O JSON DEVE ser um objeto com a chave "actions" contendo um array. Cada item do array DEVE ter "type" e "data". NÃO use nenhum outro formato.

### TIPOS DE AÇÃO DISPONÍVEIS:
1. **create_pillar** — Cria um pilar estratégico
   - Campos: name (obrigatório), color (hex, default #3B82F6), description
2. **create_objective** — Cria um objetivo estratégico
   - Campos: title (obrigatório), pillar_name (obrigatório, EXATAMENTE como listado nos pilares), description, target_date (YYYY-MM-DD), weight (1-10, default 1)
3. **create_key_result** — Cria um resultado-chave
   - Campos OBRIGATÓRIOS: title, objective_ref (índice no array), target_value, unit, frequency, monthly_targets, yearly_target, start_month, end_month
   - Campos opcionais: description, weight (1-10), aggregation_type (default sum), comparison_type, target_direction (default maximize)
   - ⚠️ REGRA CRÍTICA: SEMPRE inclua frequency, monthly_targets, yearly_target, start_month e end_month. SEM EXCEÇÃO.
   - monthly_targets DEVE ter valores para cada período conforme a frequência:
     * monthly: {"2026-01": X, "2026-02": Y, ..., "2026-12": Z} (12 entradas)
     * bimonthly: {"2026-01": X, "2026-03": Y, "2026-05": Z, "2026-07": W, "2026-09": V, "2026-11": U} (6 entradas, meses ímpares)
     * quarterly: {"2026-01": X, "2026-04": Y, "2026-07": Z, "2026-10": W} (4 entradas)
     * semesterly: {"2026-01": X, "2026-07": Y} (2 entradas)
     * yearly: {"2026-01": X} (1 entrada com o valor total)
   - yearly_target = meta anual total (soma ou valor final conforme aggregation_type)
   - start_month e end_month definem a vigência (ex: "2026-01" e "2026-12")
4. **create_initiative** — Cria uma iniciativa vinculada a um KR
   - Campos: title (obrigatório), key_result_ref (índice no array, obrigatório se não tiver key_result_id), description, priority, start_date, end_date, responsible, budget
   - ⚠️ REGRA CRÍTICA: Iniciativas DEVEM estar no MESMO bloco [ATLAS_PLAN] que seus KRs pai. NUNCA envie iniciativas em um bloco separado sem os KRs.
5. **create_project** — Cria um projeto estratégico
   - Campos: name (obrigatório), description, priority, start_date, end_date, budget, objective_refs (array de índices), kr_refs (array de índices)
6. **update_key_result** — Atualiza um KR existente
   - Campos: kr_id ou kr_title, current_value, target_value, monthly_actual, monthly_targets, yearly_target, frequency, unit, description, weight, due_date, variation_threshold (número em % ou null para desativar a taxa de variação)
7. **update_initiative** — Atualiza uma iniciativa existente
   - Campos: initiative_id ou initiative_title, status, progress_percentage, etc.
8. **update_objective** — Atualiza um objetivo existente
   - Campos: objective_id ou objective_title (obrigatório), title, description, target_date, weight, status
9. **update_pillar** — Atualiza um pilar existente
   - Campos: pillar_id ou pillar_name (obrigatório), name, description, color
10. **update_project** — Atualiza um projeto existente
    - Campos: project_id ou project_name (obrigatório), name, description, priority, start_date, end_date, budget, status, progress
11. **delete_pillar** — Remove um pilar e todos seus objetivos/KRs em cascata
    - Campos: pillar_id ou pillar_name (obrigatório)
12. **delete_objective** — Remove um objetivo e seus KRs em cascata
    - Campos: objective_id ou objective_title (obrigatório)
13. **delete_key_result** — Remove um KR e seus dados relacionados
    - Campos: kr_id ou kr_title (obrigatório)
14. **delete_initiative** — Remove uma iniciativa
    - Campos: initiative_id ou initiative_title (obrigatório)
15. **delete_project** — Remove um projeto
    - Campos: project_id ou project_name (obrigatório)
16. **bulk_import** — Importação em massa hierárquica
    - Formato: { pillars: [{ name, color, description, objectives: [{ title, target_date, description, weight, key_results: [{ title, target_value, current_value, unit, frequency, monthly_targets, yearly_target, start_month, end_month, description, target_direction, aggregation_type }] }] }], projects: [{ name, description, status, progress, priority, linked_krs: ["título exato do KR"], linked_objectives: ["título exato do objetivo"] }] }
    - Status válidos para projetos: planning, active, on_hold, completed, cancelled (use "active" em vez de "in_progress")
    - NUNCA envolva o conteúdo em um campo "data" extra — envie pillars e projects DIRETAMENTE no objeto data da ação
    - Use para criar estruturas completas do BSC (pilares + objetivos + KRs + projetos vinculados) de uma vez
17. **create_fca** — Cria uma análise FCA (Fato-Causa-Ação) vinculada a um KR
    - Campos: kr_id ou kr_title (obrigatório), title, fact, cause (obrigatórios), description, priority (low/medium/high), status (active/resolved/cancelled), linked_update_month (ex: "2026-02"), linked_update_value (valor numérico do desvio)
    - USE ESTA AÇÃO quando o usuário pedir para justificar desvios, registrar FCAs, ou analisar variações de KRs. NUNCA use update_key_result para criar FCAs.
18. **create_meeting** — Cria reunião de governança RMRE
    - Campos: title (obrigatório), meeting_type (RM/RE/Extraordinaria, obrigatório), scheduled_date (YYYY-MM-DD, obrigatório), scheduled_time (HH:MM), duration_minutes, location, notes
    - Pode incluir agenda_items: array de {title, description}
19. **update_meeting** — Atualiza reunião existente
    - Campos: meeting_id ou meeting_title, title, scheduled_date, scheduled_time, status, notes, location, duration_minutes
20. **delete_meeting** — Remove reunião e dados vinculados
    - Campos: meeting_id ou meeting_title
21. **create_agenda_item** — Cria item de pauta em reunião existente
    - Campos: meeting_id ou meeting_title (obrigatório), title (obrigatório), description
22. **update_golden_circle** — Atualiza o Golden Circle da empresa
    - Campos: why_question, how_question, what_question
23. **update_swot** — Atualiza a Análise SWOT da empresa
    - Campos: strengths, weaknesses, opportunities, threats
24. **update_vision_alignment** — Atualiza o Alinhamento de Visão
    - Campos: shared_objectives, shared_commitments, shared_resources, shared_risks
25. **create_task** — Cria uma task em um projeto estratégico
    - Campos: title (obrigatório), project_ref (índice no array) ou project_id ou project_name (obrigatório), description, status (ESTRITAMENTE: todo, in_progress, review ou done — NUNCA use on_hold, pending, completed ou qualquer outro valor), priority (low/medium/high/critical, default medium), due_date (YYYY-MM-DD), estimated_hours
26. **update_task** — Atualiza uma task existente
    - Campos: task_id ou task_title + project_name (obrigatório para identificar), title, description, status (ESTRITAMENTE: todo, in_progress, review ou done — NUNCA use on_hold, pending, completed ou qualquer outro valor), priority (low/medium/high/critical), due_date, estimated_hours, actual_hours
27. **delete_task** — Remove uma task
     - Campos: task_id ou task_title + project_name (obrigatório para identificar)
28. **generate_insights** — Gera novos insights de IA para a empresa
     - Campos: nenhum campo obrigatório (usa o company_id do contexto)
29. **confirm_insight** — Marca um insight como confirmado/relevante pelo usuário
     - Campos: insight_id (obrigatório)
30. **dismiss_insight** — Descarta um insight
     - Campos: insight_id (obrigatório)
31. **create_insight** — Cria um insight manual
     - Campos: title (obrigatório), description, insight_type (risk/opportunity/info), severity (low/medium/high/critical), category, actionable (boolean)

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
- ⚠️ REGRA OBRIGATÓRIA: Todo KR DEVE conter: frequency, monthly_targets (com valores por período), yearly_target, start_month, end_month. KR sem esses campos é INVÁLIDO.
- ⚠️ REGRA OBRIGATÓRIA: Iniciativas DEVEM estar no MESMO bloco [ATLAS_PLAN] que o objetivo e KRs pai. NUNCA crie um bloco só com iniciativas separadas.
- ⚠️ REGRA OBRIGATÓRIA: Ao criar um plano completo, SEMPRE inclua objetivo + KRs + iniciativas JUNTOS em um único bloco [ATLAS_PLAN].
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

### Consultas sobre dados salvos (SWOT, Golden Circle, Visão, etc.)
→ Quando o usuário perguntar "o que tem salvo?", "me mostra o SWOT", "qual o Golden Circle?", "o que tem no alinhamento de visão?",
   responda SOMENTE com os dados do contexto abaixo. NÃO gere [ATLAS_PLAN].
   NÃO misture com ações de FCA ou outros planos não solicitados.
   Responda APENAS o que foi perguntado. Se não houver dados salvos, diga que ainda não há registro.

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
    
    // Auto-routing: detect complex intent even when plan_mode is off
    const autoDetectedPlan = !plan_mode && needsProModel(message);
    const effectivePlanMode = plan_mode || autoDetectedPlan;
    
    const model = effectivePlanMode
      ? 'google/gemini-2.5-pro'
      : (allowedModels.includes(rawModel) ? rawModel : 'google/gemini-3-flash-preview');
    const temperature = aiSettings?.temperature || 0.7;
    const maxTokens = effectivePlanMode ? 32000 : (aiSettings?.max_tokens || 2000);
    
    if (autoDetectedPlan) {
      console.log(`🧠 Auto-routing: detected complex intent, upgrading to Pro model`);
    }

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

      const [objectivesResult, projectsResult, startupResult, mentoringResult, pillarsResult, govMeetingsResult, govAtasResult, govRuleDocResult, initiativesResult, goldenCircleResult, swotResult, visionResult, insightsResult] = await Promise.all([
        planIds.length > 0
          ? supabase.from('strategic_objectives').select('id, title, progress, status, target_date, pillar_id').in('plan_id', planIds).limit(50)
          : Promise.resolve({ data: [] }),
        planIds.length > 0
          ? supabase.from('strategic_projects').select('id, name, progress, status, start_date, end_date, priority').in('plan_id', planIds).limit(20)
          : Promise.resolve({ data: [] }),
        supabase.from('startup_hub_profiles').select('*').eq('company_id', company_id).single(),
        supabase.from('mentoring_sessions').select('session_date, session_type, status, notes').eq('startup_company_id', company_id).order('session_date', { ascending: false }).limit(10),
        supabase.from('strategic_pillars').select('id, name').eq('company_id', company_id),
        supabase.from('governance_meetings').select('title, meeting_type, scheduled_date, status').eq('company_id', company_id).order('scheduled_date', { ascending: false }).limit(10),
        supabase.from('governance_atas').select('content, decisions, participants, meeting_id, created_at').order('created_at', { ascending: false }).limit(5),
        supabase.from('governance_rule_documents').select('file_name').eq('company_id', company_id).maybeSingle(),
        supabase.from('kr_initiatives').select('id, title, status, priority, progress_percentage, key_result_id').eq('company_id', company_id).limit(50),
        supabase.from('golden_circle').select('why_question, how_question, what_question, updated_at').eq('company_id', company_id).maybeSingle(),
        supabase.from('swot_analysis').select('strengths, weaknesses, opportunities, threats, updated_at').eq('company_id', company_id).maybeSingle(),
        supabase.from('vision_alignment').select('shared_objectives, shared_commitments, shared_resources, shared_risks, updated_at').eq('company_id', company_id).maybeSingle(),
        supabase.from('ai_insights').select('id, title, insight_type, severity, status, category, description, confidence_score, confirmed_at').eq('company_id', company_id).order('created_at', { ascending: false }).limit(20),
      ]);

      objectives = objectivesResult.data || [];
      const objectiveIds = objectives.map(o => o.id);

      const krResult = objectiveIds.length > 0
        ? await supabase.from('key_results').select('id, title, current_value, target_value, unit, due_date, priority, objective_id').in('objective_id', objectiveIds).limit(100)
        : { data: [] };
      keyResults = krResult.data || [];

      projects = projectsResult.data || [];
      startupProfile = startupResult.data;
      mentoringSessions = mentoringResult.data || [];
      const initiatives = initiativesResult.data || [];

      // Build context data string with IDs for Atlas to reference
      const pillars = pillarsResult.data || [];
      const contextParts: string[] = [`CONTEXTO DE REFERÊNCIA da ${companyName} — Use SOMENTE quando a mensagem do usuário pedir análises, métricas ou dados específicos. Use os IDs para ações de update/delete:`];

      if (pillars.length > 0) {
        contextParts.push(`\n🏛️ Pilares Estratégicos (USE EXATAMENTE estes nomes no pillar_name):\n${pillars.map(p => `• ${p.name} (id: ${p.id})`).join('\n')}`);
      }

      if (objectives.length > 0) {
        const pillarMap = Object.fromEntries(pillars.map(p => [p.id, p.name]));
        contextParts.push(`\n📊 Objetivos Estratégicos:\n${objectives.map(obj => {
          const pillarName = pillarMap[obj.pillar_id] || '';
          const objKRs = (keyResults || []).filter((kr: any) => kr.objective_id === obj.id);
          const krLines = objKRs.map((kr: any) => {
            const varInfo = kr.variation_threshold != null ? `, taxa_variacao: ${kr.variation_threshold}%` : '';
            return `    - KR: ${kr.title} (id: ${kr.id}, atual: ${kr.current_value || 0}${kr.unit}, meta: ${kr.target_value}${kr.unit}${varInfo})`;
          }).join('\n');
          const objInitiatives = initiatives.filter(i => objKRs.some((kr: any) => kr.id === i.key_result_id));
          const initLines = objInitiatives.map(i => `    - Iniciativa: ${i.title} (id: ${i.id}, status: ${i.status}, progresso: ${i.progress_percentage || 0}%)`).join('\n');
          return `• ${obj.title} (id: ${obj.id}, pilar: ${pillarName}, progresso: ${obj.progress || 0}%, status: ${obj.status})${krLines ? '\n' + krLines : ''}${initLines ? '\n' + initLines : ''}`;
        }).join('\n')}`);
      }

      // Fetch project tasks
      const projectIds = projects.map((p: any) => p.id);
      let projectTasks: any[] = [];
      if (projectIds.length > 0) {
        const { data: tasksData } = await supabase
          .from('project_tasks')
          .select('id, project_id, title, status, priority, due_date, assignee_id, position')
          .in('project_id', projectIds)
          .order('position', { ascending: true })
          .limit(200);
        projectTasks = tasksData || [];
      }

      if (projects.length > 0) {
        contextParts.push(`\n🚀 Projetos Estratégicos:\n${projects.map((proj: any) => {
          const tasks = projectTasks.filter(t => t.project_id === proj.id);
          const taskLines = tasks.map(t => `    - Task: ${t.title} (id: ${t.id}, status: ${t.status}, prioridade: ${t.priority || 'medium'}${t.due_date ? `, prazo: ${t.due_date}` : ''})`).join('\n');
          return `• ${proj.name} (id: ${proj.id}, progresso: ${proj.progress || 0}%, status: ${proj.status}, prioridade: ${proj.priority || 'N/A'}${proj.start_date ? `, início: ${proj.start_date}` : ''}${proj.end_date ? `, fim: ${proj.end_date}` : ''})${taskLines ? '\n    Tasks:\n' + taskLines : ''}`;
        }).join('\n')}`);
      }
      if (startupProfile) {
        contextParts.push(`\n🎯 Startup Hub:\n• Startup: ${startupProfile.startup_name || 'Não informado'}\n• Setor: ${startupProfile.sector || 'Não informado'}\n• Estágio: ${startupProfile.stage || 'Não informado'}`);
      }
      if (mentoringSessions.length > 0) {
        contextParts.push(`\n👥 Sessões de Mentoria Recentes:\n${mentoringSessions.map(s => `• ${s.session_date}: ${s.session_type} (${s.status})`).join('\n')}`);
      }

      // Governance context
      const govMeetings = govMeetingsResult.data || [];
      const govAtas = govAtasResult.data || [];
      const govRuleDoc = govRuleDocResult.data;

      if (govMeetings.length > 0 || govAtas.length > 0 || govRuleDoc) {
        const govParts: string[] = ['\n📋 Governança RMRE:'];
        if (govMeetings.length > 0) {
          govParts.push(`Reuniões:\n${govMeetings.map(m => `• ${m.title} (${m.meeting_type}) — ${m.scheduled_date} — ${m.status}`).join('\n')}`);
        }
        if (govAtas.length > 0) {
          govParts.push(`Últimas Atas:\n${govAtas.map(a => `• Decisões: ${a.decisions || 'N/A'} | Participantes: ${(a.participants || []).join(', ')}`).join('\n')}`);
        }
        if (govRuleDoc) {
          govParts.push(`Documento de regras: ${govRuleDoc.file_name}`);
        }
        contextParts.push(govParts.join('\n'));
      }

      // Strategic tools context
      const goldenCircle = goldenCircleResult.data;
      const swotData = swotResult.data;
      const visionData = visionResult.data;

      if (goldenCircle) {
        contextParts.push(`\n🟡 Ferramentas Estratégicas - Golden Circle:\n• Why (Por quê): ${goldenCircle.why_question || 'Não preenchido'}\n• How (Como): ${goldenCircle.how_question || 'Não preenchido'}\n• What (O quê): ${goldenCircle.what_question || 'Não preenchido'}\n• Atualizado em: ${goldenCircle.updated_at}`);
      }

      if (swotData) {
        contextParts.push(`\n📊 Análise SWOT:\n• Forças: ${swotData.strengths || 'Não preenchido'}\n• Fraquezas: ${swotData.weaknesses || 'Não preenchido'}\n• Oportunidades: ${swotData.opportunities || 'Não preenchido'}\n• Ameaças: ${swotData.threats || 'Não preenchido'}\n• Atualizado em: ${swotData.updated_at}`);
      }

      if (visionData) {
        contextParts.push(`\n👁️ Alinhamento de Visão:\n• Objetivos Compartilhados: ${visionData.shared_objectives || 'Não preenchido'}\n• Compromissos: ${visionData.shared_commitments || 'Não preenchido'}\n• Recursos: ${visionData.shared_resources || 'Não preenchido'}\n• Riscos: ${visionData.shared_risks || 'Não preenchido'}\n• Atualizado em: ${visionData.updated_at}`);
      }

      // AI Insights context
      const insightsData = insightsResult.data || [];
      if (insightsData.length > 0) {
        const activeInsights = insightsData.filter((i: any) => i.status === 'active');
        const criticalCount = activeInsights.filter((i: any) => i.severity === 'critical' || i.severity === 'high').length;
        const riskCount = activeInsights.filter((i: any) => i.insight_type === 'risk').length;
        const oppCount = activeInsights.filter((i: any) => i.insight_type === 'opportunity').length;

        const insightsParts: string[] = [`\n💡 Insights da Empresa (${activeInsights.length} ativos, ${criticalCount} críticos/altos, ${riskCount} riscos, ${oppCount} oportunidades):`];
        
        // Show top 5 most critical/recent active insights
        const topInsights = activeInsights.slice(0, 5);
        for (const ins of topInsights) {
          const confirmed = ins.confirmed_at ? ' ✓' : '';
          insightsParts.push(`• [${ins.insight_type}/${ins.severity}] ${ins.title} (id: ${ins.id})${confirmed} — ${ins.description || ''}`);
        }
        
        if (activeInsights.length > 5) {
          insightsParts.push(`... e mais ${activeInsights.length - 5} insights ativos.`);
        }

        insightsParts.push(`\nVocê pode gerar novos insights, confirmar, descartar ou criar insights manualmente via [ATLAS_PLAN] com as ações: generate_insights, confirm_insight, dismiss_insight, create_insight.`);
        
        contextParts.push(insightsParts.join('\n'));
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
    // When auto-routing detected complex intent, prefix message so model knows to generate [ATLAS_PLAN]
    const effectiveMessage = autoDetectedPlan ? `[MODO PLAN ATIVO] ${message}` : message;
    
    if (image) {
      aiMessages.push({
        role: 'user',
        content: [
          { type: 'text', text: effectiveMessage },
          { type: 'image_url', image_url: { url: image } },
        ],
      });
    } else {
      aiMessages.push({ role: 'user', content: effectiveMessage });
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

      // Intercept stream to extract usage data for analytics logging
      let usageData: any = null;
      const reader = aiResponse.body!.getReader();
      const { readable, writable } = new TransformStream();
      const writer = writable.getWriter();
      const encoder = new TextEncoder();
      const decoder = new TextDecoder();

      // Process stream in background - re-emit chunks while extracting usage
      (async () => {
        try {
          // Inject auto_plan metadata as first SSE event if auto-detected
          if (autoDetectedPlan) {
            await writer.write(encoder.encode(`data: ${JSON.stringify({ auto_plan: true })}\n\n`));
          }
          let buffer = '';
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            // Forward chunk to client immediately
            await writer.write(value);
            // Parse for usage data
            buffer += decoder.decode(value, { stream: true });
            let newlineIdx: number;
            while ((newlineIdx = buffer.indexOf('\n')) !== -1) {
              const line = buffer.slice(0, newlineIdx).trim();
              buffer = buffer.slice(newlineIdx + 1);
              if (!line.startsWith('data: ') || line === 'data: [DONE]') continue;
              try {
                const parsed = JSON.parse(line.slice(6));
                if (parsed.usage) {
                  usageData = parsed.usage;
                }
              } catch { /* partial JSON, ignore */ }
            }
          }
        } catch (err) {
          console.error('Stream processing error:', err);
        } finally {
          await writer.close();
          // Log analytics after stream completes
          try {
            await supabase.from('ai_analytics').insert({
              user_id: validUserId,
              event_type: 'chat_completion',
              event_data: {
                company_id,
                session_id,
                model_used: model,
                user_name: userName,
                source: 'ai-chat',
                stream: true,
                prompt_tokens: usageData?.prompt_tokens || 0,
                completion_tokens: usageData?.completion_tokens || 0,
                total_tokens: usageData?.total_tokens || 0,
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
            console.log(`📊 Analytics logged (stream) - user: ${userName}, tokens: ${usageData?.total_tokens || 'unknown'}`);
          } catch (logErr) {
            console.error('❌ Failed to log analytics:', logErr);
          }

          // Auto-rename session after first interactions
          if (session_id && previousMessages.length <= 3) {
            try {
              const renameResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${LOVABLE_API_KEY}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  model: 'openai/gpt-5-nano',
                  messages: [
                    { role: 'system', content: 'Resuma esta conversa em um título curto (5-8 palavras, português). Responda APENAS o título, sem aspas, sem pontuação final.' },
                    ...previousMessages.slice(0, 4).map((m: any) => ({ role: m.role, content: m.content.substring(0, 200) })),
                    { role: 'user', content: message.substring(0, 200) },
                  ],
                  temperature: 0.3,
                  max_tokens: 30,
                }),
              });
              if (renameResponse.ok) {
                const renameData = await renameResponse.json();
                const newTitle = renameData.choices?.[0]?.message?.content?.trim();
                if (newTitle && newTitle.length > 3 && newTitle.length < 80) {
                  await supabase.from('ai_chat_sessions').update({ session_title: newTitle }).eq('id', session_id);
                  console.log(`✏️ Session renamed: "${newTitle}"`);
                }
              }
            } catch (renameErr) {
              console.error('❌ Failed to rename session:', renameErr);
            }
          }
        }
      })();

      return new Response(readable, {
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
        source: 'ai-chat',
        stream: false,
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

    // Auto-rename session (non-streaming)
    if (session_id && previousMessages.length <= 3) {
      try {
        const renameResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'openai/gpt-5-nano',
            messages: [
              { role: 'system', content: 'Resuma esta conversa em um título curto (5-8 palavras, português). Responda APENAS o título, sem aspas, sem pontuação final.' },
              ...previousMessages.slice(0, 4).map((m: any) => ({ role: m.role, content: m.content.substring(0, 200) })),
              { role: 'user', content: message.substring(0, 200) },
            ],
            temperature: 0.3,
            max_tokens: 30,
          }),
        });
        if (renameResponse.ok) {
          const renameData = await renameResponse.json();
          const newTitle = renameData.choices?.[0]?.message?.content?.trim();
          if (newTitle && newTitle.length > 3 && newTitle.length < 80) {
            await supabase.from('ai_chat_sessions').update({ session_title: newTitle }).eq('id', session_id);
            console.log(`✏️ Session renamed: "${newTitle}"`);
          }
        }
      } catch (renameErr) {
        console.error('❌ Failed to rename session:', renameErr);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        response: assistantMessage,
        model_used: model,
        auto_plan: autoDetectedPlan || undefined,
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
