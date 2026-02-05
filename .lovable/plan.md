
# Plano: Remover Funcionalidade "Usar o último valor registrado"

## Resumo
Vamos remover completamente a opção "Usar o último valor registrado" (`aggregation_type = 'last'`) do sistema, tanto no frontend quanto no backend, já que a funcionalidade não está funcionando corretamente.

---

## Arquivos a Modificar

### 1. Formulários de Criação de KR (Remover opção do seletor)

| Arquivo | Alteração |
|---------|-----------|
| `src/components/objectives/InlineKeyResultForm.tsx` | Remover `{ value: 'last', label: 'Usar o último valor registrado' }` do array `aggregationOptions` |
| `src/components/indicators/StandaloneKeyResultForm.tsx` | Remover `{ value: 'last', label: 'Usar o último valor registrado' }` do array `aggregationOptions` |
| `src/components/strategic-map/KREditModal.tsx` | Remover `<SelectItem value="last">Usar o último valor registrado</SelectItem>` |
| `src/components/strategic-map/AddResultadoChaveModal.tsx` | Remover `<SelectItem value="last">Usar o último valor registrado</SelectItem>` |

### 2. Tipos TypeScript (Remover do union type)

| Arquivo | Alteração |
|---------|-----------|
| `src/types/strategic-map.ts` | Alterar tipo `aggregation_type` de `'sum' \| 'average' \| 'max' \| 'min' \| 'last'` para `'sum' \| 'average' \| 'max' \| 'min'` |
| `src/hooks/useKRMetrics.tsx` | Remover `'last'` do tipo `aggregation_type` |

### 3. Lógica de Cálculos (Remover tratamento de 'last')

| Arquivo | Alteração |
|---------|-----------|
| `src/hooks/useRumoCalculations.tsx` | Remover 4 blocos `else if (kr.aggregation_type === 'last')` nos períodos: yearly, quarterly, semesterly, bimonthly |
| `src/components/strategic-map/KREditModal.tsx` | Remover `case 'last':` nas funções `calculateYearlyTarget` e `calculateYearlyActual` |

### 4. Processamento de Dados (Remover do type casting)

| Arquivo | Alteração |
|---------|-----------|
| `src/hooks/useStrategicMap.tsx` | Alterar casts de `'sum' \| 'average' \| 'max' \| 'min' \| 'last'` para `'sum' \| 'average' \| 'max' \| 'min'` |
| `src/components/indicators/IndicatorsPage.tsx` | Alterar cast de `aggregation_type` |

### 5. Banco de Dados (Remover lógica SQL)

Criar uma nova migration para atualizar a função `calculate_kr_metrics`, removendo os blocos de tratamento para `aggregation_type = 'last'`.

---

## Detalhes Técnicos

### Tipo atualizado:
```typescript
aggregation_type?: 'sum' | 'average' | 'max' | 'min';
```

### Opções de agregação atualizadas:
```typescript
const aggregationOptions = [
  { value: 'sum', label: 'Somar todas as metas' },
  { value: 'average', label: 'Calcular a média das metas' },
  { value: 'max', label: 'Usar o maior valor entre as metas' },
  { value: 'min', label: 'Usar o menor valor entre as metas' }
];
```

---

## Impacto

- KRs existentes que possuem `aggregation_type = 'last'` continuarão com esse valor no banco, mas serão tratados como `'sum'` (fallback para default) nos cálculos
- Usuários não poderão mais selecionar essa opção
- Nenhuma perda de dados, apenas a opção fica indisponível

---

## Total de Arquivos

8 arquivos de frontend + 1 migration SQL
