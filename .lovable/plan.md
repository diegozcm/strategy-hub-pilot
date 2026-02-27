

# Diagnóstico: KRs desaparecem ao mudar filtro de período

## Causa Raiz

O problema está em **`src/lib/krValidityFilter.ts`** — todas as funções `isKRIn*` (Month, Bimonth, Quarter, Semester) **não são frequency-aware**.

### KR em questão
- **"Ficha de indicador EBITDA..."** — frequency: `semesterly`, validity: `2026-01` a `2026-03`
- Dados em `monthly_actual`: `{"2026-01": 1, "2026-07": 1}` (S1 e S2)

### O que acontece com cada filtro

```text
Filtro          │ Função chamada     │ Verificação                        │ Resultado
────────────────┼────────────────────┼────────────────────────────────────┼──────────
Mês Março       │ isKRInMonth        │ "2026-01"≤"2026-03" ✓             │ APARECE ✓
                │                    │ "2026-03"≥"2026-03" ✓             │
────────────────┼────────────────────┼────────────────────────────────────┼──────────
Mês Abril       │ isKRInMonth        │ "2026-01"≤"2026-04" ✓             │ SOME ✗
                │                    │ "2026-03"≥"2026-04" ✗ ← FALHA    │
────────────────┼────────────────────┼────────────────────────────────────┼──────────
Bimestre B3     │ isKRInBimonth      │ "2026-03"≥"2026-05" ✗ ← FALHA    │ SOME ✗
────────────────┼────────────────────┼────────────────────────────────────┼──────────
Trimestre Q2    │ isKRInQuarter      │ "2026-03"≥"2026-04" ✗ ← FALHA    │ SOME ✗
────────────────┼────────────────────┼────────────────────────────────────┼──────────
Semestre S2     │ isKRInSemester     │ "2026-03"≥"2026-07" ✗ ← FALHA    │ SOME ✗
```

### Dois problemas independentes

**Problema 1 — Caminho COM vigência (`start_month`/`end_month` definidos)**:
A comparação `kr.end_month >= filterStart` usa os meses brutos sem considerar a frequência do KR. Este KR semestral com `end_month: '2026-03'` deveria ser considerado válido para qualquer mês dentro de S1 (Jan-Jun), pois o dado de S1 está em `2026-01` e cobre até Junho. Da mesma forma, tem dado em `2026-07` (S2) que cobre Jul-Dez, mas o `end_month: '2026-03'` impede de aparecer.

**Problema 2 — Caminho SEM vigência (fallback para dados)**:
Quando o KR não tem vigência, as funções verificam `monthlyTargets[monthKey] || monthlyActual[monthKey]` para cada mês individual do filtro. Mas um KR semestral armazena dados apenas na chave do início do período (`2026-01` para S1, `2026-07` para S2). Então `isKRInMonth(kr, 4, 2026)` verifica `monthlyActual["2026-04"]` que é `undefined` → retorna `false`. O mesmo bug que já corrigimos em `isKRNullForPeriod` e `getKRPercentageForPeriod`, mas não foi corrigido nas funções de filtro de vigência.

---

## Plano de Correção

### Arquivo único: `src/lib/krValidityFilter.ts`

### 1. Importar ou recriar o helper de remapeamento de frequência

Importar `getKRPeriodStartMonth`-like logic (ou duplicar internamente) para mapear meses do filtro para o mês-início do período do KR.

### 2. Corrigir `isKRInMonth` — caminho sem vigência

Quando o KR não tem vigência, em vez de verificar apenas `monthlyActual["2026-04"]`, remapear o mês do filtro para o mês-início do período do KR. Ex: KR semestral, filtro mês 4 → verificar `monthlyActual["2026-01"]` (S1).

### 3. Corrigir `isKRInMonth` — caminho com vigência

Para KRs com vigência e frequência mais grossa que mensal: expandir o `end_month` para o fim do período da frequência que contém `end_month`. Ex: KR semestral com `end_month: '2026-03'` → março está em S1 que vai até junho → usar `effective_end: '2026-06'` para a comparação.

### 4. Aplicar a mesma lógica em `isKRInBimonth`, `isKRInQuarter`, `isKRInSemester`, `isKRInYear`

Todas as funções `isKRIn*` recebem o mesmo tratamento:
- **Sem vigência**: remapear meses do filtro para chaves efetivas do KR antes de verificar dados
- **Com vigência**: expandir `end_month` (e potencialmente `start_month`) para os limites do período da frequência do KR antes de verificar interseção

### 5. Helper: `getEffectiveValidityRange`

Nova função interna que recebe `start_month`, `end_month` e `frequency` de um KR, e retorna o range efetivo expandido para os limites dos períodos da frequência:
```text
Input:  start='2026-01', end='2026-03', freq='semesterly'
Output: start='2026-01', end='2026-06'  (S1 vai até Jun)

Input:  start='2026-01', end='2026-05', freq='quarterly'
Output: start='2026-01', end='2026-06'  (Q2 vai até Jun)
```

---

## Resumo

| O que muda | Detalhe |
|-----------|---------|
| `krValidityFilter.ts` — novo helper | `getEffectiveValidityRange`: expande vigência para limites de período |
| `isKRInMonth` | Ambos caminhos: frequency-aware |
| `isKRInBimonth` | Ambos caminhos: frequency-aware |
| `isKRInQuarter` | Ambos caminhos: frequency-aware |
| `isKRInSemester` | Ambos caminhos: frequency-aware |
| `isKRInYear` | Caminho sem vigência: frequency-aware |

Nenhum outro arquivo precisa ser alterado.

