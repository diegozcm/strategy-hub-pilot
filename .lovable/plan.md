

# Correção: `isKRNullForPeriod` confia em campos pré-calculados do banco que gravam 0 em vez de NULL

## Causa Raiz Confirmada

O banco de dados grava `0` (não `NULL`) nos campos `ytd_percentage`, `yearly_percentage`, `monthly_percentage` quando `monthly_actual = {}`. A função `isKRNullForPeriod` faz fallback para esses campos quando não há opções de período customizadas (linhas 216-235 de `krHelpers.ts`), e como o banco tem `0`, ela retorna `false` — o KR é tratado como "tem dados com 0%".

## Solução

Eliminar o fallback para campos pré-calculados em `isKRNullForPeriod`. Em vez disso, **sempre** gerar month keys e verificar `monthly_actual` diretamente, mesmo nos casos default (sem opções de filtro).

### Alteração 1: `getMonthKeysForPeriod` — nunca retornar `null`

**Arquivo**: `src/lib/krHelpers.ts`

Quando não há opções de período customizadas, gerar month keys usando o ano/mês/quarter correntes:
- `ytd`: Jan até mês atual do ano atual
- `monthly` sem options: mês atual do ano atual
- `yearly` sem options: 12 meses do ano atual
- `quarterly` sem options: 3 meses do quarter atual do ano atual

Assim `getMonthKeysForPeriod` **sempre** retorna `string[]`, nunca `null`.

### Alteração 2: `isKRNullForPeriod` — remover switch de fallback

Sem mais fallback para campos pré-calculados. A lógica fica apenas:
1. Gerar month keys (sempre disponíveis agora)
2. Verificar se TODOS os meses têm `monthly_actual[key] === undefined || null`
3. Retornar `true` (nulo) ou `false` (tem dados)

### Alteração 3: `getKRPercentageForPeriod` — mesma lógica para fallback YTD

Na linha 395, `case 'ytd': percentage = kr.ytd_percentage ?? 0`, também precisamos verificar `monthly_actual` diretamente em vez de confiar no campo pré-calculado. Usar `computeFromMonthKeys` com as month keys do YTD geradas.

---

## Arquivos impactados

| Arquivo | Mudança |
|---------|---------|
| `src/lib/krHelpers.ts` | `getMonthKeysForPeriod`: gerar keys default para todos os períodos. `isKRNullForPeriod`: remover switch de fallback. `getKRPercentageForPeriod`: usar `computeFromMonthKeys` no caso `ytd` default. |

Nenhum outro arquivo precisa ser alterado — `useRumoCalculations`, `useStrategicMap`, e os componentes de UI já consomem `isKRNullForPeriod` e `getKRPercentageForPeriod` corretamente e já tratam `null` como "Vazio" cinza.

