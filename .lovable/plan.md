
# Plano: Melhorar Aplicação das Cores Cofound no Admin-V2

## Problema Identificado

As cores da identidade visual Cofound não estão sendo aplicadas de forma ampla:
- **Verde (#CDD966)** praticamente não aparece em botões e ações positivas
- **Azul Claro (#38B6FF)** quase não é usado - deveria aparecer em links, hovers, e destaques
- **Azul Escuro (#0D2338)** está sendo usado em excesso, onde deveria haver variedade

## Estratégia de Correção

A implementação será feita em **3 frentes** para garantir uso adequado das cores:

### 1. Botões Primários -> Verde Cofound

**Onde aplicar:**
- Todos os botões de ação principal (Criar, Aplicar, Salvar, Confirmar)
- Botões de status positivo (Reativar, Aprovar)

**Arquivo principal:** `src/components/ui/button.tsx`

Criar nova variante `cofound` para botões primários no admin-v2:

```typescript
const buttonVariants = cva(
  // ... base classes
  {
    variants: {
      variant: {
        // ... outras variantes
        cofound: "bg-cofound-green text-cofound-blue-dark hover:bg-cofound-green/90 font-medium",
        "cofound-outline": "border-2 border-cofound-blue-light bg-transparent text-cofound-blue-light hover:bg-cofound-blue-light/10",
        "cofound-ghost": "text-cofound-blue-light hover:bg-cofound-blue-light/10 hover:text-cofound-blue-light",
      },
      // ...
    }
  }
)
```

### 2. Ícones e Elementos de Destaque -> Azul Claro

**Onde aplicar:**
- Ícones em StatCards de informação
- Links e elementos interativos
- Bordas de foco e ring
- Indicadores visuais

**Arquivos a modificar:**
- `StatCard.tsx` - ícones de variantes info e default
- `MenuItem.tsx` - hover states
- Páginas com ícones hardcoded

### 3. Badges e Status -> Verde para Positivo

**Onde aplicar:**
- Badge "Ativo" e "Habilitado"
- StatusBadge success
- Indicadores de status online

**Arquivos a modificar:**
- `src/components/ui/badge.tsx` - adicionar variante `cofound-success`
- Páginas que usam `Badge variant="default"` para status positivo

---

## Detalhamento das Mudanças

### Arquivo 1: `src/components/ui/button.tsx`

Adicionar variantes Cofound:

```typescript
const buttonVariants = cva(
  "...",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        // ... outras existentes
        // NOVAS VARIANTES COFOUND
        cofound: "bg-cofound-green text-cofound-blue-dark hover:bg-cofound-green/90 font-medium shadow-sm",
        "cofound-secondary": "bg-cofound-blue-light text-cofound-blue-dark hover:bg-cofound-blue-light/90",
        "cofound-outline": "border-2 border-cofound-green bg-transparent text-cofound-green hover:bg-cofound-green/10",
        "cofound-ghost": "text-cofound-blue-light hover:bg-cofound-blue-light/10",
      },
    }
  }
)
```

### Arquivo 2: `src/components/ui/badge.tsx`

Adicionar variantes Cofound:

```typescript
const badgeVariants = cva(
  "...",
  {
    variants: {
      variant: {
        // ... existentes
        // NOVAS VARIANTES COFOUND
        "cofound-success": "border-cofound-green/30 bg-cofound-green/20 text-cofound-green",
        "cofound-info": "border-cofound-blue-light/30 bg-cofound-blue-light/20 text-cofound-blue-light",
        "cofound-primary": "border-transparent bg-cofound-blue-dark text-cofound-white",
      },
    }
  }
)
```

### Arquivo 3: `src/components/admin-v2/components/StatCard.tsx`

Atualizar variantes para usar mais Azul Claro e Verde:

```typescript
const variantStyles = {
  default: "bg-cofound-blue-light/10 text-cofound-blue-light",  // MUDANÇA: era blue-dark
  success: "bg-cofound-green/20 text-cofound-green",
  warning: "bg-yellow-500/10 text-yellow-600",
  danger: "bg-destructive/10 text-destructive",
  info: "bg-cofound-blue-light/10 text-cofound-blue-light",
};
```

### Arquivo 4: `src/components/admin-v2/components/StatusBadge.tsx`

Já está usando cofound-green para active/success. Verificar consistência.

### Arquivo 5: Páginas com Botões Primários

Atualizar todos os botões de ação principal para usar `variant="cofound"`:

| Página | Botões a Atualizar |
|--------|-------------------|
| `FilterUsersPage.tsx` | "Aplicar Filtros" |
| `AllUsersPage.tsx` | "Criar Usuário" |
| `CreateUserPage.tsx` | "Criar Usuário" (submit) |
| `AllCompaniesPage.tsx` | Nenhum (apenas view) |
| `CompanyDetailsModal.tsx` | "Editar Informações", "Gerenciar Usuários" |
| Todos os modais de criação/edição | Botão primário de ação |

### Arquivo 6: Páginas com Ícones Hardcoded

Substituir `text-primary` por `text-cofound-blue-light` nos ícones:

| Arquivo | Elementos |
|---------|-----------|
| `PerformancePage.tsx` | Ícones dos cards de performance |
| `SystemAdminsPage.tsx` | Ícone de UserPlus |
| `DeactivateUserModal.tsx` | Avatar fallback |
| `ReactivateUserModal.tsx` | Avatar fallback |
| `FilterCompaniesPage.tsx` | Ícone de Bot |

### Arquivo 7: Páginas de Módulos

Atualizar cores dos módulos para usar paleta Cofound:

```typescript
const moduleColors: Record<string, string> = {
  "strategic-planning": "bg-cofound-blue-light",  // era blue-500
  "startup-hub": "bg-cofound-green",              // era purple-500
  "ai": "bg-cofound-blue-dark",                   // era amber-500
};
```

---

## Resumo Visual da Paleta

```
┌─────────────────────────────────────────────────────────────────┐
│ ELEMENTO                        │ COR ATUAL      │ COR NOVA    │
├─────────────────────────────────┼────────────────┼─────────────┤
│ Botão Primário (Criar, Salvar)  │ bg-primary     │ Verde       │
│ Botão Secundário (Cancelar)     │ bg-secondary   │ outline     │
│ Links e Hovers                  │ muted          │ Azul Claro  │
│ Ícones em Cards                 │ primary        │ Azul Claro  │
│ Badge "Ativo"                   │ verde genérico │ Verde       │
│ Status Online                   │ green-500      │ Verde       │
│ Títulos                         │ primary        │ Azul Escuro │
│ Sidebar Active                  │ primary        │ Azul Escuro │
└─────────────────────────────────────────────────────────────────┘
```

---

## Arquivos a Modificar

| Arquivo | Tipo de Mudança |
|---------|-----------------|
| `src/components/ui/button.tsx` | Adicionar variantes cofound |
| `src/components/ui/badge.tsx` | Adicionar variantes cofound |
| `src/components/admin-v2/components/StatCard.tsx` | Atualizar default para Azul Claro |
| `src/components/admin-v2/pages/users/FilterUsersPage.tsx` | Botão "Aplicar" -> variant cofound |
| `src/components/admin-v2/pages/users/AllUsersPage.tsx` | Botão "Criar" -> variant cofound |
| `src/components/admin-v2/pages/users/CreateUserPage.tsx` | Botão submit -> variant cofound |
| `src/components/admin-v2/pages/companies/AllCompaniesPage.tsx` | Avatar fallback cores |
| `src/components/admin-v2/pages/companies/FilterCompaniesPage.tsx` | Avatar e ícones |
| `src/components/admin-v2/pages/companies/ActiveStartupsPage.tsx` | Avatar fallback |
| `src/components/admin-v2/pages/companies/modals/CompanyDetailsModal.tsx` | Botões de ação |
| `src/components/admin-v2/pages/users/DeactivateUserModal.tsx` | Avatar fallback |
| `src/components/admin-v2/pages/users/ReactivateUserModal.tsx` | Avatar fallback |
| `src/components/admin-v2/pages/users/modals/shared/UserHeader.tsx` | Avatar fallback |
| `src/components/admin-v2/pages/monitoring/PerformancePage.tsx` | Ícones dos cards |
| `src/components/admin-v2/pages/users/SystemAdminsPage.tsx` | Ícone UserPlus |
| `src/components/admin-v2/pages/dashboard/RegisteredCompaniesPage.tsx` | Avatar fallback |
| `src/components/admin-v2/pages/modules/AvailableModulesPage.tsx` | Cores dos módulos |
| `src/components/admin-v2/pages/modules/ModulesByCompanyPage.tsx` | Badges de módulos |
| `src/components/admin-v2/pages/modules/AICopilotModulePage.tsx` | Badge de status |
| `src/components/admin-v2/pages/monitoring/SystemHealthPage.tsx` | Badge OK |

**Total: ~20 arquivos**

---

## Resultado Esperado

Após as mudanças:

1. **Botões de ação** terão fundo **Verde (#CDD966)** com texto Azul Escuro
2. **Ícones informativos** serão **Azul Claro (#38B6FF)**
3. **Status positivos** usarão **Verde (#CDD966)**
4. **Hover states** terão destaque em **Azul Claro**
5. **Textos principais** permanecerão **Azul Escuro (#0D2338)**

A interface terá um visual mais vibrante e alinhado com a identidade Cofound.
