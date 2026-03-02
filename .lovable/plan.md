

## Diagnóstico: Erro "400" no ai-agent-execute

### Causa raiz identificada

A empresa **"Copapel [Free]"** (`f9cfc301-20d0-4b60-aa49-ccbee067458f`) **não possui nenhum plano estratégico** na tabela `strategic_plans`. Quando o Atlas tenta executar o `[ATLAS_PLAN]`, a edge function `ai-agent-execute` verifica se existe um plano ativo e retorna 400 com a mensagem:

> "Nenhum plano estratégico ativo encontrado para esta empresa. Crie um plano primeiro."

Esse é o mesmo cenário que ocorre para qualquer empresa nova ou que ainda não teve um plano criado manualmente pelo Mapa Estratégico.

### Por que isso acontece repetidamente

O hook `useStrategicMap` tem uma função `createDefaultStrategicPlan`, mas ela **só é chamada manualmente** — não é invocada automaticamente quando a empresa não tem plano. Além disso, a edge function `ai-agent-execute` simplesmente rejeita tudo com 400, sem tentar criar o plano.

### Plano de correção

**Arquivo: `supabase/functions/ai-agent-execute/index.ts`**

Na seção que verifica o plano ativo (linhas ~189-204), em vez de retornar erro 400 quando não existe plano, **criar automaticamente um plano estratégico ativo** para a empresa:

```text
Fluxo atual:
  plan = busca plano ativo → se null → return 400

Fluxo proposto:
  plan = busca plano ativo → se null → CRIA plano padrão → usa o novo plano
```

O plano criado automaticamente seguirá o mesmo padrão do `createDefaultStrategicPlan`:
- Nome: "Plano Estratégico {anoAtual}-{anoSeguinte}"
- Período: 1 Jan do ano atual até 31 Dez do ano seguinte
- Status: `active`

**Arquivo: `src/hooks/useAtlasChat.ts`** (melhoria complementar)

Quando o `handleExecutePlan` receber um erro 400, exibir a mensagem real do servidor no toast em vez de uma mensagem genérica, para que o usuário entenda o que aconteceu.

### Detalhes técnicos

```text
ai-agent-execute/index.ts (linhas ~189-204):

ANTES:
  if (!plan) → return 400 "Nenhum plano estratégico ativo..."

DEPOIS:
  if (!plan) {
    // Auto-create active plan for company
    const year = new Date().getFullYear();
    const { data: newPlan, error: planErr } = await supabase
      .from('strategic_plans')
      .insert({
        company_id,
        name: `Plano Estratégico ${year}-${year+1}`,
        period_start: `${year}-01-01`,
        period_end: `${year+1}-12-31`,
        status: 'active'
      })
      .select('id')
      .single();
    if (planErr) → return 400 "Erro ao criar plano automático"
    plan = newPlan;
  }
```

Isso garante que o Atlas nunca mais falhe por falta de plano — ele será criado sob demanda.

