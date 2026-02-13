

# Fix: KR criado na Dashboard exibe dados incorretos no modal de edição

## Problema identificado

Existem **dois problemas distintos** causando a exibição incorreta do KR criado na Dashboard:

### 1. Dados incompletos ao abrir KR Overview/Edit Modal

Quando um KR é aberto a partir da Dashboard, o `DashboardHome.tsx` busca os KRs com uma query **limitada** que nao inclui campos importantes como `weight`, `start_month`, `end_month`, `assigned_owner_id`, `comparison_type`, entre outros.

O `KROverviewModal` inicializa `currentKeyResult` a partir dessa prop incompleta. Quando o usuario clica em "Editar", o `KREditModal` recebe esse objeto incompleto e os campos aparecem vazios.

A funcao `refreshKeyResult()` existe no `KROverviewModal` e busca `SELECT *` (todos os campos), mas so eh chamada **apos salvar**, nunca no momento em que o modal abre.

### 2. Valores de unidade inconsistentes entre formularios

O formulario de criacao (`InlineKeyResultForm.tsx` e `StandaloneKeyResultForm.tsx`) usa estes valores de unidade:
- `%`, `R$`, **`number`**, `dias`, **`score`**

O formulario de edicao (`KREditModal.tsx`) usa valores **diferentes**:
- `%`, `R$`, **`un`**, `h`, `dias`

Quando um KR eh criado com `unit: "number"`, o Select do formulario de edicao nao encontra esse valor nas suas opcoes e exibe vazio.

## Solucao

### Arquivo 1: `src/components/strategic-map/KROverviewModal.tsx`

Chamar `refreshKeyResult()` automaticamente quando o modal abrir, garantindo que todos os campos estejam disponíveis independentemente de qual pagina o KR foi aberto.

Adicionar um `useEffect` que chama `refreshKeyResult` quando `open` muda para `true`:

```typescript
useEffect(() => {
  if (open && keyResult?.id) {
    refreshKeyResult();
  }
}, [open, keyResult?.id]);
```

### Arquivo 2: `src/components/strategic-map/KREditModal.tsx`

Padronizar as opcoes de unidade para serem consistentes com os formularios de criacao:

De:
```
% | R$ | un | h | dias
```

Para:
```
% | R$ | number | dias | score
```

### Arquivo 3: `src/components/objectives/InlineKeyResultForm.tsx`

Nenhuma mudanca necessaria (ja usa os valores corretos).

### Arquivo 4: `src/components/indicators/StandaloneKeyResultForm.tsx`

Nenhuma mudanca necessaria (ja usa os valores corretos).

## Resultado esperado

- Ao abrir um KR de qualquer pagina (Dashboard, Mapa, Indicadores), o modal de edicao sempre exibira todos os campos corretamente preenchidos.
- As unidades serao consistentes entre criacao e edicao, sem campos aparecendo vazios.

