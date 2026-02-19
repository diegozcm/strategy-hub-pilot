

## Substituir "Landing Page" por "Novidades" no Painel Admin

Remover toda a seção de edição da Landing Page do painel administrativo e substituir pelo gerenciamento de Release Notes (Novidades), conforme planejado anteriormente.

---

### O que será removido

1. **Sidebar**: A seção "Landing Page" com os itens "Editar Conteúdo", "Preview" e "Publicar Alterações"
2. **Rotas do admin**: `landing/edit`, `landing/preview`, `landing/publish`
3. **Páginas**: `EditLandingPage.tsx`, `PreviewLandingPage.tsx`, `PublishLandingPage.tsx` (pasta `admin-v2/pages/landing/`)
4. **Componentes do editor antigo**: `LandingPageEditorPage.tsx` e pasta `admin-landing-page/` com seus sub-componentes (EditableField, ImageUploader, PublishButton, etc.)
5. **Hooks de CMS**: `useLandingPageContentDraft.tsx`, `useTabEditor.tsx`
6. **Rotas legadas**: `/app/admin/landing-page` e `/app/admin/landing-preview`
7. **Página LandingPagePreview**: `src/pages/LandingPagePreview.tsx`

**Nota**: O hook `useLandingPageContent.tsx` e a página `LandingPage.tsx` (rota `/`) serao mantidos por enquanto, pois a landing page publica ainda os utiliza. Quando voce decidir tornar a landing page fixa, eles tambem podem ser removidos.

---

### O que será adicionado

A seção "Novidades" no lugar da "Landing Page", com CRUD completo de Release Notes:

**Sidebar** (icone `Sparkles`, label "Novidades"):
- Todas as Novidades (`/app/admin/releases`)
- Nova Publicação (`/app/admin/releases/new`)

**Novas páginas**:
- `AllReleasesPage.tsx` -- Tabela com todas as releases (versao, titulo, data, tags, status, acoes)
- `NewReleasePage.tsx` -- Formulario de criacao
- `EditReleasePage.tsx` -- Formulario de edicao (rota `/app/admin/releases/:id/edit`)

**Novos componentes**:
- `ReleaseNoteForm.tsx` -- Formulario compartilhado com editor Markdown e preview lado a lado
- `ReleaseNoteTable.tsx` -- Tabela de listagem com badges de status e tags
- `MarkdownPreview.tsx` -- Renderizacao do Markdown com ReactMarkdown

**Novo hook**:
- `useAdminReleaseNotes.ts` -- CRUD completo usando TanStack Query (listar, buscar por ID, criar, atualizar, excluir)

---

### Detalhes Tecnicos

**Arquivos modificados**:

| Arquivo | Alteracao |
|---------|-----------|
| `sidebarContent.ts` | Trocar `landing` por `releases` no `navItems` e no `contentMap` |
| `App.tsx` | Remover rotas `landing/*` e adicionar rotas `releases`, `releases/new`, `releases/:id/edit` |
| `pages/index.ts` | Remover exports de Landing, adicionar exports de Releases |

**Arquivos removidos**:

| Arquivo |
|---------|
| `src/components/admin-v2/pages/landing/EditLandingPage.tsx` |
| `src/components/admin-v2/pages/landing/PreviewLandingPage.tsx` |
| `src/components/admin-v2/pages/landing/PublishLandingPage.tsx` |
| `src/components/admin/LandingPageEditorPage.tsx` |
| `src/components/admin/landing-page/*.tsx` (7 arquivos) |
| `src/hooks/useLandingPageContentDraft.tsx` |
| `src/hooks/useTabEditor.tsx` |
| `src/pages/LandingPagePreview.tsx` |

**Arquivos criados**:

| Arquivo |
|---------|
| `src/components/admin-v2/pages/releases/AllReleasesPage.tsx` |
| `src/components/admin-v2/pages/releases/NewReleasePage.tsx` |
| `src/components/admin-v2/pages/releases/EditReleasePage.tsx` |
| `src/components/admin-v2/components/releases/ReleaseNoteForm.tsx` |
| `src/components/admin-v2/components/releases/ReleaseNoteTable.tsx` |
| `src/components/admin-v2/components/releases/MarkdownPreview.tsx` |
| `src/hooks/useAdminReleaseNotes.ts` |

**Nenhuma migracao de banco necessaria** -- a tabela `release_notes` ja existe com todos os campos.

