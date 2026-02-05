
# Plano: Criação de KR Inline no Modal de Objetivo

## Resumo da Mudança

Atualmente, ao clicar em "Criar Primeiro Resultado-Chave" no modal de detalhes do objetivo, o usuário é redirecionado para a página de Resultados-chave (`/app/indicators`), perdendo o contexto do objetivo selecionado. Esta mudança implementará um formulário inline dentro do próprio modal, mantendo o fluxo de navegação em "pilha" (Objetivo -> Criar KR -> Voltar para Objetivo).

---

## O Que Será Implementado

### 1. Novo Componente: `InlineKeyResultForm`

Criar um novo componente reutilizável que contém o formulário de criação de KR, extraído e simplificado a partir do `AddResultadoChaveModal.tsx`.

**Localização:** `src/components/objectives/InlineKeyResultForm.tsx`

**Características:**
- Recebe `objectiveId` via props (já vinculado, não editável)
- Exibe nome do objetivo como badge de contexto
- Botão "Voltar" para retornar à visualização do objetivo
- Formulário completo com campos essenciais
- Callback `onSave` para salvar o KR
- Callback `onCancel` para voltar à tela anterior

---

### 2. Alterações no `ObjectiveDetailModal.tsx`

**Estado de navegação em pilha:**
```typescript
type ModalView = 'details' | 'create-kr';
const [currentView, setCurrentView] = useState<ModalView>('details');
```

**Nova prop para criação de KR:**
```typescript
onCreateKeyResult?: (krData: Omit<KeyResult, 'id' | 'owner_id' | 'created_at' | 'updated_at'>) => Promise<any>;
```

**Lógica de renderização:**
- Se `currentView === 'details'`: exibe o conteúdo atual (detalhes do objetivo)
- Se `currentView === 'create-kr'`: exibe o `InlineKeyResultForm`

**Fluxo do botão "Criar Resultado-Chave":**
- Antes: `navigate('/app/indicators')`
- Depois: `setCurrentView('create-kr')`

**Após salvar KR com sucesso:**
- Retorna automaticamente para `currentView = 'details'`
- O KR aparece na lista atualizada

---

### 3. Alterações nos Componentes Consumidores

Atualizar os componentes que usam `ObjectiveDetailModal` para passar a nova prop `onCreateKeyResult`:

**Arquivos afetados:**
- `src/components/objectives/ObjectivesPage.tsx`
- `src/components/strategic-map/ObjectiveCard.tsx`
- `src/components/dashboard/RumoObjectiveBlock.tsx`

Cada um já tem acesso à função `createKeyResult` ou pode usar o hook `useStrategicMap`.

---

## Arquitetura da Solução

```
┌─────────────────────────────────────────────────────────┐
│                  ObjectiveDetailModal                    │
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │                currentView                       │    │
│  │                                                  │    │
│  │  'details'              'create-kr'             │    │
│  │      │                      │                   │    │
│  │      ▼                      ▼                   │    │
│  │ ┌───────────┐         ┌──────────────────┐     │    │
│  │ │ Detalhes  │ ──────> │ InlineKeyResult  │     │    │
│  │ │ Objetivo  │ <────── │     Form         │     │    │
│  │ └───────────┘         └──────────────────┘     │    │
│  │  (botão criar)         (botão voltar/salvar)   │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

---

## Campos do Formulário Inline

O formulário inline terá os seguintes campos essenciais:

1. **Nome do KR** (obrigatório)
2. **Dono do KR** (select com usuários da empresa)
3. **Vigência** (select com quarters/anos)
4. **Descrição** (textarea)
5. **Meta Anual** (número, obrigatório)
6. **Unidade** (%, R$, Número, etc.)
7. **Frequência** (mensal, trimestral, etc.)
8. **Peso** (1-10)

> Nota: O objetivo será exibido como um campo desabilitado/badge para contexto

---

## Reset de Estado ao Fechar Modal

Quando o modal for fechado:
- Resetar `currentView` para `'details'`
- Limpar formulário do KR inline

---

## Arquivos a Serem Criados/Modificados

| Arquivo | Ação |
|---------|------|
| `src/components/objectives/InlineKeyResultForm.tsx` | **Criar** |
| `src/components/objectives/ObjectiveDetailModal.tsx` | Modificar |
| `src/components/objectives/ObjectivesPage.tsx` | Modificar |
| `src/components/strategic-map/ObjectiveCard.tsx` | Modificar |
| `src/components/dashboard/RumoObjectiveBlock.tsx` | Modificar |

---

## Detalhes Técnicos

### Interface do InlineKeyResultForm

```typescript
interface InlineKeyResultFormProps {
  objectiveId: string;
  objectiveTitle: string;
  onSave: (krData: Omit<KeyResult, 'id' | 'owner_id' | 'created_at' | 'updated_at'>) => Promise<any>;
  onCancel: () => void;
}
```

### Estado do Modal Atualizado

```typescript
// ObjectiveDetailModal.tsx
const [currentView, setCurrentView] = useState<'details' | 'create-kr'>('details');

// Reset ao fechar
const handleClose = () => {
  setIsEditing(false);
  setCurrentView('details'); // Reset para view inicial
  onClose();
};
```

### Renderização Condicional

```tsx
<DialogContent>
  {currentView === 'details' ? (
    // Conteúdo atual do modal (detalhes e edição)
    <>
      <DialogHeader>...</DialogHeader>
      <div className="space-y-6">...</div>
    </>
  ) : (
    // Formulário inline de criação de KR
    <InlineKeyResultForm
      objectiveId={objective.id}
      objectiveTitle={objective.title}
      onSave={async (krData) => {
        await onCreateKeyResult(krData);
        setCurrentView('details');
      }}
      onCancel={() => setCurrentView('details')}
    />
  )}
</DialogContent>
```

---

## Experiência do Usuário

1. Usuário abre o modal de detalhes do objetivo
2. Vê a lista de KRs (ou mensagem "Nenhum resultado-chave definido")
3. Clica em "Criar Resultado-Chave"
4. O conteúdo do modal transiciona para o formulário de criação
5. Usuário preenche os dados do KR
6. Clica em "Salvar" ou "Cancelar"
7. Modal retorna à visualização de detalhes com o novo KR na lista (se salvou)
