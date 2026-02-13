
# Corrigir Calculo da Taxa de Variacao

## Problema

A formula atual calcula a variacao usando a **meta do periodo anterior** como denominador:

`variacao = |novoValor - realizadoAnterior| / |metaAnterior| * 100`

Exemplo: |150 - 100| / 95 * 100 = 52.6% (errado)

## Correcao

Usar o **realizado do periodo anterior** como denominador:

`variacao = |novoValor - realizadoAnterior| / |realizadoAnterior| * 100`

Exemplo: |150 - 100| / 100 * 100 = 50.0% (correto)

## Arquivo Afetado

`src/components/strategic-map/KRUpdateValuesModal.tsx` - linhas 132-168

### Mudancas:
1. Linha 155-157: Remover busca do `lastTarget` como denominador
2. Linha 160: `lastValue` passa a ser o denominador -- se for 0, retornar null (nao ha como calcular variacao sem valor anterior)
3. Linha 162: Trocar `Math.abs(lastTarget)` por `Math.abs(lastValue)`
4. Atualizar comentario da linha 132

Resultado: "Criar FCA - Fevereiro (50.0%)" em vez de "(52.6%)"
