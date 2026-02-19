
# Corrigir Filtros de Periodo nos KR Mini Cards (Modal de Objetivo)

## Problema Raiz

O `useKRMetrics` usa **early-returns** baseados na presenca de opcoes (`selectedSemester`, `selectedBimonth`, `selectedQuarter`, etc.). A ordem de verificacao e:

1. Semestre (linha 180) -- se `selectedSemester` e `selectedSemesterYear` existem, retorna imediatamente
2. Bimestre (linha 201) -- nunca alcancado
3. Trimestre (linha 222) -- nunca alcancado
4. Ano (linha 320) -- nunca alcancado
5. Mensal (linha 346) -- nunca alcancado

O problema: O `ResultadoChaveMiniCard` consome o `PeriodFilterContext`, que **sempre** tem TODOS os valores preenchidos (semestre=1, bimestre=1, quarter=1, etc. -- sao inicializados com valores padrao). Portanto, **a verificacao de semestre (linha 180) sempre ganha**, independentemente de qual periodo o usuario selecionou.

Resultado: Quando o usuario seleciona "Trimestre", o hook retorna dados do semestre (que so preenche `metrics.semesterly`), e o card tenta ler `metrics.quarterly` que esta com valores padrao (0/null).

Excecao: YTD funciona porque `ytd_target`, `ytd_actual`, `ytd_percentage` sao preenchidos em TODOS os branches de retorno.

## Por que o KR Detail (KeyResultMetrics) funciona?

O `KeyResultMetrics` recebe as opcoes como **props do componente pai**, que so passa os valores relevantes para o periodo selecionado. Quando o periodo e "trimestre", `selectedSemester` e `undefined`. Ja o `ResultadoChaveMiniCard` puxa do contexto global que sempre tem tudo preenchido.

## Correcao

### Arquivo: `src/components/strategic-map/ResultadoChaveMiniCard.tsx`

Alterar a chamada do `useKRMetrics` para **so passar as opcoes relevantes ao periodo selecionado**:

```tsx
const metrics = useKRMetrics(resultadoChave, { 
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
});
```

Isso garante que apenas o branch correto do hook sera ativado, e os dados certos serao retornados para cada periodo.

### Verificacao

Testar na conta Perville todos os filtros (YTD, Ano, Semestre, Trimestre, Bimestre, Mensal) no modal de objetivo "KPIs Macro" e confirmar que Faturamento Total mostra 11.8% no semestre (conforme o KR detail).
