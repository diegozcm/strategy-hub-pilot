

## Diagnostico: Projetos nao vinculados a Objetivos no bulk_import

### Problema

O handler `bulk_import` no `ai-agent-execute` cria projetos e vincula KRs via `project_kr_relations`, mas **nunca cria vinculos com objetivos** via `project_objective_relations`. 

O fluxo atual:
1. Cria pilares, objetivos, KRs — guarda mapa `createdKRs` (titulo -> id)
2. Cria projetos — busca KRs pelo titulo e insere em `project_kr_relations`
3. **Nao existe nenhum mapa de objetivos criados** e nenhuma logica para `project_objective_relations`

Enquanto isso, o handler individual `create_project` (linha ~462-472) ja faz vinculacao com objetivos corretamente.

A causa e dupla:
- O **codigo** do bulk_import nao tem logica para vincular objetivos
- O **prompt** do Atlas nao menciona `linked_objectives` no schema de projetos do bulk_import, entao o LLM nunca gera esse campo

### Solucao

**Arquivo 1: `supabase/functions/ai-agent-execute/index.ts`**

No handler `bulk_import`, na secao de processamento de projetos (apos linhas 1064-1094):

1. Adicionar um mapa `createdObjectives: Record<string, string>` (titulo -> id) durante a criacao dos objetivos, similar ao `createdKRs`
2. Adicionar suporte para `linked_objectives` nos projetos — mesma logica de matching por titulo que ja existe para KRs
3. Alem disso, **inferir objetivos automaticamente a partir dos KRs vinculados**: quando um KR e vinculado a um projeto, o objetivo-pai desse KR tambem deve ser vinculado via `project_objective_relations` (para garantir que mesmo que o Atlas nao envie `linked_objectives`, o vinculo aconteca)
4. Adicionar contagem de `objective_links` no resultado

Pseudocodigo da logica adicional:
```text
// Mapa de objetivos criados
createdObjectives: Record<string, string> = {}  // titulo -> id

// Durante criacao de objetivos (linha ~983):
createdObjectives[objTitle] = obj.id;

// Mapa reverso: KR id -> objective id
krToObjective: Record<string, string> = {}

// Durante criacao de KRs (linha ~1027):
krToObjective[kr.id] = obj.id;

// Apos vincular KRs ao projeto (linha ~1094):
// 1. Vincular objetivos explicitamente listados
for linkedObj in projData.linked_objectives:
  buscar objId por titulo em createdObjectives
  insert project_objective_relations

// 2. Inferir objetivos dos KRs vinculados
const inferredObjIds = new Set<string>();
for cada KR vinculado ao projeto:
  if krToObjective[krId]:
    inferredObjIds.add(krToObjective[krId])
for cada objId inferido:
  upsert project_objective_relations (ignorar duplicata)
```

**Arquivo 2: `supabase/functions/ai-chat/index.ts`**

Atualizar o prompt do bulk_import (linha ~174) para incluir `linked_objectives` no schema de projetos:

```
projects: [{ name, description, status, progress, priority, 
  linked_krs: ["título do KR"], 
  linked_objectives: ["título do objetivo"] 
}]
```

### Deploy

Redeployar `ai-agent-execute` e `ai-chat`.

### Resultado esperado

Na proxima importacao em massa, os projetos serao vinculados tanto aos KRs quanto aos objetivos — explicitamente (se o Atlas enviar `linked_objectives`) e implicitamente (inferido dos KRs vinculados).

