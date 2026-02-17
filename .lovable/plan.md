
# Plano: Adicionar filtro de Responsavel no painel de filtros de KRs

## O que sera feito

Adicionar uma nova secao "Responsavel" no Sheet de filtros (KRFiltersSheet), permitindo filtrar KRs pelo dono atribuido (assigned_owner_id). Cada opcao mostrara a foto de perfil (avatar) do usuario.

## Design visual

A nova secao aparecera entre "Objetivo" e "Status de Desempenho" no Sheet lateral:

```text
+----------------------------------+
| Filtros                          |
+----------------------------------+
| PILAR ESTRATEGICO                |
| (o) Todos os pilares             |
| (o) Financeiro                   |
+----------------------------------+
| OBJETIVO                         |
| (o) Todos os objetivos           |
| (o) Aumentar receita             |
+----------------------------------+
| RESPONSAVEL              << NOVO |
| (o) Todos os responsaveis        |
| (o) [avatar] Joao Silva          |
| (o) [avatar] Maria Santos        |
+----------------------------------+
| STATUS DE DESEMPENHO             |
| (o) Todos os status              |
| (o) Excelente  >105%             |
+----------------------------------+
```

Cada item mostrara o Avatar do usuario com fallback de iniciais, seguindo o mesmo padrao visual ja usado no projeto (componente Avatar do shadcn).

## Mudancas tecnicas

### 1. `KRFiltersSheet.tsx`

- Adicionar novas props: `ownerFilter`, `setOwnerFilter`, e `companyUsers` (array de usuarios)
- Importar `Avatar`, `AvatarImage`, `AvatarFallback` de `@/components/ui/avatar`
- Importar icone `User` do lucide-react
- Renderizar nova secao "Responsavel" com RadioGroup entre Objetivo e Status
- Cada usuario mostra avatar (foto ou iniciais) + nome completo
- Opcao "Todos os responsaveis" como default
- Incluir `ownerFilter` no `handleClearFilters`

### 2. `IndicatorsPage.tsx`

- Adicionar estado `ownerFilter` (useState, default `'all'`)
- Passar `ownerFilter`, `setOwnerFilter` e `companyUsers` para `KRFiltersSheet`
- No filtro de `contextFilteredKeyResults`, adicionar verificacao: `ownerFilter === 'all' || kr.assigned_owner_id === ownerFilter`
- Incrementar `activeFilterCount` quando `ownerFilter !== 'all'`

### Resumo dos arquivos

| Arquivo | Mudanca |
|---|---|
| `src/components/indicators/KRFiltersSheet.tsx` | Nova secao "Responsavel" com avatares |
| `src/components/indicators/IndicatorsPage.tsx` | Novo estado ownerFilter + logica de filtragem + passar props |
