
# Corrigir Filtros de Periodo no Modal de Objetivo

## Problema Identificado

O `ResultadoChaveMiniCard` e o `ObjectiveDetailModal` nao suportam os periodos **Semestre** e **Bimestre**. Somente YTD, Ano, Trimestre e Mensal estao parcialmente implementados.

### Causa Raiz (2 arquivos)

1. **`ResultadoChaveMiniCard.tsx`** (linhas 24-62):
   - So extrai do contexto: `periodType`, `selectedMonth`, `selectedYear`, `selectedQuarter`, `selectedQuarterYear`
   - **Falta**: `selectedSemester`, `selectedSemesterYear`, `selectedBimonth`, `selectedBimonthYear`, `selectedMonthYear`
   - Na logica de calculo (linhas 40-62), so trata `quarterly`, `monthly`, `yearly` e fallback para `ytd` — ignora `semesterly` e `bimonthly`
   - Nao passa os parametros de semestre/bimestre para `useKRMetrics`

2. **`ObjectiveDetailModal.tsx`** (linhas 96-102):
   - So extrai do contexto: `periodType`, `selectedMonth`, `selectedYear`, `selectedQuarter`, `selectedQuarterYear`
   - **Falta**: `selectedSemester`, `selectedSemesterYear`, `selectedBimonth`, `selectedBimonthYear`, `selectedMonthYear`
   - O badge de periodo (linhas 202-216) so exibe YTD, Trimestre, Ano e Mensal — nao exibe Semestre nem Bimestre

O hook `useKRMetrics` ja suporta semesterly e bimonthly corretamente — o problema esta exclusivamente nos componentes que consomem o hook.

---

## Plano de Correcao

### Etapa 1 — Corrigir `ResultadoChaveMiniCard.tsx`

- Extrair do contexto os campos faltantes: `selectedSemester`, `selectedSemesterYear`, `selectedBimonth`, `selectedBimonthYear`, `selectedMonthYear`
- Passar todos para `useKRMetrics`
- Adicionar `semesterly` e `bimonthly` na logica de selecao de `currentValue`, `targetValue` e `percentage`
- Corrigir monthly para usar `selectedMonthYear` em vez de `selectedYear`

### Etapa 2 — Corrigir `ObjectiveDetailModal.tsx`

- Extrair do contexto os campos faltantes: `selectedSemester`, `selectedSemesterYear`, `selectedBimonth`, `selectedBimonthYear`, `selectedMonthYear`
- Atualizar o badge de periodo para exibir corretamente Semestre e Bimestre selecionados

### Etapa 3 — Testar

- Acessar com usuario teste na empresa Perville
- Testar cada filtro: YTD, Ano, Semestre (S1/S2), Trimestre (Q1-Q4), Bimestre (todos), Mensal (cada mes)
- Verificar que valores e percentuais mudam conforme o periodo selecionado
