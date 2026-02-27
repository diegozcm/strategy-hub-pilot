

# Ajuste Visual: Mostrar "Vazio" para KRs sem dados

## Problema

1. **No modal do Objetivo** (`ResultadoChaveMiniCard`): KRs sem dados reais mostram "0,0%" em vermelho. Deveria mostrar "Vazio" em cinza.
2. **No modal do KR** (`KeyResultMetrics`): O valor "Realizado" mostra "0.0%" formatado mesmo quando não há dados. Deveria mostrar "Vazio".

## Causa

- `useKRMetrics` retorna `actual: null` quando não há dados, mas `percentage` é sempre `number` (0, nunca null).
- `ResultadoChaveMiniCard` verifica `rawPercentage === null` para determinar `isNullData` — como `percentage` nunca é null, `isNullData` é sempre `false`.
- `KeyResultMetrics` já trata `hasData` corretamente para o "% Atingimento", mas o campo "Realizado" ainda mostra o valor formatado mesmo quando `actual` é null.

## Correção

### Arquivo 1: `src/components/strategic-map/ResultadoChaveMiniCard.tsx`

Trocar a verificação de `isNullData` de `rawPercentage === null` para `getMetricsForPeriod('actual') === null`:

```typescript
const rawActual = getMetricsForPeriod('actual');
const isNullData = rawActual === null || rawActual === undefined;
```

### Arquivo 2: `src/components/strategic-map/KeyResultMetrics.tsx`

No bloco do "Realizado" (linha 285-287), quando `actual` é null, mostrar "Vazio" em vez do valor formatado:

```typescript
<div className="text-xl font-bold">
  {currentMetrics.actual === null || currentMetrics.actual === undefined
    ? <span className="text-muted-foreground">Vazio</span>
    : formatMetricValue(currentMetrics.actual, keyResult.unit)}
</div>
```

Dois arquivos, duas linhas cada.

