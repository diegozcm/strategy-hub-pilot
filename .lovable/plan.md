
# Plano: Aplicação da Identidade Visual Cofound no Admin-V2

## Visão Geral

Aplicar a identidade visual da **Cofound** em todas as páginas e componentes da área `admin-v2`, incluindo:

**Tipografia**: Lexend (Google Fonts)

**Paleta de Cores**:
| Nome | Hex | Uso Principal |
|------|-----|---------------|
| Azul Claro | `#38B6FF` | Accent, links, hover states |
| Verde | `#CDD966` | Success states, botões primários, badges de status ativo |
| Azul Escuro | `#0D2338` | Textos principais, backgrounds de sidebar, primary |
| Branco | `#F7F7F7` | Backgrounds claros, cards |

---

## Arquitetura da Implementação

### Estratégia Principal

A implementação será feita em 3 camadas:

1. **Camada Global** - Variáveis CSS e configuração Tailwind
2. **Camada de Layout** - Sidebar, Header, e contêineres
3. **Camada de Componentes** - Componentes reutilizáveis do admin-v2

Esta estratégia garante que a maioria das mudanças seja centralizada, minimizando edições em arquivos individuais de página.

---

## Mapeamento Completo de Arquivos

### 1. Configuração Global (2 arquivos)

| Arquivo | Alterações |
|---------|-----------|
| `index.html` | Adicionar link para Google Fonts (Lexend) |
| `src/index.css` | Criar variáveis CSS específicas para admin-v2 com cores Cofound; Definir font-family Lexend |

### 2. Tailwind Config (1 arquivo)

| Arquivo | Alterações |
|---------|-----------|
| `tailwind.config.ts` | Estender cores `cofound` com valores HSL corretos; Adicionar fontFamily `lexend` |

### 3. Layout Principal (6 arquivos)

| Arquivo | Alterações |
|---------|-----------|
| `AdminV2Page.tsx` | Aplicar wrapper com classe `font-lexend` e variáveis admin-v2 |
| `AdminV2Sidebar.tsx` | Mínimo - herda do wrapper |
| `IconNavigation.tsx` | Mudar `bg-[#F7F7F7]` para variável; Atualizar cores de botões ativos |
| `DetailSidebar.tsx` | Mudar `bg-[#F7F7F7]` para variável; Atualizar cor do título |
| `AdminV2Header.tsx` | Atualizar cores do header mobile |
| `AdminV2MobileSidebar.tsx` | Herda estilos do wrapper |

### 4. Componentes Reutilizáveis (10 arquivos)

| Arquivo | Alterações |
|---------|-----------|
| `AdminPageContainer.tsx` | Atualizar cor do título e descrição |
| `BrandBadge.tsx` | Atualizar cores do logo/badge para Azul Escuro + Azul Claro |
| `MenuItem.tsx` | Atualizar estados active/hover com cores Cofound |
| `MenuSection.tsx` | Atualizar cor do título da seção |
| `SearchInput.tsx` | Atualizar cor de hover dos resultados de busca |
| `StatCard.tsx` | Atualizar variantes de cor para usar paleta Cofound |
| `StatusBadge.tsx` | Atualizar cores de status (active=Verde, etc.) |
| `PresenceIndicator.tsx` | Atualizar verde para `#CDD966` |
| `UserAvatar.tsx` | Atualizar fallback colors |
| `PeriodFilter.tsx` | Atualizar estados de seleção |

### 5. Páginas de Dashboard (11 arquivos)

| Arquivo | Alterações |
|---------|-----------|
| `DashboardOverviewPage.tsx` | Charts: cores de linhas/barras; Cards de usuários online |
| `ActiveUsersStatsPage.tsx` | StatCards já usam componentes centralizados |
| `RecentActivity24hPage.tsx` | Placeholder - mínimas alterações |
| `RecentActivityMonthPage.tsx` | Placeholder - mínimas alterações |
| `RecentActivityPage.tsx` | Placeholder - mínimas alterações |
| `RecentActivityWeekPage.tsx` | Placeholder - mínimas alterações |
| `RecentLoginsPage.tsx` | Placeholder - mínimas alterações |
| `RegisteredCompaniesPage.tsx` | Placeholder - mínimas alterações |
| `SystemStatsPage.tsx` | Placeholder - mínimas alterações |
| `SystemStatusPage.tsx` | Placeholder - mínimas alterações |
| `UsersByCompanyPage.tsx` | Placeholder - mínimas alterações |

### 6. Páginas de Empresas (9 arquivos + 5 modais)

| Arquivo | Alterações |
|---------|-----------|
| `ActiveCompaniesPage.tsx` | Tabelas e badges usam componentes centralizados |
| `ActiveStartupsPage.tsx` | Idem |
| `AllCompaniesPage.tsx` | Idem |
| `ArchivedCompaniesPage.tsx` | Idem |
| `FilterCompaniesPage.tsx` | Idem |
| `InactiveCompaniesPage.tsx` | Idem |
| `LinkedMentorsPage.tsx` | Idem |
| `NewCompanyPage.tsx` | Formulário - inputs herdam estilos globais |
| `StartupsPage.tsx` | Idem |

**Modais de Empresas:**
| Arquivo | Alterações |
|---------|-----------|
| `CompanyDetailsModal.tsx` | Tabs, badges - usam componentes Shadcn (herdam) |
| `CompanyStatusModal.tsx` | Cores de ação (verde/laranja) |
| `EditCompanyModal.tsx` | Formulário - herda estilos |
| `ManageCompanyUsersModal.tsx` | Lista de usuários |
| `shared/CompanyHeader.tsx` | Badges de status |

### 7. Páginas de Usuários (11 arquivos + 6 modais)

| Arquivo | Alterações |
|---------|-----------|
| `ActiveUsersPage.tsx` | Componentes centralizados |
| `AllUsersPage.tsx` | Idem |
| `CreateUserPage.tsx` | Formulário |
| `DeactivateUserModal.tsx` | Cores de ação |
| `FilterUsersPage.tsx` | Componentes centralizados |
| `FirstLoginPage.tsx` | Placeholder |
| `InactiveUsersPage.tsx` | Componentes centralizados |
| `PendingApprovalPage.tsx` | Componentes centralizados |
| `ReactivateUserModal.tsx` | Cores de ação |
| `SystemAdminsPage.tsx` | Componentes centralizados |
| `UserDetailsModal.tsx` | Tabs e seções |

**Modais de Usuários:**
| Arquivo | Alterações |
|---------|-----------|
| `AdminPrivilegeModal.tsx` | Cores de ação |
| `EditUserModal.tsx` | Formulário |
| `ResendCredentialsModal.tsx` | Ação |
| `ResetPasswordModal.tsx` | Ação |
| `UserStatusModal.tsx` | Verde/Laranja |
| `shared/UserHeader.tsx` | Badges |
| `shared/ActionConfirmation.tsx` | Cores |

### 8. Páginas de Módulos (9 arquivos)

| Arquivo | Alterações |
|---------|-----------|
| `AICopilotModulePage.tsx` | Cores do módulo |
| `AdminRolePage.tsx` | Placeholder |
| `AvailableModulesPage.tsx` | Cards de módulos - cores específicas |
| `ManagerRolePage.tsx` | Placeholder |
| `MemberRolePage.tsx` | Placeholder |
| `ModulesByCompanyPage.tsx` | Componentes centralizados |
| `RolesPermissionsPage.tsx` | Placeholder |
| `StartupHubModulePage.tsx` | Cores do módulo |
| `StrategicPlanningModulePage.tsx` | Cores do módulo |

### 9. Páginas de Monitoramento (8 arquivos)

| Arquivo | Alterações |
|---------|-----------|
| `AccessLogsPage.tsx` | Placeholder |
| `AlertsPage.tsx` | Placeholder |
| `CriticalErrorsPage.tsx` | Placeholder |
| `DatabaseLogsPage.tsx` | Placeholder |
| `InfoLogsPage.tsx` | Placeholder |
| `PerformancePage.tsx` | Placeholder |
| `SystemHealthPage.tsx` | Cards de status - verde/vermelho/amarelo |
| `WarningsPage.tsx` | Placeholder |

### 10. Páginas de Configurações (12 arquivos)

| Arquivo | Alterações |
|---------|-----------|
| `ActiveSessionsPage.tsx` | Placeholder |
| `BackupPage.tsx` | Placeholder |
| `BackupSchedulesPage.tsx` | Placeholder |
| `CreateBackupPage.tsx` | Placeholder |
| `DataCleanupPage.tsx` | Placeholder |
| `GeneralSettingsPage.tsx` | Placeholder |
| `MFASettingsPage.tsx` | Placeholder |
| `NotificationsSettingsPage.tsx` | Placeholder |
| `PasswordPoliciesPage.tsx` | Placeholder |
| `RestoreBackupPage.tsx` | Placeholder |
| `SecurityPage.tsx` | Placeholder |
| `SystemAdminsSettingsPage.tsx` | Placeholder |

### 11. Páginas de Emails (7 arquivos)

| Arquivo | Alterações |
|---------|-----------|
| `AllEmailTemplatesPage.tsx` | Placeholder |
| `CredentialsTemplatePage.tsx` | Placeholder |
| `NewTemplatePage.tsx` | Placeholder |
| `NotificationTemplatePage.tsx` | Placeholder |
| `PasswordRecoveryTemplatePage.tsx` | Placeholder |
| `PreviewEmailPage.tsx` | Placeholder |
| `WelcomeTemplatePage.tsx` | Placeholder |

### 12. Páginas de Landing (3 arquivos)

| Arquivo | Alterações |
|---------|-----------|
| `EditLandingPage.tsx` | Placeholder |
| `PreviewLandingPage.tsx` | Placeholder |
| `PublishLandingPage.tsx` | Placeholder |

---

## Detalhes Técnicos

### 1. Variáveis CSS (index.css)

Adicionar um scope específico para admin-v2:

```css
/* COFOUND Admin V2 Theme */
.admin-v2-theme {
  /* Core Cofound Colors (HSL) */
  --cofound-blue-light: 200 100% 61%;      /* #38B6FF */
  --cofound-green: 68 56% 63%;              /* #CDD966 */
  --cofound-blue-dark: 208 67% 14%;         /* #0D2338 */
  --cofound-white: 0 0% 97%;                /* #F7F7F7 */
  
  /* Semantic mappings for admin-v2 */
  --admin-primary: var(--cofound-blue-dark);
  --admin-primary-foreground: var(--cofound-white);
  --admin-accent: var(--cofound-blue-light);
  --admin-accent-foreground: var(--cofound-blue-dark);
  --admin-success: var(--cofound-green);
  --admin-background: var(--cofound-white);
  --admin-sidebar-bg: var(--cofound-white);
  
  /* Typography */
  font-family: 'Lexend', sans-serif;
}
```

### 2. Tailwind Config

```typescript
fontFamily: {
  lexend: ['Lexend', 'sans-serif'],
},
colors: {
  cofound: {
    'blue-light': 'hsl(200 100% 61%)',   // #38B6FF
    'green': 'hsl(68 56% 63%)',           // #CDD966
    'blue-dark': 'hsl(208 67% 14%)',      // #0D2338
    'white': 'hsl(0 0% 97%)',             // #F7F7F7
  }
}
```

### 3. AdminV2Page.tsx (Wrapper)

```tsx
<div className="admin-v2-theme flex h-screen bg-cofound-white overflow-hidden font-lexend">
  <AdminV2Sidebar />
  <main className="flex-1 overflow-y-auto">
    <Outlet />
  </main>
</div>
```

### 4. Componentes de Estado (StatCard, StatusBadge)

Atualizar variantes para usar cores Cofound:

```typescript
// StatCard
const variantStyles = {
  default: "bg-cofound-blue-dark/10 text-cofound-blue-dark",
  success: "bg-cofound-green/20 text-cofound-green",
  warning: "bg-yellow-500/10 text-yellow-600",
  danger: "bg-destructive/10 text-destructive",
  info: "bg-cofound-blue-light/10 text-cofound-blue-light",
};

// StatusBadge
active: {
  label: "Ativo",
  className: "bg-cofound-green/20 text-cofound-green border-cofound-green/30",
},
```

### 5. Sidebar Active States

```typescript
// IconNavButton active
isActive
  ? "bg-cofound-blue-dark text-cofound-white shadow-sm"
  : "text-muted-foreground hover:bg-cofound-blue-light/10 hover:text-cofound-blue-dark"

// MenuItem active
isActive
  ? "bg-cofound-blue-dark text-white"
  : "text-muted-foreground hover:bg-cofound-blue-light/10 hover:text-cofound-blue-dark"

// SubMenuItem active
isActive
  ? "bg-cofound-blue-light/10 text-cofound-blue-dark font-medium"
  : "text-muted-foreground hover:bg-cofound-blue-light/5"
```

---

## Resumo de Impacto

| Categoria | Arquivos | Complexidade |
|-----------|----------|--------------|
| Configuração Global | 3 | Alta (base para todo o resto) |
| Layout | 6 | Média |
| Componentes | 10 | Média |
| Páginas | 60+ | Baixa (maioria herda ou é placeholder) |

**Total de arquivos a modificar**: ~25-30 arquivos com mudanças significativas

**Arquivos com mudanças mínimas/herdadas**: ~50+ arquivos

---

## Ordem de Execução

1. **Fase 1**: Configuração (index.html, index.css, tailwind.config.ts)
2. **Fase 2**: Wrapper principal (AdminV2Page.tsx)
3. **Fase 3**: Layout (Sidebar, Header - 5 arquivos)
4. **Fase 4**: Componentes reutilizáveis (10 arquivos)
5. **Fase 5**: Páginas com lógica visual específica (Dashboard, Monitoring, Modules)
6. **Fase 6**: Modais (Companies, Users)

---

## Resultado Visual Esperado

```
┌─────────────────────────────────────────────────────────────────┐
│  SIDEBAR (bg: #F7F7F7)              │  CONTENT AREA             │
│  ┌─────────────────────┐            │  ┌─────────────────────┐  │
│  │ Icon Rail           │            │  │ Header              │  │
│  │ bg: #F7F7F7         │            │  │ Title: #0D2338      │  │
│  │ Active: #0D2338     │            │  │ font: Lexend        │  │
│  │ Hover: #38B6FF/10   │            │  └─────────────────────┘  │
│  └─────────────────────┘            │                           │
│  ┌─────────────────────┐            │  ┌─────────────────────┐  │
│  │ Detail Panel        │            │  │ StatCards           │  │
│  │ Title: #0D2338      │            │  │ Info: #38B6FF       │  │
│  │ Active menu: #0D2338│            │  │ Success: #CDD966    │  │
│  │ Hover: #38B6FF      │            │  └─────────────────────┘  │
│  └─────────────────────┘            │                           │
│                                      │  ┌─────────────────────┐  │
│                                      │  │ Tables              │  │
│                                      │  │ Active: Verde       │  │
│                                      │  │ Primary btn: Navy   │  │
│                                      │  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```
