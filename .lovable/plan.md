
## Correcao: Validacao de status em create_task e update_task

### Problema

O Atlas gerou uma task com `status: "on_hold"`, que viola o check constraint da tabela `project_tasks`. Os unicos status permitidos sao: `todo`, `in_progress`, `review`, `done`. Apesar do prompt ja listar os valores corretos, a IA pode gerar valores invalidos como `on_hold`, `completed`, `pending`, etc.

### Solucao

Adicionar validacao no executor para garantir que o status sempre seja um valor valido, independentemente do que a IA gere.

### Alteracoes

**Arquivo 1: `supabase/functions/ai-agent-execute/index.ts`**

No handler `create_task` (~linha 1304), adicionar sanitizacao:

```typescript
const VALID_TASK_STATUSES = ['todo', 'in_progress', 'review', 'done'];
const VALID_TASK_PRIORITIES = ['low', 'medium', 'high', 'critical'];

// Sanitizar status
const rawStatus = d.status || 'todo';
const status = VALID_TASK_STATUSES.includes(rawStatus) ? rawStatus : 'todo';

// Sanitizar priority
const rawPriority = d.priority || 'medium';
const priority = VALID_TASK_PRIORITIES.includes(rawPriority) ? rawPriority : 'medium';
```

Aplicar a mesma sanitizacao no handler `update_task` para os campos `status` e `priority` quando presentes.

**Arquivo 2: `supabase/functions/ai-chat/index.ts`**

Reforcar no prompt do Atlas (na descricao da acao `create_task`) que os status validos sao ESTRITAMENTE `todo`, `in_progress`, `review` ou `done` — sem excecoes. Adicionar nota: "NUNCA use on_hold, pending, completed ou qualquer outro valor."

### Deploy

Redeployar `ai-agent-execute` e `ai-chat`.
