
# Fix: Resolucao de Referencias e Suporte a Metas/Valores no Atlas Agent

## Problemas Identificados

### Bug 1: Referencias cascata falham silenciosamente
Quando o Atlas propoe um plano com Objetivo + KRs + Iniciativas, se o Objetivo (indice 0) falha por qualquer motivo (pilar nao encontrado, etc.), todos os KRs que referenciam `objective_ref: 0` falham com "Objetivo de referencia nao encontrado" sem explicar a causa raiz. O mesmo acontece com iniciativas que dependem de KRs.

### Bug 2: Handler de update_key_result muito limitado
O handler so atualiza `current_value` e `monthly_actual`. Nao suporta:
- `monthly_targets` (metas periodicas)
- `yearly_target` (meta anual)
- `target_value` (valor alvo)
- `frequency` (frequencia)
- `unit` (unidade)
- `description`, `weight`, etc.

### Bug 3: .single() em buscas fuzzy pode gerar erros 406
Todas as buscas por pilar, objetivo e KR usam `.single()` que falha quando 0 resultados sao retornados (PostgREST 406). Deve usar `.maybeSingle()`.

### Bug 4: Pilares com caracteres especiais
Pilares como "Inovacao & Crescimento" podem nao ser encontrados se o LLM enviar "Inovacao e Crescimento" (sem o `&`).

---

## Correcoes

### Arquivo: `supabase/functions/ai-agent-execute/index.ts`

**Correcao 1 - Trocar .single() por .maybeSingle() em todas as buscas fuzzy:**

Linhas 170-176 (pilar), 210-216 (objetivo), 267-277 (KR), 321-326 (KR por titulo) — todas devem usar `.maybeSingle()` em vez de `.single()`.

**Correcao 2 - Melhorar matching de pilares:**

Na busca de pilar, normalizar o nome removendo `&` e comparando com `e`:
```typescript
// Tentar busca direta primeiro
let pillar = await buscarPilar(d.pillar_name);
// Se nao encontrou, tentar substituindo & por e / e por &
if (!pillar) {
  const altName = d.pillar_name.replace(/&/g, 'e').replace(/ e /g, ' & ');
  pillar = await buscarPilar(altName);
}
```

**Correcao 3 - Mensagens de erro com contexto de cascata:**

Quando um KR falha por nao achar o objetivo, incluir na mensagem se o objetivo referenciado tambem falhou:
```typescript
if (!objectiveId) {
  const refResult = d.objective_ref !== null ? results[d.objective_ref] : null;
  const reason = refResult && !refResult.success 
    ? `(o objetivo na posicao ${d.objective_ref} falhou: ${refResult.error})` 
    : '';
  results.push({ type: actionType, success: false, error: `Objetivo de referencia nao encontrado. ${reason}` });
}
```

**Correcao 4 - Expandir handler update_key_result:**

Adicionar suporte a todos os campos atualizaveis:
```typescript
if (d.monthly_targets) updateData.monthly_targets = d.monthly_targets;
if (d.yearly_target !== undefined) updateData.yearly_target = d.yearly_target;
if (d.target_value !== undefined) updateData.target_value = d.target_value;
if (d.frequency) updateData.frequency = d.frequency;
if (d.unit) updateData.unit = d.unit;
if (d.description) updateData.description = d.description;
if (d.weight !== undefined) updateData.weight = d.weight;
if (d.due_date) updateData.due_date = d.due_date;
```

**Correcao 5 - Adicionar handler update_initiative:**

Novo action type `update_initiative` para atualizar status, progresso e dados de iniciativas existentes.

---

## Secao Tecnica

### Arquivo unico a editar
- `supabase/functions/ai-agent-execute/index.ts`

### Detalhes das mudancas

1. **Linhas 170-176**: `.single()` → `.maybeSingle()` na busca de pilar
2. **Linhas 210-216**: `.single()` → `.maybeSingle()` na busca de objetivo por titulo
3. **Linhas 267-277**: `.single()` → `.maybeSingle()` na busca de KR por titulo  
4. **Linhas 321-326**: `.single()` → `.maybeSingle()` na busca de KR para update
5. **Linha 164-181**: Adicionar fallback de nome de pilar (& vs e)
6. **Linhas 220-223**: Melhorar mensagem de erro com contexto de cascata
7. **Linhas 281-283**: Mesma melhoria para iniciativas
8. **Linhas 335-337**: Expandir campos do updateData para suportar monthly_targets, yearly_target, target_value, frequency, unit, description, weight
9. **Apos linha 348**: Adicionar novo handler `update_initiative`

### Resultado esperado
- Pilares com `&` ou `e` sao encontrados corretamente
- Erros de cascata mostram a causa raiz ("o objetivo na posicao 0 falhou porque pilar X nao foi encontrado")
- O Atlas pode definir metas (monthly_targets), valores alvo e frequencia nos KRs
- O Atlas pode atualizar iniciativas existentes
