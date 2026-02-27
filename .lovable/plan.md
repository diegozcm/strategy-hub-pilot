

# Fix: KRs desaparecem em qualquer filtro que não seja YTD

## Causa raiz

Todas as funções `isKRIn*` em `krValidityFilter.ts` retornam `false` quando a vigência expandida (`getEffectiveValidityRange`) não cobre o período do filtro — **sem verificar se existem dados reais naquele período**.

Exemplos concretos:

| KR | Vigência | Dados reais | Filtro Ano 2026 | Resultado |
|----|----------|-------------|-----------------|-----------|
| KR12 | 2025-01 a 2025-12 | 2026-01, 2026-07 | effEnd=2025-12 < 2026-01 | **SOME** |
| EBITDA | 2026-01 a 2026-03 (→06) | 2026-01, 2026-07 | effEnd=2026-06 < 2026-07 | **SOME em S2/Q3+** |

YTD funciona porque `filterKRsByValidity` retorna `true` incondicionalmente.

## Solução

Adicionar fallback `hasDataInRange` em **todas** as funções `isKRIn*` quando o caminho com vigência falha. Se a vigência diz "não", mas existem dados reais no período, o KR deve aparecer.

### Arquivo: `src/lib/krValidityFilter.ts`

Alterar 5 funções — mesma mudança em cada uma:

```typescript
// ANTES (exemplo isKRInYear):
const { start: effStart, end: effEnd } = getEffectiveValidityRange(...);
return effStart <= yearEnd && effEnd >= yearStart;

// DEPOIS:
const { start: effStart, end: effEnd } = getEffectiveValidityRange(...);
const inValidity = effStart <= yearEnd && effEnd >= yearStart;
if (inValidity) return true;
// Fallback: KR has actual data in this period
return hasDataInRange(kr, startMonth, endMonth, year);
```

Funções afetadas:
1. **`isKRInQuarter`** (linha 170-173) — adicionar fallback com `hasDataInRange(kr, quarterStartMonth, quarterEndMonth, year)`
2. **`isKRInYear`** (linha 184-187) — adicionar fallback com `hasDataInRange(kr, 1, 12, year)`
3. **`isKRInMonth`** (linha 204-205) — adicionar fallback com `hasDataInRange(kr, month, month, year)`
4. **`isKRInSemester`** (linha 288-291) — adicionar fallback com `hasDataInRange(kr, semesterStartMonth, semesterEndMonth, year)`
5. **`isKRInBimonth`** (linha 309-312) — adicionar fallback com `hasDataInRange(kr, bimonthStartMonth, bimonthEndMonth, year)`
6. **`getPopulatedQuarters`** (linha 123-124) — adicionar fallback
7. **`getKRQuarters`** (linha 148-151) — adicionar fallback

Nenhum outro arquivo precisa ser alterado.

