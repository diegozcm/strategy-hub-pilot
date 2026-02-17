

# Plano: Corrigir deteccao de alerta resolvido para KRs com frequencia nao-mensal

## Problema identificado

A logica de calculo de alertas na `IndicatorsPage.tsx` compara as chaves de `monthly_actual` (ex: `"2026-04"`) diretamente com o `linked_update_month` dos FCAs. Porem, para KRs com frequencia trimestral, semestral, bimestral ou anual, o FCA e salvo com a chave do periodo (ex: `"2026-Q2"`), nao com a chave do mes.

**Dados reais do bug:**
- NPS (trimestral): `monthly_actual` tem chave `"2026-04"`, mas o FCA foi salvo com `linked_update_month = "2026-Q2"`
- A comparacao `coveredMonths.includes("2026-04")` falha porque o array contem `"2026-Q2"`
- Resultado: NPS aparece como "pendente" (piscando laranja) mesmo tendo FCA criado

## Solucao

Criar um mapeamento bidirecional entre chaves de meses e chaves de periodos na hora de verificar se um mes esta coberto por um FCA. 

Para KRs com frequencia nao-mensal:
- Obter os periodos via `getPeriodsForFrequency(frequency, year)`
- Para cada mes em `monthly_actual`, encontrar qual periodo contem aquele mes (usando `monthKeys`)
- Verificar se existe um FCA com `linked_update_month` igual a chave do periodo OU a chave do mes

## Mudancas tecnicas

### Arquivo: `src/components/indicators/IndicatorsPage.tsx`

Na query de FCAs (linhas 189-203):
- Tambem carregar o campo `frequency` de cada KR junto para usar na conversao (ja temos `keyResults` com frequency disponivel, entao nao precisa mudar a query)

No `useMemo` de calculo de alertas (linhas 207-236):
1. Importar `getPeriodsForFrequency` e `isFrequencyPeriodBased` de `@/lib/krFrequencyHelpers`
2. Para cada KR, verificar se a frequencia e baseada em periodos
3. Se for baseada em periodos, construir um mapa de mes-para-periodo usando `getPeriodsForFrequency`
4. Na verificacao `coveredMonths.includes(month)`, tambem verificar se o periodo correspondente ao mes esta coberto

Logica simplificada:

```
Para cada mes com variacao excedida:
  Se frequencia e mensal:
    Verificar se coveredMonths inclui o mes (ex: "2026-04")
  Se frequencia e baseada em periodo:
    Encontrar o periodo que contem o mes (ex: "2026-04" -> "2026-Q2")
    Verificar se coveredMonths inclui o periodo OU o mes
```

### Nenhum outro arquivo precisa ser alterado

O problema e exclusivamente na logica de comparacao dentro do `useMemo`. Os componentes visuais (KRCard, KRTableView) ja recebem `isAlerted` e `isResolved` corretamente - so os IDs calculados estao errados.

## Resultado esperado

- **Ticket Medio** (mensal, sem FCA): continua piscando laranja com icone de alerta (pendente)
- **NPS** (trimestral, com FCA para Q2): para de piscar, exibe icone azul de check (resolvido)
- Funciona corretamente para todas as frequencias: mensal, bimestral, trimestral, semestral e anual

