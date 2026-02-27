

# Plano: Filtros de período menores que a frequência do KR não encontram dados

## Problema

KRs com frequência "grossa" (semestral, trimestral, etc.) armazenam dados em `monthly_actual` **apenas no primeiro mês do período** (via `periodTargetsToMonthly`). Exemplo:
- KR semestral S1 → dado em `monthly_actual["2026-01"]`
- Filtro bimestral B2 (Mar-Abr) → verifica `monthly_actual["2026-03"]` e `["2026-04"]` → ambos `undefined` → "Vazio"

Mas B2 está **dentro** de S1, então deveria herdar o valor do S1.

## Combinações afetadas

```text
Filtro mensal    → KR bimestral / trimestral / semestral / anual
Filtro bimestral → KR trimestral / semestral / anual
Filtro trimestral → KR semestral / anual
Filtro semestral → KR anual
```

## Solução

Tornar `isKRNullForPeriod` e `getKRPercentageForPeriod` **frequency-aware**: quando a frequência do KR é mais grossa que o filtro, encontrar o período do KR que contém o filtro e usar a chave desse período.

### Alteração 1: Adicionar `frequency` ao tipo do KR em ambas as funções

**Arquivo**: `src/lib/krHelpers.ts`

Adicionar `frequency?: string` ao tipo inline do `kr` em `isKRNullForPeriod` e `getKRPercentageForPeriod`.

### Alteração 2: Criar helper `getEffectiveMonthKeys`

**Arquivo**: `src/lib/krHelpers.ts`

Nova função que recebe a frequência do KR, o período do filtro e as opções, e retorna as month keys corretas para verificar:
- Se a frequência do KR é mais grossa que o filtro, mapear os meses do filtro para o período encapsulante do KR e retornar apenas a chave do primeiro mês desse período (onde o dado está armazenado).
- Se a frequência é igual ou mais fina, retornar as month keys normais do filtro.

Hierarquia de granularidade: `monthly(1) < bimonthly(2) < quarterly(3) < semesterly(6) < yearly(12)`.

Exemplo concreto:
- KR frequency=`semesterly`, filtro=`bimonthly` B2 (Mar-Abr 2026)
- Mar e Abr estão dentro de S1 → chave de S1 = `2026-01`
- `getEffectiveMonthKeys` retorna `["2026-01"]`

### Alteração 3: Usar `getEffectiveMonthKeys` em `isKRNullForPeriod`

Em vez de `getMonthKeysForPeriod(period, options)`, chamar `getEffectiveMonthKeys(kr.frequency, period, options)`.

### Alteração 4: Usar `getEffectiveMonthKeys` em `getKRPercentageForPeriod`

Mesmo ajuste: as month keys usadas para `computeFromMonthKeys` devem vir de `getEffectiveMonthKeys`.

### Alteração 5: Mesma lógica em `useKRMetrics.tsx` → `calculateMetricsForMonths`

**Arquivo**: `src/hooks/useKRMetrics.tsx`

Nos branches de `selectedBimonth`, `selectedQuarter`, `selectedSemester`, `selectedMonth` e `selectedYear`: antes de gerar as `monthKeys`, verificar se a frequência do KR é mais grossa que o período selecionado. Se for, usar as chaves do período encapsulante do KR em vez das chaves dos meses individuais.

---

## Arquivo único impactado na lógica core

| Arquivo | Mudança |
|---------|---------|
| `src/lib/krHelpers.ts` | Nova `getEffectiveMonthKeys`, usada em `isKRNullForPeriod` e `getKRPercentageForPeriod` |
| `src/hooks/useKRMetrics.tsx` | Mesma lógica de remapeamento nos cálculos de métricas por período |

