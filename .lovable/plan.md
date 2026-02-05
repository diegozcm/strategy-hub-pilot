
# Plano: Remover Campo "Plano Estratégico" do Modal de Criação de Objetivo

## Resumo da Mudança

Atualmente, ao criar um objetivo estratégico na página de Objetivos, o usuário precisa selecionar manualmente o "Plano Estratégico" mesmo quando já existe um plano ativo. Isso é redundante, pois o sistema já sabe qual é o plano ativo.

A mudança removerá este campo de seleção e usará automaticamente o plano ativo.

---

## O Que Será Alterado

**Arquivo:** `src/components/objectives/ObjectivesPage.tsx`

### Alterações:

1. **Adicionar auto-preenchimento do plano ativo**
   - Criar um `useEffect` que automaticamente define `objectiveForm.plan_id` com o ID do plano ativo quando ele estiver disponível

2. **Remover o campo de seleção "Plano Estratégico"**
   - Excluir o bloco de código do Select (linhas 501-515)
   - Ajustar o grid de `grid-cols-2` para que o campo "Pilar Estratégico" ocupe toda a largura

3. **Ajustar a validação**
   - Manter a validação de `plan_id` para segurança, mas garantir que seja preenchido automaticamente

4. **Ajustar o reset do formulário**
   - Após criar um objetivo, o `plan_id` será resetado para vazio, mas o `useEffect` irá re-popular com o plano ativo

---

## Antes e Depois

### Antes:
```
┌─────────────────┐ ┌─────────────────┐
│ Plano Estratég. │ │ Pilar Estratég. │
└─────────────────┘ └─────────────────┘
```

### Depois:
```
┌───────────────────────────────────────┐
│         Pilar Estratégico             │
└───────────────────────────────────────┘
```

---

## Detalhes Técnicos

```typescript
// 1. Adicionar useEffect para auto-popular plan_id
useEffect(() => {
  if (activePlan && !objectiveForm.plan_id) {
    setObjectiveForm(prev => ({ ...prev, plan_id: activePlan.id }));
  }
}, [activePlan]);

// 2. Remover o grid-cols-2 e o Select de Plano Estratégico
// Antes:
<div className="grid grid-cols-2 gap-4">
  <div>
    <Label>Plano Estratégico</Label>
    <Select>...</Select>
  </div>
  <div>
    <Label>Pilar Estratégico</Label>
    <Select>...</Select>
  </div>
</div>

// Depois:
<div>
  <Label>Pilar Estratégico</Label>
  <Select>...</Select>
</div>
```

---

## Impacto

- **UX melhorada**: Menos cliques e decisões para o usuário
- **Fluxo simplificado**: O objetivo é automaticamente vinculado ao plano ativo
- **Sem quebras**: A lógica de validação e salvamento permanece intacta

