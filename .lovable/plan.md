

## Diagnostico: bulk_import do Atlas falha silenciosamente

### Problema raiz

O Atlas gerou um plano `bulk_import` com estrutura **aninhada** (pillars > objectives > key_results, projects com linked_krs). Porem, o handler `bulk_import` no `ai-agent-execute` delega para a edge function `import-company-data`, que tem **dois problemas fatais**:

1. **Exige System Admin** (`is_system_admin`) — o usuario logado normal recebe 403 Forbidden
2. **Espera formato de tabelas planas** (`{ strategic_pillars: [...], strategic_objectives: [...], key_results: [...] }`) — mas recebe formato aninhado (`{ pillars: [{ objectives: [{ key_results: [...] }] }] }`) e nao processa nada

Resultado: a importacao falha (403 ou 0 registros inseridos) e o Atlas responde como se tivesse funcionado.

### Solucao

Reescrever o handler `bulk_import` no `ai-agent-execute` para processar a estrutura aninhada diretamente, sem chamar `import-company-data`. O handler vai "achatar" a hierarquia e criar cada item usando a mesma logica dos handlers individuais (`create_pillar`, `create_objective`, `create_key_result`, `create_project`).

Tambem atualizar o prompt do Atlas em `ai-chat` para documentar melhor o formato esperado do `bulk_import`, para que o LLM gere dados consistentes.

### Alteracoes

**Arquivo 1: `supabase/functions/ai-agent-execute/index.ts`**

Substituir o handler `bulk_import` (linhas ~914-960) por logica que:

1. Detecta se o payload tem formato aninhado (`pillars` array) ou plano (`strategic_pillars` array)
2. Para formato aninhado:
   - Itera cada pilar, cria via `strategic_pillars` insert
   - Para cada objetivo dentro do pilar, cria via `strategic_objectives` insert (usando o pillar.id recem-criado)
   - Para cada KR dentro do objetivo, cria via `key_results` insert (usando o objective.id recem-criado)
   - Para cada projeto, cria via `strategic_projects` insert
   - Para cada `linked_krs` do projeto, busca KRs pelo titulo e cria `project_kr_relations`
3. Sanitiza status de projetos para valores validos (`planning`, `active`, `on_hold`, `completed`, `cancelled`)
4. Normaliza unidades de KR (`R$`, `%`, `un`, `score`, `dias`)
5. Retorna contagem detalhada de itens criados

Pseudocodigo:
```text
bulk_import handler:
  payload = action.data
  
  // Detectar formato
  if payload.data existe:
    payload = payload.data   // Atlas envelopa em {data: {...}}
  
  if payload.pillars (formato aninhado):
    createdKRs = {}  // mapa titulo -> id
    
    for pilar in payload.pillars:
      insert strategic_pillars -> pillarId
      
      for obj in pilar.objectives:
        insert strategic_objectives (pillar_id=pillarId) -> objId
        
        for kr in obj.key_results:
          normalizar unit, frequency
          insert key_results (objective_id=objId) -> krId
          createdKRs[kr.title] = krId
    
    for proj in payload.projects:
      sanitizar status
      insert strategic_projects -> projId
      
      for linked_kr_title in proj.linked_krs:
        krId = buscar em createdKRs por matching parcial
        if krId: insert project_kr_relations
    
    results.push(resumo)
  
  else:
    // fallback: formato plano (manter compatibilidade)
    chamar import-company-data (logica atual)
```

**Arquivo 2: `supabase/functions/ai-chat/index.ts`**

Atualizar a descricao da acao `bulk_import` no prompt (linha ~173-175) para especificar que o formato aceito e o hierarquico:

```
16. **bulk_import** — Importacao em massa hierarquica
    - Formato: { pillars: [{ name, color, description, objectives: [{ title, target_date, description, key_results: [{ title, target_value, unit, frequency, ... }] }] }], projects: [{ name, description, status, progress, linked_krs: ["titulo do KR"] }] }
    - Status validos para projetos: planning, active, in_progress, on_hold, completed, cancelled
    - NUNCA use "data" como wrapper — envie pillars e projects diretamente no objeto data da acao
```

### Deploy

Redeployar `ai-agent-execute` e `ai-chat`.

### Resultado esperado

Ao reenviar o prompt do Grupo Copapel, o Atlas ira:
- Criar 4 pilares (Financeiro, Clientes e Mercado, Processos Internos, Aprendizado e Crescimento)
- Criar 9 objetivos estrategicos
- Criar ~17 KRs com metas, unidades e frequencias
- Criar 8 projetos estrategicos vinculados aos KRs corretos

