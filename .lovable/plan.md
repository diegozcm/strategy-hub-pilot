

# Correcao: Taxa de Variacao baseada na Meta (Target), nao no Realizado (Actual)

## Problema

A variacao esta sendo calculada como:
```text
variacao = |novoValor - valorAnteriorRealizado| / |valorAnteriorRealizado| * 100
```

Quando Janeiro realizado = 0, o denominador e zero, gerando "Infinity%". Alem disso, a logica esta errada: a variacao deve ser calculada com base na **meta (target) do periodo anterior**, nao no realizado.

## Correcao

Mudar a formula para:
```text
variacao = |novoValor - valorAnteriorRealizado| / |metaAnterior| * 100
```

Exemplo com Jan meta=100, Jan real=0, Fev real=10:
- Atual (bugado): |10 - 0| / |0| = Infinity
- Correto: |10 - 0| / |100| = 10%

Isso elimina o bug de Infinity e reflete a intencao do usuario.

## Periodos Isentos

Os primeiros periodos de cada ciclo NAO devem ter verificacao de variacao (nao ha periodo anterior para comparar):
- Mensal: Janeiro
- Bimestral: B1 (Jan-Fev)
- Trimestral: Q1 (Jan-Mar)
- Semestral: S1 (Jan-Jun)
- Anual: Ano inteiro

A logica atual ja cobre isso parcialmente ("first value is always free"), mas precisa ser mantida.

## Detalhes Tecnicos

### Arquivo: `src/components/strategic-map/KRUpdateValuesModal.tsx`

Alteracao na funcao `checkVariation`:

1. Alem de buscar o `lastValue` (realizado anterior), buscar tambem o `lastTarget` (meta do periodo anterior) de `keyResult.monthly_targets`
2. Usar `lastTarget` como denominador: `variation = |newValue - lastValue| / |lastTarget| * 100`
3. Remover tratamento especial de `lastValue === 0` (nao e mais necessario pois o denominador agora e a meta)
4. Se `lastTarget === 0`, nao bloquear (sem base para calcular)

```text
checkVariation(monthKey, newValue, currentActuals):
  1. Se threshold nao esta configurado -> retorna null
  2. Combinar dados do banco + formulario atual para actuals
  3. Encontrar o mes anterior mais recente com dado
  4. Se nao ha mes anterior -> retorna null (primeiro periodo)
  5. Buscar target do mes anterior em monthly_targets
  6. Se target anterior = 0 -> retorna null (sem base)
  7. Calcular: variacao = |newValue - lastActual| / |lastTarget| * 100
  8. Se variacao > threshold -> retorna dados do bloqueio
```

### Exibicao do percentual no banner

Atualizar a exibicao para mostrar o valor correto (ex: "10%" em vez de "Infinity%"). Nenhuma mudanca extra necessaria pois o calculo ja retorna o valor correto.

## Arquivo Afetado

| Arquivo | Acao |
|---------|------|
| `src/components/strategic-map/KRUpdateValuesModal.tsx` | Editar - corrigir formula do `checkVariation` |

