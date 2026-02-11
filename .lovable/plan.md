
# Fix: "update_key_result" Desconhecido + Iniciativas Sem Referencia

## Problemas Identificados

### Bug 1: Tipo "update_key_result" nao reconhecido
A linha 159 faz `.replace('update_kr', 'update_key_result')`, mas o handler na linha 303 so reconhece `update_key_result_progress` ou `update_kr_progress`. Quando o LLM envia `update_key_result`, ele cai no else "tipo desconhecido".

### Bug 2: Busca de KR para iniciativas falha quando nao ha objetivo novo
A linha 268 busca KRs filtrando por `objective_id` do primeiro objetivo criado **neste batch**. Quando o usuario pede para adicionar iniciativas a um KR existente (sem criar objetivo novo), `results.find(...)` retorna `undefined`, a query usa string vazia e nao encontra nada.

---

## Correcoes

### Arquivo: `supabase/functions/ai-agent-execute/index.ts`

**Correcao 1 - Aceitar `update_key_result` como alias:**

Na linha 303, adicionar `actionType === 'update_key_result'` como condicao aceita:

```typescript
} else if (actionType === 'update_key_result_progress' || actionType === 'update_kr_progress' || actionType === 'update_key_result') {
```

**Correcao 2 - Busca de KR mais ampla para iniciativas:**

Na linha 264-273, quando `parent_kr` esta presente mas nao ha objetivo criado neste batch, fazer busca global pelo titulo do KR dentro do plano ativo (sem filtrar por `objective_id`):

```typescript
if (!keyResultId && d.parent_kr) {
  // Primeiro, tentar buscar pelo objective criado neste batch
  const batchObjectiveId = results.find(r => r.success && r.type === 'create_objective')?.id;
  
  let query = supabase
    .from('key_results')
    .select('id, objective_id')
    .ilike('title', `%${d.parent_kr}%`)
    .limit(1);
  
  if (batchObjectiveId) {
    query = query.eq('objective_id', batchObjectiveId);
  }
  // Se nao tem batch objective, busca em todos os KRs do plano ativo
  
  const { data: foundKR } = await query.single();
  if (foundKR) keyResultId = foundKR.id;
}
```

Isso garante que quando o Atlas propoe iniciativas para um KR ja existente, o sistema consegue localiza-lo.

---

## Secao Tecnica

### Detalhes da correcao do replace (linha 157-159)

O `.replace('update_kr', 'update_key_result')` e problematico porque:
- `update_kr_progress` vira `update_key_result_progress` (OK)
- `update_kr` vira `update_key_result` (nao reconhecido)

A solucao mais simples e adicionar `update_key_result` na condicional do handler em vez de mudar o replace, pois mudar o replace poderia quebrar outros mapeamentos.

### Resultado esperado

- LLM envia `update_key_result` -> handler aceita e atualiza o KR
- LLM envia iniciativas referenciando KR existente por titulo -> busca global encontra o KR
- Botoes Aprovar/Reprovar funcionam -> execucao bem-sucedida
