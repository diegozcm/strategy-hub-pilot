
## Implementar o botao "Ver Perfil" nas Startups Ativas

### Problema Atual
O botao "Ver Perfil" no card de cada startup na pagina de Startups Ativas (`ActiveStartupsPage.tsx`) apenas exibe um toast dizendo "Funcionalidade em Desenvolvimento". No entanto, ja existe um modal completo de detalhes da empresa (`CompanyDetailsModal`) com abas de Informacoes, Usuarios, Configuracoes e Acoes.

### Solucao
Conectar o botao "Ver Perfil" ao `CompanyDetailsModal` ja existente, reutilizando toda a infraestrutura de visualizacao e gerenciamento de empresas.

### Alteracoes Necessarias

**Arquivo: `src/components/admin-v2/pages/companies/ActiveStartupsPage.tsx`**

1. Importar o `CompanyDetailsModal` de `./modals/CompanyDetailsModal`
2. Adicionar state para controlar a startup selecionada (`selectedStartup`) e o estado de abertura do modal
3. Substituir a funcao `handleNotImplemented` no botao "Ver Perfil" por uma funcao que define a startup selecionada e abre o modal
4. Renderizar o `CompanyDetailsModal` no final do componente, passando a startup selecionada
5. No callback `onSuccess`, fazer refetch dos dados (via `refetch` do `useStartupDetails`)

### Detalhes Tecnicos

- O `CompanyDetailsModal` espera um objeto com `{ id, name, logo_url, status, company_type, ai_enabled, userCount, created_at }`
- Os dados do `useStartupDetails` ja possuem esses campos (com `members` em vez de `userCount`), entao sera necessario mapear `members` para `userCount` ao passar para o modal
- O `handleNotImplemented` pode ser removido se nao houver outros usos na pagina
