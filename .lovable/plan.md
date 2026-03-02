

## Diagnóstico: "KR não pertence a esta empresa"

### Causa raiz

A busca de KR por título (linha 521-526) é **global** — não filtra por empresa/plano:

```typescript
// Busca QUALQUER KR do banco inteiro que bate com o título
const { data: foundKR } = await supabase
  .from('key_results')
  .select('id, objective_id')
  .ilike('title', `%${d.kr_title}%`)
  .limit(1)
  .maybeSingle();
```

Depois, valida se o `objective_id` do KR encontrado pertence ao `plan.id` atual. Como a Copapel [Free] teve o plano auto-criado (vazio, sem objetivos), a busca encontra KRs de **outras empresas** (ex: Copapel principal) e a validação rejeita todas com "não pertence a esta empresa".

Esse mesmo padrão de busca global aparece em múltiplos pontos do arquivo (linhas ~521, ~850 e possivelmente outros).

### Correção

Escopar a busca de KR por título para retornar apenas KRs cujos objetivos pertençam ao plano ativo da empresa atual. Substituir a busca simples por um join filtrado:

```text
ANTES (global):
  key_results.ilike('title', '%...%').limit(1)

DEPOIS (escopado):
  key_results
    .select('id, objective_id, strategic_objectives!inner(plan_id)')
    .ilike('title', '%...%')
    .eq('strategic_objectives.plan_id', plan.id)
    .limit(1)
```

Isso usa o inner join do PostgREST para garantir que só KRs do plano ativo sejam encontrados. Aplicar em todos os pontos onde KRs são buscados por título (~3-4 ocorrências no arquivo).

Adicionalmente, quando nenhum KR é encontrado após o escopo, a mensagem de erro deve ser mais clara: `"KR não encontrado no plano desta empresa"` em vez de `"não pertence a esta empresa"`.

### Arquivos alterados

- `supabase/functions/ai-agent-execute/index.ts` — escopar todas as buscas de KR por título ao `plan.id`

