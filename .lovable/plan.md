
# Plano: Redesign dos filtros + Botao de Alertas de Variacao

## Resumo

Substituir os 3 Selects de filtro (Pilar, Objetivo, Status) por um unico botao "Filtros" que abre um modal/sheet bonito. Adicionar um botao de alerta na direita que mostra KRs com taxa de variacao pendente de FCA.

---

## Layout final da barra de filtros

```text
[🔍 Buscar por nome...] [⚙ Filtros (badge count)] .............. [🔔 Alertas (badge count)]
|<---------- ESQUERDA ----------->|                               |<--- DIREITA --->|
```

- **Buscar**: Input com icone de lupa (ja existe)
- **Filtros**: Botao com icone `SlidersHorizontal`. Badge com numero de filtros ativos (ex: "2")
- **Alertas**: Botao com icone `AlertTriangle`. Quando inativo: cinza/dessaturado. Quando tem alertas: laranja com badge contador

---

## Parte 1: Modal de Filtros

### Design do modal

Usar um `Sheet` (drawer lateral direito) do shadcn ao inves de um Dialog centralizado. Isso e mais intuitivo para filtros - o usuario ve os resultados mudando atras enquanto filtra.

### Layout interno do Sheet

```text
+------------------------------------------+
|  Filtros                            [X]  |
+------------------------------------------+
|                                          |
|  PILAR ESTRATEGICO                       |
|  +--------------------------------------+|
|  | ○ Todos os pilares                   ||
|  | ● [●] Financeiro                     ||
|  | ○ [●] Inovacao                       ||
|  | ○ [●] Pessoas                        ||
|  +--------------------------------------+|
|                                          |
|  OBJETIVO                                |
|  +--------------------------------------+|
|  | ○ Todos os objetivos                 ||
|  | ● Aumentar receita                   ||
|  | ○ Reduzir custos                     ||
|  +--------------------------------------+|
|                                          |
|  STATUS DE DESEMPENHO                    |
|  +--------------------------------------+|
|  | ○ Todos                              ||
|  | ○ [🔵] Excelente (>105%)             ||
|  | ○ [🟢] No Alvo (100-105%)           ||
|  | ○ [🟡] Atencao (71-99%)             ||
|  | ○ [🔴] Criticos (<71%)              ||
|  +--------------------------------------+|
|                                          |
|  [Limpar filtros]        [Aplicar]       |
+------------------------------------------+
```

Cada secao usa **radio buttons estilizados** com visual de cards/chips selecionaveis. O pilar mostra a bolinha de cor ao lado do nome. Os objetivos sao filtrados dinamicamente pelo pilar selecionado.

Os filtros sao aplicados em tempo real (ao clicar), sem precisar de botao "Aplicar" - mas tera um botao "Limpar filtros" para resetar tudo.

### Componente novo: `KRFiltersSheet.tsx`

Props:
- `open` / `onOpenChange`
- `pillarFilter` / `setPillarFilter`
- `objectiveFilter` / `setObjectiveFilter`
- `progressFilter` / `setProgressFilter`
- `pillars` (lista de pilares com cores)
- `objectives` (lista de objetivos)
- `activeFilterCount` (numero de filtros ativos)

---

## Parte 2: Botao de Alertas de Variacao

### Logica de deteccao

Um KR esta "em alerta" quando:
1. Tem `variation_threshold` definido (nao null)
2. Algum periodo (mes) tem valor `actual` cujo desvio em relacao ao `target` do mesmo periodo excede o threshold
3. NAO tem um FCA vinculado (`linked_update_month`) para aquele periodo especifico

### Calculo (client-side)

Para cada KR com `variation_threshold`:
```
Para cada mes em monthly_actual:
  target = monthly_targets[mes]
  actual = monthly_actual[mes]
  variacao = |actual - target| / |target| * 100
  Se variacao > variation_threshold:
    Verificar se existe FCA com linked_update_month = mes
    Se NAO existe: KR esta em alerta para este mes
```

### Dados necessarios

Os KRs ja tem `variation_threshold`, `monthly_targets` e `monthly_actual` carregados. Preciso carregar os FCAs de TODOS os KRs de uma vez para saber quais meses ja tem FCA vinculado.

Query adicional no `IndicatorsPage`:
```sql
SELECT key_result_id, linked_update_month 
FROM kr_fca 
WHERE key_result_id IN (ids dos KRs com variation_threshold)
```

### Comportamento do botao

| Estado | Visual | Acao ao clicar |
|---|---|---|
| Nenhum alerta | Icone cinza claro, sem badge, sem saturacao | Nada (desabilitado ou tooltip "Sem alertas") |
| Com alertas (inativo) | Icone laranja, badge com numero | Ativa filtro: mostra apenas KRs em alerta |
| Com alertas (ativo/filtrado) | Icone laranja com fundo, badge | Desativa filtro: volta a mostrar todos |

O contador do badge respeita os filtros de Pilar/Objetivo/Busca. Exemplo:
- Total de alertas = 5
- Filtro pilar "Financeiro" ativo: alertas no pilar Financeiro = 2
- Badge mostra "2"

### Componente: logica inline no `IndicatorsPage`

Nao precisa de componente separado para o botao, e apenas um `Button` com logica condicional.

---

## Arquivos a criar/editar

### Novo: `src/components/indicators/KRFiltersSheet.tsx`

Sheet lateral com os 3 grupos de filtro (Pilar, Objetivo, Status) usando RadioGroup do shadcn com visual customizado de cards selecionaveis.

### Editar: `src/components/indicators/IndicatorsPage.tsx`

1. **Remover** os 3 `Select` de filtro da barra
2. **Adicionar** botao "Filtros" com badge de contagem
3. **Adicionar** state `alertFilterActive` e `fcasByKR` (mapa de FCAs por KR)
4. **Adicionar** `useEffect` para carregar FCAs dos KRs com `variation_threshold`
5. **Adicionar** `useMemo` para calcular `alertedKRIds` (set de KR IDs em alerta)
6. **Adicionar** botao de Alertas na direita com badge e logica de toggle
7. **Integrar** filtro de alerta no `filteredKeyResults` existente
8. **Importar** e renderizar `KRFiltersSheet`

### Resultado esperado

- Barra de filtros limpa: so busca + botao filtros + botao alertas
- Sheet lateral intuitivo com filtros visuais
- Botao de alerta mostra quantos KRs precisam de FCA
- Filtro de alerta se combina com os outros filtros
- Tudo funciona tanto nos Cards quanto na Tabela RMRE
