

## Treinar o Atlas para Projetos e Tasks

### Problema
O Atlas conhece pilares, objetivos e KRs em profundidade, mas tem consciencia limitada de projetos (so exibe nome/status/progresso) e zero conhecimento de tasks (`project_tasks`). Nao consegue criar, editar ou listar tasks de projetos.

### Correcoes necessarias

**3 arquivos afetados:**

---

### 1. Contexto enriquecido — `supabase/functions/ai-chat/index.ts`

**No bloco de fetch (Promise.all, linha ~432):** Adicionar query para buscar tasks dos projetos:

```
projectTasksResult:
  supabase.from('project_tasks')
    .select('id, project_id, title, status, priority, due_date, assignee_id, position')
    .in('project_id', projectIds)  // IDs dos projetos ja buscados
    .order('position', { ascending: true })
    .limit(200)
```

Isso requer buscar os IDs dos projetos primeiro, entao sera feito como segunda query apos `projectsResult`.

**No bloco de contexto (linha ~487):** Expandir a secao de Projetos para incluir tasks:

```
De:
  "Projeto X (id, progresso, status)"

Para:
  "Projeto X (id, progresso, status, prioridade, inicio, fim)
    Tasks:
    - Task A (id, status: todo, prioridade: high, prazo: 2026-03-15)
    - Task B (id, status: in_progress, prioridade: medium)"
```

---

### 2. Novas acoes no prompt do Atlas — `supabase/functions/ai-chat/index.ts`

Adicionar 3 novos tipos de acao na secao "TIPOS DE ACAO DISPONIVEIS" (apos item 24):

- **create_task** — Cria uma task em um projeto
  - Campos: title (obrigatorio), project_ref (indice) ou project_id ou project_name, description, status (todo/in_progress/done), priority (low/medium/high), due_date, estimated_hours

- **update_task** — Atualiza uma task existente
  - Campos: task_id ou task_title + project_name (obrigatorio), title, description, status, priority, due_date, estimated_hours, actual_hours

- **delete_task** — Remove uma task
  - Campos: task_id ou task_title + project_name (obrigatorio)

---

### 3. Handlers de execucao — `supabase/functions/ai-agent-execute/index.ts`

Adicionar 3 novos blocos de execucao:

**create_task:**
- Resolver project_id via project_ref (indice no batch), project_id direto, ou busca por project_name
- Calcular proxima position (max position + 1)
- Inserir em `project_tasks` com project_id, title, status (default 'todo'), priority, due_date, etc.

**update_task:**
- Resolver task por task_id direto ou busca por task_title + project_name (para isolar por empresa)
- Atualizar campos fornecidos

**delete_task:**
- Resolver task por task_id ou task_title + project_name
- Deletar da tabela

---

### 4. Labels no frontend — `src/components/ai/FloatingAIChat.tsx`

Na funcao `typeLabel` (linha ~445), adicionar:
```
if (type === 'create_task') return '✅ Task';
```

E no normalizador de acoes (linha ~123), adicionar alias:
```
.replace('create_project_task', 'create_task')
```

---

### Resultado esperado

O Atlas podera:
- Listar projetos com todas as suas tasks quando perguntado
- Criar tasks dentro de projetos existentes via [ATLAS_PLAN]
- Atualizar status, prioridade e prazo de tasks
- Deletar tasks
- Referenciar projetos criados no mesmo batch (via project_ref)

