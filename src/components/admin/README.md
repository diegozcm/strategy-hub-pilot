# Sistema Administrativo - Gestão de Empresas

## Conceito Unificado de Empresa

O sistema administrativo foi refatorado para trabalhar com um conceito unificado de empresa, onde:

### Estrutura do Banco de Dados

1. **Tabela `companies`**: Central para todas as empresas
2. **Tabela `user_company_relations`**: Relacionamento many-to-many entre usuários e empresas
3. **Tabela `strategic_plans`**: Planos estratégicos vinculados a `company_id` (não mais `organization_id`)
4. **Tabela `strategic_projects`**: Projetos vinculados a `company_id`

### Funcionalidades

#### Gestão de Empresas
- **Criar empresas**: Modal completo com missão, visão e valores
- **Editar empresas**: Modificar informações e status
- **Ativar/Desativar**: Controle de status das empresas
- **Visualização**: Cards responsivos horizontais em lista vertical

#### Associação de Usuários
- **Relacionamento Many-to-Many**: Um usuário pode estar em múltiplas empresas
- **Funções RPC**:
  - `assign_user_to_company_v2`: Vincula usuário à empresa
  - `unassign_user_from_company_v2`: Remove associação específica
- **Interface de Gestão**:
  - Tab "Usuários da Empresa": Mostra usuários vinculados
  - Tab "Usuários Disponíveis": Mostra usuários que podem ser vinculados
  - Busca e filtros em tempo real

### Tipos Centralizados

Arquivo `src/types/admin.ts` com interfaces compartilhadas:
- `Company`: Interface completa da empresa
- `CompanyUser`: Interface do usuário com relacionamento
- `UserProfile`: Interface do perfil do usuário

### Componentes

1. **CompaniesPage**: Página principal de gestão
2. **CompanyGrid**: Grid de empresas em layout vertical
3. **CompanyCard**: Card horizontal responsivo para cada empresa
4. **ManageUsersModal**: Modal para gerenciar associações de usuários
5. **CreateCompanyModal**: Modal para criar nova empresa
6. **EditCompanyModal**: Modal para editar empresa existente

### Melhorias Implementadas

- ✅ Conceito unificado de empresa em todo o sistema
- ✅ Relacionamento many-to-many entre usuários e empresas
- ✅ Funções RPC seguras para gestão de associações
- ✅ Interface responsiva e moderna
- ✅ Tipos TypeScript centralizados
- ✅ Validações e feedback de usuário
- ✅ Busca e filtros em tempo real
- ✅ Layout horizontal para melhor aproveitamento do espaço

### Segurança

- Todas as operações requerem permissão de administrador
- Validação no backend através de funções RPC
- RLS (Row Level Security) aplicada em todas as tabelas
- Logs de auditoria para mudanças administrativas