

# Correcao Completa: Taxa de Variacao e FCA

## Problemas Identificados

### 1. FCA nao e salvo no banco de dados
O problema mais critico: quando o usuario preenche o FCA no modal, o callback `onSave` (linha 629) apenas atualiza o estado local (`resolvedMonths`/`blockedMonths`) mas **nunca chama `createFCA`** do hook `useKRFCA`. Por isso a tela de FCAs mostra "0 FCA(s)".

### 2. Logica de periodo anterior esta errada
O `checkVariation` busca "o ultimo mes com dado anterior ao atual" (`k < monthKey`), mas deveria buscar o **periodo imediatamente anterior** na sequencia da frequencia. Exemplo:
- Mensal: Fev compara com Jan, Mar com Fev, Jun com Mai
- Trimestral: Q2 compara com Q1, Q3 com Q2
- Bimestral: B2 compara com B1, B4 compara com B3

Alem disso, para frequencias baseadas em periodo (Q1, B1, S1), as chaves como "2026-Q1" nao comparam corretamente com operador `<` contra chaves mensais.

### 3. Periodos isentos nao sao tratados
Jan, B1, Q1, S1 e Ano devem ser isentos da verificacao (nao ha periodo anterior), mas nao existe logica explicita para isso.

### 4. Alerta persiste apos criar FCA
O alerta deveria sumir do mes especifico apos o FCA ser criado e salvo, mas como o FCA nao e salvo de fato, o fluxo completo nao funciona.

---

## Solucao

### Arquivo: `src/components/strategic-map/KRUpdateValuesModal.tsx`

**Correcao 1 - Importar e usar `useKRFCA`**:
- Importar o hook `useKRFCA`
- Chamar `createFCA` dentro do callback `onSave` do `KRFCAModal` para salvar no banco de dados

**Correcao 2 - Reescrever `checkVariation` com logica de periodo imediatamente anterior**:
- Criar funcao auxiliar `getPreviousPeriodKey(currentKey, frequency)` que retorna a chave do periodo anterior direto:
  - Mensal: "2026-02" retorna "2026-01", "2026-06" retorna "2026-05"
  - Bimestral: "2026-B2" retorna "2026-B1"
  - Trimestral: "2026-Q2" retorna "2026-Q1"  
  - Semestral: "2026-S2" retorna "2026-S1"
- Retornar `null` para periodos isentos (Jan, B1, Q1, S1, Ano) - significando "sem verificacao"

**Correcao 3 - Usar meta do periodo anterior como denominador**:
- Formula: `variacao = |novoValor - realizadoAnterior| / |metaAnterior| * 100`
- Se nao houver meta anterior ou meta anterior = 0, pular verificacao
- Se nao houver realizado anterior (null/undefined), considerar como 0

**Correcao 4 - Suportar frequencias baseadas em periodo no banner de alerta**:
- O banner de alerta deve encontrar o nome do periodo correto para todas as frequencias (nao apenas mensal)

---

## Detalhes Tecnicos

### Nova funcao auxiliar `getPreviousPeriodKey`:
```text
getPreviousPeriodKey(currentKey, frequency):
  monthly: "YYYY-MM" -> "YYYY-(MM-1)" (null se MM=01)
  bimonthly: "YYYY-BN" -> "YYYY-B(N-1)" (null se N=1)
  quarterly: "YYYY-QN" -> "YYYY-Q(N-1)" (null se N=1)
  semesterly: "YYYY-SN" -> "YYYY-S(N-1)" (null se N=1)
  yearly: sempre null (isento)
```

### checkVariation reescrito:
```text
checkVariation(periodKey, newValue):
  1. Se threshold nao configurado -> null
  2. prevKey = getPreviousPeriodKey(periodKey, frequency)
  3. Se prevKey === null -> null (periodo isento)
  4. Buscar meta anterior (targets[prevKey])
  5. Se meta anterior = 0 ou nao existe -> null
  6. Buscar realizado anterior (merged actuals[prevKey], default 0)
  7. variacao = |newValue - realizadoAnterior| / |metaAnterior| * 100
  8. Se variacao > threshold -> retorna bloqueio
```

### Callback onSave do KRFCAModal:
```text
onSave:
  1. Chamar createFCA(fcaData) do useKRFCA -> salva no banco
  2. Adicionar mes ao resolvedMonths
  3. Remover mes do blockedMonths
  4. Fechar modal
```

### useEffect de re-check:
- Para mensal: iterar sobre `monthlyActual`
- Para frequencias de periodo: iterar sobre `periodActual`

---

## Arquivos Afetados

| Arquivo | Acao |
|---------|------|
| `src/components/strategic-map/KRUpdateValuesModal.tsx` | Reescrever checkVariation, integrar useKRFCA, corrigir banner para todas as frequencias |

