

# Correcao da Validacao de Taxa de Variacao no KR

## Problema Identificado

A validacao de taxa de variacao nao esta funcionando por 3 bugs no codigo atual:

1. **Divisao por zero ignorada**: Quando o ultimo valor cadastrado e `0` (como no caso de Janeiro = 0 unidades), o codigo simplesmente pula a verificacao (`if (lastValue === 0) return null`). Isso significa que qualquer valor colocado em Fevereiro nunca dispara o bloqueio.

2. **Valores editados na mesma sessao nao sao considerados**: A funcao `checkVariation` busca o valor anterior apenas nos dados salvos no banco (`keyResult.monthly_actual`). Se o usuario editar Janeiro e Fevereiro na mesma sessao sem salvar, Janeiro nao e considerado como referencia.

3. **Falta de guarda no submit**: O `handleFormSubmit` nao verifica `hasBlockedMonths` antes de salvar, confiando apenas no botao desabilitado (que pode ser contornado).

---

## Solucao

### Arquivo: `src/components/strategic-map/KRUpdateValuesModal.tsx`

**Correcao 1 - Tratar lastValue = 0**:
- Quando o ultimo valor e `0` e o novo valor e diferente de `0`, considerar como variacao infinita (sempre bloqueia se threshold esta ativo)
- Logica: se `lastValue === 0` e `newValue !== 0`, retornar variacao como 100% (ou "infinita"), disparando o bloqueio

**Correcao 2 - Considerar valores do formulario atual**:
- A funcao `checkVariation` deve buscar o valor anterior primeiro no estado `monthlyActual` (formulario atual) e depois no `keyResult.monthly_actual` (banco de dados)
- Isso garante que se o usuario editar Jan=10 e depois Feb=20, o sistema use Jan=10 como referencia

**Correcao 3 - Guarda no handleFormSubmit**:
- Adicionar `if (hasBlockedMonths) return;` no inicio do `handleFormSubmit`

---

## Detalhes Tecnicos

Alteracao na funcao `checkVariation` (linhas 73-99):

```text
checkVariation(monthKey, newValue, currentActuals):
  1. Se threshold nao esta configurado -> retorna null
  2. Combinar dados do banco + dados do formulario atual
  3. Encontrar o mes anterior mais recente com dado
  4. Se nao ha mes anterior -> retorna null (primeiro valor e livre)
  5. Se lastValue === 0 e newValue !== 0 -> retorna variacao como "infinita" (bloqueia)
  6. Se lastValue === 0 e newValue === 0 -> retorna null (sem mudanca)
  7. Calcular variacao normalmente
  8. Se variacao > threshold -> retorna dados do bloqueio
```

Alteracao no `handleFormSubmit` (linha 218):
- Adicionar verificacao: `if (hasBlockedMonths) return;`

---

## Arquivo Afetado

| Arquivo | Acao |
|---------|------|
| `src/components/strategic-map/KRUpdateValuesModal.tsx` | Editar - corrigir `checkVariation` e `handleFormSubmit` |

