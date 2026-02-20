

## Correcao: Objetivos nao aparecem apos importacao

### Problema Identificado

Os dados **foram importados com sucesso** no banco de dados (27 objetivos, 72 KRs, 5 projetos, 19 tasks). Porem, o dashboard mostra "0 objetivos" porque a tabela `strategic_objectives` tem uma coluna `plan_id` que **nao estava no mapeamento de foreign keys** (FK_MAP) da Edge Function.

**O que aconteceu:**
- Os objetivos foram inseridos com o `plan_id` da empresa de **origem** (Perville: `64a5d9bb-...`)
- A empresa de **destino** tem planos com IDs diferentes (`a04e0fb2-...` e `ae5e2742-...`)
- O dashboard filtra objetivos por `plan_id` do plano ativo, entao nao encontra nenhum

### Correcao

**Arquivo:** `supabase/functions/import-company-data/index.ts`

Adicionar `plan_id` ao mapeamento de `strategic_objectives` no FK_MAP:

```text
// Antes (linha 98):
strategic_objectives: { pillar_id: "strategic_pillars" },

// Depois:
strategic_objectives: { pillar_id: "strategic_pillars", plan_id: "strategic_plans" },
```

### Dados ja importados

Apos corrigir a Edge Function, sera necessario **re-importar** os dados (modo "Substituir") na empresa "Empresa copia de testes" para que os objetivos sejam criados com o `plan_id` correto.

### Nota sobre Iniciativas

A Perville nao possui iniciativas cadastradas (0 registros), entao e esperado que nao aparecam na empresa importada.
