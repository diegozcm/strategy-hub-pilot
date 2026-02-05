
# Plano: Corrigir Funcionalidade "Usar o último valor registrado" (aggregation_type = 'last')

## Problema Identificado

A opção "Usar o último valor registrado" (`aggregation_type = 'last'`) existe na interface do usuário, mas **NÃO está implementada** nos cálculos:

1. **Banco de dados (SQL)**: A função `calculate_kr_metrics` não possui tratamento para `aggregation_type = 'last'` - ela só implementa `sum`, `average`, `max` e `min`
2. **Frontend (useRumoCalculations)**: O hook não trata o caso `'last'` e cai no default que faz `sum`
3. **Frontend (KREditModal)**: As funções `calculateYearlyTarget` e `calculateYearlyActual` não tratam `'last'`

---

## O Que Será Implementado

### 1. Correção na Função SQL `calculate_kr_metrics`

Adicionar tratamento para `aggregation_type = 'last'` em todas as seções de cálculo:

**Lógica para 'last':**
- Para target e actual: percorrer os meses de trás para frente (do mais recente ao mais antigo)
- Retornar o **primeiro valor não nulo encontrado** (ou seja, o último mês com dados)

Seções a corrigir:
- YTD (meses 1 até mês atual)
- Yearly (todos os 12 meses)
- Q1, Q2, Q3, Q4 (meses de cada trimestre)

---

### 2. Correção no Hook `useRumoCalculations.tsx`

Adicionar o caso `'last'` em todos os locais onde se aplica agregação:

```typescript
else if (kr.aggregation_type === 'last') {
  // Percorrer do último mês para o primeiro para encontrar o último valor
  for (let i = monthKeys.length - 1; i >= 0; i--) {
    const key = monthKeys[i];
    if (monthlyTargets[key] !== undefined && monthlyTargets[key] !== null) {
      totalTarget = monthlyTargets[key];
      break;
    }
  }
  for (let i = monthKeys.length - 1; i >= 0; i--) {
    const key = monthKeys[i];
    if (monthlyActual[key] !== undefined && monthlyActual[key] !== null) {
      totalActual = monthlyActual[key];
      break;
    }
  }
}
```

Seções a corrigir:
- `periodType === 'yearly'` (linhas ~83-104)
- `periodType === 'quarterly'` (linhas ~133-154)
- `periodType === 'semesterly'` (linhas ~175-192)
- `periodType === 'bimonthly'` (linhas ~215-232)

---

### 3. Correção no `KREditModal.tsx`

Adicionar o caso `'last'` nas funções de cálculo:

```typescript
case 'last':
  // Retornar o último valor não-nulo do período
  for (let i = values.length - 1; i >= 0; i--) {
    if (values[i] !== undefined && values[i] !== null && values[i] > 0) {
      return values[i];
    }
  }
  return 0;
```

Funções a corrigir:
- `calculateYearlyTarget` (linhas ~196-214)
- `calculateYearlyActual` (linhas ~216-232)

---

### 4. Correção no Hook `useKRMetrics.tsx`

Verificar e garantir que o caso `'last'` está funcionando corretamente na função `calculateMetricsForMonths`. 

Este hook **já possui implementação** para `'last'` (linhas 159-172), mas precisa ser validado.

---

## Arquivos a Serem Modificados

| Arquivo | Ação | Prioridade |
|---------|------|------------|
| Nova migration SQL | Criar | Alta |
| `src/hooks/useRumoCalculations.tsx` | Modificar | Alta |
| `src/components/strategic-map/KREditModal.tsx` | Modificar | Alta |
| `src/hooks/useKRMetrics.tsx` | Validar | Média |

---

## Detalhes Técnicos

### Nova Migration SQL

```sql
-- Adicionar suporte para aggregation_type = 'last' na função calculate_kr_metrics

CREATE OR REPLACE FUNCTION public.calculate_kr_metrics(kr_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $function$
DECLARE
  -- ... variáveis existentes ...
BEGIN
  -- ... código existente ...
  
  -- YTD: Adicionar ELSIF para 'last'
  ELSIF kr.aggregation_type = 'last' THEN
    -- Percorrer do mês mais recente para o mais antigo
    FOR i IN REVERSE current_month..1 LOOP
      month_key := current_year || '-' || LPAD(i::TEXT, 2, '0');
      
      IF kr.monthly_targets ? month_key THEN
        month_target := (kr.monthly_targets->>month_key)::NUMERIC;
        IF month_target IS NOT NULL THEN
          ytd_target_val := month_target;
          EXIT; -- Sair do loop ao encontrar o primeiro valor
        END IF;
      END IF;
    END LOOP;
    
    FOR i IN REVERSE current_month..1 LOOP
      month_key := current_year || '-' || LPAD(i::TEXT, 2, '0');
      
      IF kr.monthly_actual ? month_key THEN
        month_actual := (kr.monthly_actual->>month_key)::NUMERIC;
        IF month_actual IS NOT NULL THEN
          ytd_actual_val := month_actual;
          EXIT;
        END IF;
      END IF;
    END LOOP;
  END IF;
  
  -- ... repetir padrão para yearly e cada quarter ...
END;
$function$;
```

### Lógica para useRumoCalculations

```typescript
else if (kr.aggregation_type === 'last') {
  // Ordenar monthKeys em ordem cronológica reversa não é necessário
  // já que percorremos do final para o início
  for (let i = monthKeys.length - 1; i >= 0; i--) {
    const val = monthlyTargets[monthKeys[i]];
    if (val !== undefined && val !== null && val !== 0) {
      totalTarget = val;
      break;
    }
  }
  for (let i = monthKeys.length - 1; i >= 0; i--) {
    const val = monthlyActual[monthKeys[i]];
    if (val !== undefined && val !== null && val !== 0) {
      totalActual = val;
      break;
    }
  }
}
```

---

## Validação por Período

Após implementação, os cálculos devem funcionar corretamente para:

| Filtro | Comportamento Esperado |
|--------|------------------------|
| **Mensal** | Valor do mês selecionado (não aplica agregação) |
| **YTD** | Último valor registrado de jan até mês atual |
| **Anual** | Último valor registrado dos 12 meses |
| **Trimestral** | Último valor registrado dos 3 meses do trimestre |
| **Semestral** | Último valor registrado dos 6 meses do semestre |
| **Bimestral** | Último valor registrado dos 2 meses do bimestre |

---

## Sobre o Toast de Erro

O toast de erro mencionado pelo usuário **não está diretamente relacionado** à seleção da opção "last". O `saveAggregationType` salva corretamente no banco - o problema é que os **cálculos subsequentes** não usam esse valor corretamente.

O erro pode aparecer se houver uma falha de conexão ao salvar, mas a funcionalidade de salvar em si está correta. O problema real é que após salvar, os cálculos ignoram o valor `'last'`.

---

## Resultado Esperado

Após a implementação:

1. Ao selecionar "Usar o último valor registrado", o KR usará o valor mais recente disponível para calcular a meta anual
2. Os cálculos funcionarão corretamente em todos os filtros de período
3. O dashboard e mapas estratégicos exibirão os valores corretos
4. Não haverá mais erros ou comportamento inesperado ao usar esta opção
