

# Corrigir Logica da Taxa de Variacao

## Problema

A logica atual compara o valor realizado com o **realizado do periodo anterior**. A logica correta e comparar o valor realizado com a **meta do mesmo periodo**.

**Logica errada (atual):**
`variacao = |realizado - realizado_anterior| / |realizado_anterior| * 100`

**Logica correta:**
`variacao = |realizado - meta| / |meta| * 100`

Exemplos:
- Meta 100, Realizado 108 -> variacao 8% (OK se limite e 50%)
- Meta 80, Realizado 82 -> variacao 2.5% (OK)
- Meta 100, Realizado 40 -> variacao 60% (BLOQUEIA se limite e 50%)

Alem disso, os primeiros periodos (Jan, B1, Q1, S1, Ano) atualmente sao isentos da verificacao e **nao deveriam ser** -- todos os periodos devem obedecer a regra.

## Arquivo Afetado

`src/components/strategic-map/KRUpdateValuesModal.tsx`

## Mudancas

### 1. Simplificar `checkVariation` (linhas 132-159)

- Remover chamada a `getPreviousPeriodKey` -- nao precisamos mais do periodo anterior
- Buscar a **meta do periodo atual** (`monthly_targets` ou convertido via `monthlyTargetsToPeriod`)
- Calcular: `|newValue - target| / |target| * 100`
- Se a meta for zero ou inexistente, retornar null (sem como calcular)
- Retornar `{ variation, targetValue, newValue }` quando exceder o limite

### 2. Remover isencao de primeiros periodos

- A funcao `getPreviousPeriodKey` nao sera mais necessaria para esta verificacao
- Todos os periodos (incluindo Jan, B1, Q1, S1, Ano) passam a ser verificados

### 3. Atualizar interface do resultado

- Trocar `previousValue` por `targetValue` no tipo de retorno para refletir que a comparacao e com a meta
- Atualizar as mensagens exibidas ao usuario (ex: "Variacao de 60% em relacao a meta")

### 4. Atualizar memory

- Atualizar a descricao da feature para refletir a nova logica

