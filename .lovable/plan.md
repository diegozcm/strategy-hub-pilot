
# Correcao Completa dos Filtros de Periodo (Objetivo + KR Cards)

## Problema

Existem **3 arquivos** que nao passam os parametros corretos de periodo para o calculo de metricas. Isso faz com que o modal de objetivo e os KR cards exibam valores incorretos ou zerados para filtros como Semestre, Bimestre e Mensal.

---

## Arquivos e Correcoes

### 1. `src/components/strategic-map/ObjectiveCard.tsx`

**Problema A** — Linhas 217-226: Faltam variaveis do contexto
- Falta: `selectedMonthYear`, `selectedSemester`, `selectedSemesterYear`, `selectedBimonth`, `selectedBimonthYear`

**Problema B** — Linhas 238-248: `calculateObjectiveProgress` chamado com params errados
- Para monthly: usa `selectedYear` em vez de `selectedMonthYear`
- Falta semesterly e bimonthly completamente

**Problema C** — Linhas 35-206: A funcao `calculateObjectiveProgress` nao tem cases para `semesterly` e `bimonthly` no switch — cai no default (YTD)

**Correcao:**
- Extrair TODAS as variaveis de periodo do contexto
- Adicionar cases `semesterly` e `bimonthly` na funcao `calculateObjectiveProgress` (mesma logica ja existente no `getKRPercentageForPeriod` de `krHelpers.ts`)
- Corrigir a chamada para passar `selectedMonthYear` no monthly e adicionar semester/bimonth

---

### 2. `src/components/objectives/ObjectivesPage.tsx`

**Problema A** — Linha 274-283 (filtro de status): Faltam params de semester/bimonth e usa `selectedYear` para monthly

**Problema B** — Linha 830-837 (`progressPercentage` do modal): So trata monthly e quarterly, faltam semester/bimonth/yearly. Usa `selectedYear` em vez de `selectedMonthYear` para monthly

**Correcao:**
- Unificar TODAS as chamadas de `calculateObjectiveProgressWeighted` para passar o conjunto completo de opcoes:
  - monthly: `{ selectedMonth, selectedYear: selectedMonthYear }` (corrigir o ano)
  - quarterly: `{ selectedQuarter, selectedQuarterYear }`
  - semesterly: `{ selectedSemester, selectedSemesterYear }`
  - bimonthly: `{ selectedBimonth, selectedBimonthYear }`
  - yearly: `{ selectedYear }`

---

### 3. `src/components/dashboard/RumoObjectiveBlock.tsx`

**Problema** — Linhas 28-34: Faltam `selectedMonthYear`, `selectedSemester`, `selectedSemesterYear`, `selectedBimonth`, `selectedBimonthYear` no destructuring do contexto. O `progressPercentage` vem do pai (useRumoCalculations), entao os KR cards dentro do modal sao os afetados.

**Correcao:**
- Extrair todas as variaveis de periodo do contexto (mesmo que o progress venha do pai, os KR mini cards dentro do modal dependem do contexto global via `ResultadoChaveMiniCard`)

---

## Resumo das mudancas

| Arquivo | Mudanca |
|---------|---------|
| `ObjectiveCard.tsx` | Adicionar semesterly/bimonthly na funcao `calculateObjectiveProgress` + corrigir destructuring e chamada |
| `ObjectivesPage.tsx` | Corrigir 4 chamadas de `calculateObjectiveProgressWeighted` para incluir todos os periodos |
| `RumoObjectiveBlock.tsx` | Extrair variaveis de periodo faltantes do contexto |

Nenhuma mudanca em `ResultadoChaveMiniCard.tsx` (ja corrigido) nem em `useKRMetrics.tsx` (logica correta). A funcao `getKRPercentageForPeriod` em `krHelpers.ts` ja suporta todos os periodos — o problema esta exclusivamente nos componentes que a chamam com parametros incompletos.

---

## Detalhes Tecnicos

### Helper para centralizar opcoes de periodo

Para evitar repeticao, criar uma funcao helper ou extrair as opcoes em uma const reutilizavel:

```text
const periodOptions = {
  selectedMonth: selectedPeriod === 'monthly' ? selectedMonth : undefined,
  selectedYear: selectedPeriod === 'monthly' ? selectedMonthYear
              : selectedPeriod === 'yearly' ? selectedYear
              : undefined,
  selectedQuarter: selectedPeriod === 'quarterly' ? selectedQuarter : undefined,
  selectedQuarterYear: selectedPeriod === 'quarterly' ? selectedQuarterYear : undefined,
  selectedSemester: selectedPeriod === 'semesterly' ? selectedSemester : undefined,
  selectedSemesterYear: selectedPeriod === 'semesterly' ? selectedSemesterYear : undefined,
  selectedBimonth: selectedPeriod === 'bimonthly' ? selectedBimonth : undefined,
  selectedBimonthYear: selectedPeriod === 'bimonthly' ? selectedBimonthYear : undefined,
};
```

Isso deve ser usado em todas as chamadas de `calculateObjectiveProgress` e `calculateObjectiveProgressWeighted`.

### ObjectiveCard - funcao calculateObjectiveProgress

Adicionar ao switch os cases faltantes (semesterly e bimonthly), replicando a logica existente em `getKRPercentageForPeriod` de `krHelpers.ts`. Alternativamente, substituir a funcao inteira pela chamada de `calculateObjectiveProgressWeighted` do `krHelpers.ts` que ja suporta todos os periodos.
