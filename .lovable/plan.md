

# Plano: Corrigir KRs em todas as paginas

## Problemas identificados

### 1. Botao de exclusao escondido/nao-funcional em 3 locais

| Pagina | Arquivo | `showDeleteButton` | `onDelete` |
|---|---|---|---|
| Dashboard (principal) | `DashboardHome.tsx` | `true` | Funcional (Supabase delete) |
| Mapa Estrategico (2 modais) | `ObjectiveCard.tsx` | `false` | Toast placeholder |
| Objetivos | `ObjectivesPage.tsx` | `false` | Toast placeholder |
| Dashboard Rumo | `RumoObjectiveBlock.tsx` | `false` | Toast placeholder |

### 2. `AddResultadoChaveModal` nao define `target_direction`

O formulario usado no Mapa Estrategico (`AddResultadoChaveModal.tsx`) nao inclui o campo `target_direction`. O KR e salvo com esse campo como `null` no banco. Os outros formularios (`InlineKeyResultForm` e `StandaloneKeyResultForm`) definem corretamente como `'maximize'`.

### 3. `InlineKeyResultForm` usa componentes `DialogHeader`/`DialogTitle` aninhados

O formulario na pagina de Objetivos renderiza `DialogHeader`, `DialogTitle` e `DialogDescription` do Radix. Como ele ja esta dentro de um `DialogContent` (do `ObjectiveDetailModal`), isso causa conflito DOM (`Failed to execute 'removeChild' on 'Node'`).

---

## Mudancas propostas

### Arquivo 1: `src/components/strategic-map/ObjectiveCard.tsx`

**Duas mudancas identicas** (linhas ~442-452 e ~608-618):
- Mudar `showDeleteButton={false}` para `showDeleteButton={true}`
- Substituir o toast placeholder do `onDelete` por exclusao real via Supabase:

```typescript
onDelete={async () => {
  if (!selectedKeyResultForOverview) return;
  try {
    const { error } = await supabase
      .from('key_results')
      .delete()
      .eq('id', selectedKeyResultForOverview.id);
    if (error) throw error;
    toast({ title: "Sucesso", description: "Resultado-chave excluído!" });
    setIsKROverviewModalOpen(false);
    setSelectedKeyResultForOverview(null);
    if (onRefreshData) await onRefreshData();
  } catch (error) {
    toast({ title: "Erro", description: "Erro ao excluir.", variant: "destructive" });
  }
}}
```

### Arquivo 2: `src/components/objectives/ObjectivesPage.tsx`

**Uma mudanca** (linhas ~874-884):
- Mudar `showDeleteButton={false}` para `showDeleteButton={true}`
- Substituir toast placeholder por exclusao real + `await refreshData()`

### Arquivo 3: `src/components/dashboard/RumoObjectiveBlock.tsx`

**Uma mudanca** (linhas ~293-303):
- Mudar `showDeleteButton={false}` para `showDeleteButton={true}`
- Substituir toast placeholder por exclusao real + `window.location.reload()`

### Arquivo 4: `src/components/strategic-map/AddResultadoChaveModal.tsx`

**Duas mudancas:**
1. Adicionar `target_direction: 'maximize'` ao estado inicial `formData` (linha ~88)
2. Incluir `target_direction: formData.target_direction` no objeto `resultadoChaveData` enviado ao `onSave` (linha ~175)
3. Adicionar um campo Select de "Direcionamento" na aba "Dados Gerais" com opcoes "Maior e melhor" (`maximize`) e "Menor e melhor" (`minimize`)

### Arquivo 5: `src/components/objectives/InlineKeyResultForm.tsx`

**Uma mudanca** (linhas ~9, 129, 140-141):
- Remover import de `DialogHeader`, `DialogTitle`, `DialogDescription`
- Substituir `<DialogHeader>` por `<div className="flex flex-col space-y-1.5">`
- Substituir `<DialogTitle>` por `<h2 className="text-lg font-semibold leading-none tracking-tight">`
- Substituir `<DialogDescription>` por `<p className="text-sm text-muted-foreground">`

Isso evita o crash DOM causado por componentes Radix Dialog aninhados.

---

## Resultado esperado

- Botao "Apagar" visivel e funcional em TODAS as paginas
- KRs criados no Mapa Estrategico terao `target_direction` definido (default: `maximize`)
- Formulario inline na pagina de Objetivos nao causara crash DOM
- Experiencia consistente em todas as paginas

