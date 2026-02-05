

# Plano: Corrigir Tratamento de Valores Nulos na Tabela RMRE

## Problema
Na tabela RMRE (Meta, Real, Resultado, Eficiência), valores **nulos** (ausência de dados) estão sendo tratados como **zero**, o que é incorreto. Zero é um valor real válido, enquanto nulo indica que não há dados registrados.

## Causa Raiz
A função `aggregateMonthlyValues` retorna `0` tanto quando:
- Não existe `monthlyData` (linha 82)
- Não há valores no período (linha 93)

Isso faz com que a UI exiba "0,0%" ou "R$ 0,00" em vez de "—" para indicar ausência de dados.

---

## Solução

### 1. Modificar `aggregateMonthlyValues` para retornar `null` quando não há dados

**De:**
```typescript
if (!monthlyData) return 0;
// ...
if (values.length === 0) return 0;
```

**Para:**
```typescript
if (!monthlyData) return null;
// ...
if (values.length === 0) return null;
```

### 2. Atualizar retorno de `calculateMetricsByFrequency`

```typescript
return {
  target,         // number | null
  actual,         // number | null
  percentage,
  result: (actual !== null && target !== null) ? actual - target : null,
  hasData: actual !== null || target !== null,
};
```

### 3. Criar função `formatValueOrEmpty` para exibição

```typescript
const formatValueOrEmpty = (value: number | null, unit: string = '%'): string => {
  if (value === null) return '—';
  return formatValue(value, unit);
};
```

### 4. Atualizar renderização da tabela

| Coluna | Alteração |
|--------|-----------|
| Meta | Usar `formatValueOrEmpty(meta, kr.unit)` |
| Real | Usar `formatValueOrEmpty(real, kr.unit)` |
| Resultado | Exibir "—" se `resultado === null` |
| Eficiência | Exibir "—" com cor cinza se não há dados |

### 5. Adicionar estilo cinza para "sem dados"

Quando não há dados:
- Texto: `text-muted-foreground`
- Badge: Não exibir ou exibir "Sem dados" com estilo neutro
- Barra de progresso: Fundo cinza sem preenchimento

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/components/indicators/KRTableView.tsx` | Todas as mudanças acima |

---

## Regras de Exibição

| Condição | Meta | Real | Resultado | Eficiência |
|----------|------|------|-----------|------------|
| Dados existem | Valor formatado | Valor formatado | Diferença com cor | % com badge |
| Nenhum dado | "—" (cinza) | "—" (cinza) | "—" (cinza) | "—" ou "Sem dados" |
| Só meta existe | Valor formatado | "—" (cinza) | "—" (cinza) | 0% (calculável) |
| Só real existe | "—" (cinza) | Valor formatado | "—" (cinza) | "—" (não calculável) |

---

## Impacto Visual

**Antes:**
```
| Meta    | Real    | Resultado | Eficiência |
| 0,0%    | 0,0%    | +0,0%     | 0,0% Crítico |
```

**Depois:**
```
| Meta    | Real    | Resultado | Eficiência |
| —       | —       | —         | — Sem dados |
```

---

## Considerações Técnicas

1. **Consistência com memória do projeto**: Segue a regra de `kr-metrics-data-handling` onde "—" representa ausência de dados
2. **Cores**: Cinza (`text-muted-foreground`) para "sem dados", vermelho reservado para performance < 71%
3. **Cálculos de resumo**: Ao calcular média ponderada geral, ignorar KRs sem dados
4. **Exportação**: No XLSX, usar célula vazia ou "—" para valores nulos

