

## Correcao: Coluna `created_by` inexistente em `project_tasks`

### Problema

O handler `create_task` no `ai-agent-execute` tenta inserir `created_by: user.id` na tabela `project_tasks`, mas essa coluna nao existe na tabela. As colunas disponiveis sao: `id, project_id, title, description, assignee_id, due_date, status, priority, estimated_hours, actual_hours, created_at, updated_at, position`.

### Solucao

Remover o campo `created_by` do objeto de insercao de tasks no arquivo `supabase/functions/ai-agent-execute/index.ts` (linha ~1307). Opcionalmente, usar `assignee_id: user.id` para registrar quem criou a task, ja que essa coluna existe.

### Alteracao

**Arquivo: `supabase/functions/ai-agent-execute/index.ts`**

Na secao do handler `create_task` (~linha 1305-1308), trocar:

```
priority: d.priority || 'medium',
position: nextPosition,
created_by: user.id,
```

Por:

```
priority: d.priority || 'medium',
position: nextPosition,
```

Isso remove a referencia a coluna inexistente. O `assignee_id` pode ser definido separadamente se o Atlas enviar essa informacao na acao.

### Deploy

Redeployar a edge function `ai-agent-execute` apos a correcao.

