

# Trocar Admin V2 para Oficial e Mover Admin Antigo para V1

## Resumo
A pagina admin-v2 (nova) passa a ser a oficial em `/app/admin`, e a pagina antiga fica acessivel em `/app/admin-v1` como backup.

---

## Etapas

### 1. Atualizar rotas no App.tsx
- A rota `/app/admin` passa a usar `AdminV2Page` com todas as sub-rotas da V2
- A rota `/app/admin-v1` passa a usar `StartTogetherAdminLayout` com as sub-rotas antigas
- Adicionar redirect de `/app/admin-v2/*` para `/app/admin/*` para nao quebrar links antigos
- Atualizar redirect de `/admin` para continuar apontando para `/app/admin`

### 2. Atualizar todas as referencias hardcoded de `/app/admin-v2` para `/app/admin`
Cerca de 20 arquivos dentro de `src/components/admin-v2/` contem caminhos como `/app/admin-v2/companies`, `/app/admin-v2/modules`, etc. Todos serao atualizados para `/app/admin/...`.

Arquivos afetados (principais):
- `src/components/admin-v2/config/sidebarContent.ts` (sidebar com todas as hrefs)
- `src/components/admin-v2/pages/companies/NewCompanyPage.tsx`
- `src/components/admin-v2/pages/modules/AvailableModulesPage.tsx`
- `src/components/admin-v2/pages/modules/RolesPermissionsPage.tsx`
- `src/components/admin-v2/pages/modules/AdminRolePage.tsx`
- `src/components/admin-v2/pages/modules/StartupHubModulePage.tsx`
- `src/components/admin-v2/pages/modules/StrategicPlanningModulePage.tsx`
- `src/components/admin-v2/pages/modules/AICopilotModulePage.tsx`
- `src/components/admin-v2/pages/monitoring/AlertsPage.tsx`
- `src/components/admin-v2/pages/monitoring/CriticalErrorsPage.tsx`
- `src/components/admin-v2/pages/monitoring/WarningsPage.tsx`
- `src/components/admin-v2/pages/monitoring/InfoLogsPage.tsx`
- `src/components/admin-v2/pages/emails/NewTemplatePage.tsx`
- `src/components/admin-v2/pages/landing/PublishLandingPage.tsx`
- `src/components/admin-v2/pages/users/CreateUserPage.tsx`
- Qualquer outro arquivo com `/app/admin-v2`

### 3. Atualizar o sidebar do admin antigo (V1)
No `StartTogetherAdminLayout.tsx`, atualizar os paths do menu de `/app/admin` para `/app/admin-v1` para que a navegacao interna do admin antigo funcione corretamente no novo path.

---

## Detalhes Tecnicos

- Substituicao global: `/app/admin-v2` -> `/app/admin` em todos os componentes da V2
- Substituicao nos menus da V1: `/app/admin` -> `/app/admin-v1` no `StartTogetherAdminLayout.tsx`
- Redirect de compatibilidade: `<Route path="/app/admin-v2/*" element={<Navigate to="/app/admin" replace />} />`
- Nenhuma mudanca de componente ou logica de negocio, apenas rotas e paths

