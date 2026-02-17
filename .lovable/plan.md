
# Plano: Indicador visual de alerta nos Cards e na Tabela RMRE

## Objetivo

Adicionar um indicador visual nos KRs que estao em alerta (taxa de variacao sem FCA) tanto nos cards quanto nas linhas da tabela RMRE, para que o usuario identifique rapidamente quais KRs precisam de atencao mesmo sem clicar no botao de alertas.

---

## Design visual

### No KRCard

Adicionar um icone de alerta (triangulo amarelo/laranja) na area de indicadores de performance, logo abaixo da barra de progresso, ao lado dos MonthlyPerformanceIndicators. O icone tera um tooltip explicando que o KR tem variacao pendente de FCA.

Layout do card com alerta:

```text
+----------------------------------+
| [Titulo do KR]           P:3    |
| [Pilar]                         |
+----------------------------------+
| Atingimento YTD          59.7%  |
| [=========>          ] vermelho  |
|                                  |
| ▲ ◉ ○ ○ ○    <-- indicadores    |
|                                  |
| Indicador YTD    Meta YTD       |
| 185,0 score      310,0 score    |
|                                  |
| Ultima atualizacao: 17/02/2026  |
+----------------------------------+
```

O triangulo de alerta (▲) aparece ao lado dos indicadores mensais. E um icone `AlertTriangle` laranja com tooltip "Variacao pendente de FCA".

### Na Tabela RMRE

Na linha do KR em alerta:
1. Um icone `AlertTriangle` laranja pequeno ao lado do nome do KR na primeira coluna
2. Um leve fundo laranja transparente na linha inteira (`bg-orange-50/50` ou similar) para destaque sutil

---

## Secao tecnica

### Arquivo 1: `src/components/indicators/IndicatorsPage.tsx`

Passar `alertedKRIds` como prop para ambos os componentes:

- No `KRCard`: adicionar prop `isAlerted={alertedKRIds.has(keyResult.id)}`
- No `KRTableView`: adicionar prop `alertedKRIds={alertedKRIds}`

### Arquivo 2: `src/components/indicators/KRCard.tsx`

1. Adicionar prop `isAlerted?: boolean`
2. Importar `AlertTriangle` do lucide-react e `Tooltip` do shadcn
3. No body do card, na area dos MonthlyPerformanceIndicators, renderizar condicionalmente um icone de alerta laranja com tooltip quando `isAlerted` for true
4. Opcionalmente adicionar uma borda ou sutil indicacao visual no card (ex: borda esquerda laranja, ou shadow laranja suave)

### Arquivo 3: `src/components/indicators/KRTableView.tsx`

1. Adicionar prop `alertedKRIds?: Set<string>` na interface
2. Na renderizacao de cada `TableRow`, verificar se o KR esta no set
3. Se estiver em alerta:
   - Adicionar classe de fundo sutil laranja na linha (`bg-orange-50/40 dark:bg-orange-950/20`)
   - Adicionar icone `AlertTriangle` laranja ao lado do titulo do KR na primeira celula
   - Tooltip no icone explicando "Variacao acima do limite sem FCA vinculado"

### Resumo das mudancas

| Arquivo | Tipo | Mudanca |
|---|---|---|
| `IndicatorsPage.tsx` | Editar | Passar `isAlerted` para KRCard e `alertedKRIds` para KRTableView |
| `KRCard.tsx` | Editar | Adicionar prop `isAlerted`, icone de alerta com tooltip |
| `KRTableView.tsx` | Editar | Adicionar prop `alertedKRIds`, destaque na linha e icone de alerta |
