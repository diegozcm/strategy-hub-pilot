
# Fix: Parser Robusto para Planos Atlas + Reforço do Prompt

## Problema

O LLM esta gerando o JSON do `[ATLAS_PLAN]` em um formato alternativo:

```json
{
  "action": "create_strategic_objective",
  "data": {
    "objective": { "title": "...", "pillar": "..." },
    "key_results": [ { "title": "...", "goal": 50 } ]
  }
}
```

Mas o sistema espera:

```json
{
  "actions": [
    { "type": "create_objective", "data": { "title": "...", "pillar_name": "..." } },
    { "type": "create_key_result", "data": { "title": "...", "target_value": 50 } }
  ]
}
```

O `extractPlan` faz parse do JSON mas nao encontra o array `actions`, resultando em "Plano sem acoes validas para executar."

---

## Correcoes

### 1. Frontend: Normalizar estruturas alternativas do LLM

**Arquivo: `src/components/ai/FloatingAIChat.tsx`** - funcao `extractPlan`

Adicionar logica de normalizacao apos o `JSON.parse`:

- Se o JSON tem `action` (singular) + `data.objective` + `data.key_results` -> converter para o formato `actions[]`
- Mapear campos alternativos: `pillar` -> `pillar_name`, `goal` -> `target_value`, `metric_type` -> `unit`, `deadline` -> `target_date`
- Isso garante resiliencia independente do formato que o LLM gerar

Pseudo-logica:
```
Se plan.action && plan.data.objective:
  actions = []
  actions.push({ type: "create_objective", data: { title, pillar_name, description, target_date } })
  Para cada kr em plan.data.key_results:
    actions.push({ type: "create_key_result", data: { title, target_value, unit, objective_ref: 0 } })
  plan = { actions }
```

### 2. Backend: Reforcar exemplos no system prompt

**Arquivo: `supabase/functions/ai-chat/index.ts`**

Adicionar um contra-exemplo explicito no prompt:

```
FORMATO ERRADO (NAO USE):
{ "action": "create_strategic_objective", "data": { "objective": {...}, "key_results": [...] } }

FORMATO CORRETO (USE ESTE):
{ "actions": [ { "type": "create_objective", "data": {...} }, { "type": "create_key_result", "data": {...} } ] }
```

Tambem reforcar: "O JSON DEVE ser um objeto com chave 'actions' contendo um array. Cada item do array DEVE ter 'type' e 'data'."

### 3. Backend: Remover markdown code fences do prompt exemplo

O LLM as vezes copia o formato do prompt incluindo code fences. Ja temos strip de fences no parser, mas garantir que o exemplo no prompt NAO use code fences.

---

## Resultado esperado

- Planos gerados no formato alternativo sao automaticamente convertidos para o formato correto
- O LLM recebe instrucoes mais claras sobre o formato exato esperado
- Menos falhas de "Plano sem acoes validas"
