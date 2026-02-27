

# Plano: Distinção Nulo vs Zero — Correção do Cálculo de Média Ponderada

## Diagnóstico do Problema

O sistema inteiro trata **null** (sem dados) como **0** (zero explícito) em 6 pontos críticos de cálculo. Isso faz com que KRs sem nenhum valor preenchido participem das médias ponderadas, derrubando artificialmente os scores de objetivos, pilares e score geral.

**Exemplo real**: Objetivo com 3 KRs — 1 com 50% de atingimento e 2 sem dados. Hoje mostra 16,7% (divide por 3). Deveria mostrar 50% (divide por 1, os nulos são ignorados).

### Onde o bug ocorre

| Local | Problema |
|-------|----------|
| `useRumoCalculations.tsx` L241 | `krProgress.set(kr.id, Math.max(0, progress))` — grava 0 para nulos |
| `useRumoCalculations.tsx` L253 | `krProgress.get(kr.id) \|\| 0` — trata null como 0 na ponderada |
| `useRumoCalculations.tsx` L270-272 | Pillar avg divide por TODOS os objetivos, inclusive nulos |
| `krHelpers.ts` L333/206/245 | `kr.ytd_percentage \|\| 0` — converte null do DB em 0 |
| `krHelpers.ts` L370-380 | `calculateObjectiveProgressWeighted` inclui todos os KRs sem filtrar nulos |
| `useStrategicMap.tsx` L344-551 | `calculateObjectiveProgress` soma todos sem distinção |
| `RumoObjectiveBlock.tsx` L230 | Exibe `0,0%` em vermelho em vez de "Vazio" cinza |
| `RumoPillarBlock.tsx` L32 | Exibe `0,0%` em vermelho em vez de "Vazio" cinza |
| `ResultadoChaveMiniCard.tsx` L62-64 | `?? 0` converte null em 0 |

### Regra de negócio a implementar

```text
NULL ≠ ZERO

- NULL = nenhum valor foi preenchido no período → KR é IGNORADO nos cálculos
- ZERO = valor 0 foi explicitamente preenchido → KR PARTICIPA dos cálculos com valor 0

Detecção de NULL para um período:
  - Mensal: monthly_actual[key] === undefined/null (a chave não existe no objeto)
  - Multi-mês (trim/sem/bi/anual/YTD): TODOS os meses do período têm actual === undefined/null
  - Pre-calculated (ytd_percentage, etc): valor é null/undefined no banco
```

---

## Plano de Implementação

### 1. Criar função utilitária `isKRNullForPeriod`

**Arquivo**: `src/lib/krHelpers.ts`

Nova função exportada que recebe um KR e parâmetros de período, retorna `true` se o KR é nulo (sem dados) para aquele período. Lógica:
- Para cada período, verificar se **todos** os meses relevantes em `monthly_actual` são `undefined` ou `null` (a chave não existe no objeto JSON).
- Para pre-calculated fields (ytd_percentage, etc), verificar se o campo é `null`/`undefined`.
- **Zero explícito** (`monthly_actual["2026-01"] = 0`) NÃO é nulo.

### 2. Alterar `getKRPercentageForPeriod` para retornar `number | null`

**Arquivo**: `src/lib/krHelpers.ts`

- Retornar `null` em vez de `0` quando `isKRNullForPeriod` retorna `true`.
- Manter retorno `0` quando há dados e o cálculo resulta em zero.

### 3. Alterar `calculateObjectiveProgressWeighted` para ignorar KRs nulos

**Arquivo**: `src/lib/krHelpers.ts`

- Filtrar KRs cujo `getKRPercentageForPeriod` retorna `null` antes de calcular.
- Se **todos** os KRs forem nulos, retornar `null` em vez de `0`.
- Alterar assinatura: retorno `number | null`.

### 4. Corrigir `useRumoCalculations.tsx` — Motor do Dashboard

**Arquivo**: `src/hooks/useRumoCalculations.tsx`

- Maps passam a armazenar `number | null`: `Map<string, number | null>`.
- No cálculo de KR progress: usar `isKRNullForPeriod` → se nulo, gravar `null` no map.
- No cálculo de Objetivo: filtrar KRs com progress `!== null` antes da ponderada. Se todos forem null, gravar `null`.
- No cálculo de Pilar: filtrar objetivos com progress `!== null`. Se todos null, gravar `null`.
- No finalScore: filtrar pilares com progress `!== null`.

### 5. Corrigir `useStrategicMap.tsx` — Cálculos do Mapa

**Arquivo**: `src/hooks/useStrategicMap.tsx`

- `calculateObjectiveProgress`: mesma lógica — ignorar KRs nulos no período, retornar `null` se todos nulos.
- `calculatePillarProgress`: ignorar objetivos nulos, retornar `null` se todos nulos.

### 6. UI — Exibir "Vazio" cinza nos blocos do Dashboard

**Arquivos**:
- `src/components/dashboard/RumoObjectiveBlock.tsx`
- `src/components/dashboard/RumoPillarBlock.tsx`
- `src/components/dashboard/RumoDashboard.tsx`

Mudanças:
- Quando `progress === null`: mostrar texto **"Vazio"** com fundo **cinza** (`bg-gray-400 text-white`) em vez de `0,0%` vermelho.
- Adicionar estilo `'empty'` em `getPerformanceColor` e `getPerformanceStyles` para progress null.
- No finalScore: excluir pilares nulos do denominador.

### 7. UI — Exibir "Vazio" nos mini-cards de KR

**Arquivos**:
- `src/components/strategic-map/ResultadoChaveMiniCard.tsx`
- `src/components/strategic-map/ObjectiveCard.tsx`

Mudanças:
- Quando percentage é `null`: exibir "Vazio" em cinza em vez de `0,0%` vermelho.
- Na `ObjectiveCard`, retornar `null` da `calculateObjectiveProgress` local quando todos KRs são nulos, e exibir "Vazio".

### 8. Tooltip do Dashboard — KRs nulos com label "Vazio"

**Arquivo**: `src/components/dashboard/RumoObjectiveBlock.tsx` (tooltip)

- Na listagem de KRs dentro do tooltip, quando `krProgress.get(kr.id) === null`, exibir "Vazio" em cinza em vez de `0,0%`.

---

## Resumo das alterações por arquivo

| Arquivo | Tipo de mudança |
|---------|-----------------|
| `src/lib/krHelpers.ts` | Nova `isKRNullForPeriod`, alterar retornos para `number \| null` |
| `src/hooks/useRumoCalculations.tsx` | Maps `number \| null`, filtrar nulos nas médias |
| `src/hooks/useStrategicMap.tsx` | Mesma lógica de filtro de nulos |
| `src/components/dashboard/RumoObjectiveBlock.tsx` | Exibir "Vazio" cinza |
| `src/components/dashboard/RumoPillarBlock.tsx` | Exibir "Vazio" cinza |
| `src/components/dashboard/RumoDashboard.tsx` | Tratar finalScore com nulos |
| `src/components/strategic-map/ResultadoChaveMiniCard.tsx` | Exibir "Vazio" cinza |
| `src/components/strategic-map/ObjectiveCard.tsx` | Retorno null, exibir "Vazio" |

