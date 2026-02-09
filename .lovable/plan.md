

## Auditoria Completa do Admin-V2 - Diagnostico e Plano Estrategico

---

### 1. Inventario de Paginas

Das **70+ rotas** registradas no admin-v2, aqui esta o status real de cada uma:

#### Paginas Implementadas (com dados reais do banco)

| Secao | Pagina | Status |
|-------|--------|--------|
| Dashboard | Painel Principal | Funcional - stats, graficos, analytics |
| Dashboard | Atividade Recente | Funcional - timeline de atividades |
| Dashboard | Usuarios Ativos | Funcional |
| Dashboard | Empresas Cadastradas | Funcional |
| Dashboard | Logins Recentes | Funcional |
| Dashboard | Usuarios por Empresa | Funcional |
| Dashboard | Status do Sistema | Funcional |
| Empresas | Todas as Empresas | Funcional - lista, busca, modal detalhes |
| Empresas | Filtrar Empresas | Funcional - filtros avancados |
| Empresas | Nova Empresa | **Parcial** - formulario existe mas NAO salva no banco |
| Empresas | Ativas/Inativas/Startups/Mentores/Arquivadas | Funcional - filtros pre-aplicados |
| Usuarios | Todos os Usuarios | Funcional - lista, filtros, modais |
| Usuarios | Criar Usuario | Funcional completo - auth + perfil + modulos + email |
| Usuarios | Filtrar Usuarios | Funcional |
| Usuarios | Ativos/Inativos/Pendentes/Primeiro Login/Admins | Funcional |
| Modulos | Modulos Disponiveis | Funcional - stats de uso |
| Modulos | Planejamento Estrategico/Startup Hub/AI Copilot | Funcional - detalhes por modulo |
| Modulos | Modulos por Empresa | Funcional |
| Modulos | Roles e Permissoes | Funcional - cards de roles |
| Monitoramento | Saude do Sistema | Funcional - diagnosticos client-side |
| Monitoramento | Performance | Funcional - metricas de navegador |
| Monitoramento | Alertas | Funcional - com sub-categorias |
| Monitoramento | Logs de Acesso/Banco | Funcional |

#### Paginas Placeholder (25 paginas - apenas "Em desenvolvimento")

| Secao | Paginas |
|-------|---------|
| Dashboard (4) | Estatisticas do Sistema, Ultimas 24h, Ultima Semana, Ultimo Mes |
| Configuracoes (12) | **TODAS** - Config Gerais, Seguranca, Politicas de Senha, MFA, Sessoes Ativas, Notificacoes, Backup (criar/restaurar/agendamentos), Limpeza de Dados, Admins do Sistema |
| Landing Page (3) | **TODAS** - Editar, Preview, Publicar |
| Templates de Email (7) | **TODAS** - Todos Templates, Boas-vindas, Credenciais, Recuperacao, Notificacoes, Novo Template, Preview |

---

### 2. Erros e Problemas Encontrados

#### Erros Criticos

| ID | Problema | Arquivo | Impacto |
|----|----------|---------|---------|
| E1 | **Nova Empresa nao salva**: O botao "Criar Empresa" chama `handleNotImplemented()` em vez de inserir no banco | `NewCompanyPage.tsx` | Impossivel criar empresas pelo admin-v2 |
| E2 | **Botao Cancelar com rota errada**: Navega para `/companies/all` mas a rota correta e `/companies` | `NewCompanyPage.tsx` | 404 ao cancelar criacao |
| E3 | **Upload de logo nao implementado**: Botao "Selecionar Arquivo" chama `handleNotImplemented` | `NewCompanyPage.tsx` | Empresas criadas sem logo |

#### Problemas de Dados

| ID | Problema | Arquivo | Impacto |
|----|----------|---------|---------|
| D1 | **Contagem de usuarios por empresa**: Usa `profiles.company_id` em vez de `user_company_relations`, pode estar desatualizada para usuarios com multiplas empresas | `AllCompaniesPage.tsx` | Numeros potencialmente incorretos |
| D2 | **Monitoramento client-side apenas**: SystemHealth e Performance medem apenas o navegador do admin, nao o servidor real | `SystemHealthPage.tsx`, `PerformancePage.tsx` | Metricas nao refletem saude real do backend |

#### Problemas de UX

| ID | Problema | Impacto |
|----|----------|---------|
| U1 | 25 paginas mostram apenas "Em desenvolvimento" sem indicacao de quando serao implementadas | Experiencia confusa para admins |
| U2 | Secao de Configuracoes inteira e placeholder - nenhuma configuracao pode ser alterada | Admin sem controle sobre o sistema |
| U3 | Templates de Email inteiros sao placeholder - impossivel personalizar comunicacoes | Emails sao genericos |

---

### 3. Plano Estrategico de Implementacao

Priorizado por impacto no negocio e dependencias tecnicas:

#### Fase 1 - Correcoes Criticas (Prioridade Maxima)

**1.1 Corrigir criacao de empresas**
- Implementar logica de `INSERT` no banco em `NewCompanyPage.tsx`
- Corrigir rota do botao Cancelar (`/companies/all` -> `/companies`)
- Implementar upload de logo via Supabase Storage
- Adicionar validacao de campos obrigatorios

**1.2 Corrigir contagem de usuarios**
- Alterar `AllCompaniesPage.tsx` para usar `user_company_relations` em vez de `profiles.company_id`
- Garantir que a contagem reflita usuarios com multiplas empresas

#### Fase 2 - Configuracoes do Sistema (Alta Prioridade)

**2.1 Configuracoes Gerais**
- Implementar `GeneralSettingsPage` com nome do sistema, logo, timezone, idioma padrao

**2.2 Admins do Sistema**
- Implementar `SystemAdminsSettingsPage` para gerenciar quem e system admin
- Permitir promover/revogar admin status

**2.3 Seguranca Basica**
- Implementar `SecurityPage` com overview de politicas
- Implementar `ActiveSessionsPage` para ver/encerrar sessoes

#### Fase 3 - Templates de Email (Media Prioridade)

**3.1 Editor de Templates**
- Implementar `AllEmailTemplatesPage` listando templates do banco
- Implementar editor visual para cada template (Welcome, Credentials, etc.)
- Implementar Preview com dados simulados

#### Fase 4 - Landing Page (Media Prioridade)

**4.1 Editor de Landing Page**
- Implementar `EditLandingPage` conectado a tabela `landing_page_content`
- Implementar Preview ao vivo
- Implementar Publicacao com confirmacao

#### Fase 5 - Dashboard Avancado (Baixa Prioridade)

**5.1 Sub-paginas de atividade**
- Implementar filtros de 24h, Semana, Mes em `RecentActivity*Page`
- Implementar `SystemStatsPage` com graficos detalhados

#### Fase 6 - Monitoramento Real (Baixa Prioridade)

**6.1 Metricas server-side**
- Considerar criar edge functions para monitoramento real do backend
- Atualmente tudo e client-side (apenas mede o navegador do admin)

---

### 4. Detalhes Tecnicos

#### Fase 1 - Arquivos a modificar

| Arquivo | Alteracao |
|---------|----------|
| `src/components/admin-v2/pages/companies/NewCompanyPage.tsx` | Implementar `handleCreateCompany` com insert no Supabase, upload de logo, validacao, toast de sucesso e redirect |
| `src/components/admin-v2/pages/companies/AllCompaniesPage.tsx` | Trocar query de contagem de usuarios para usar `user_company_relations` |

#### Nova empresa - logica necessaria

```text
1. Validar nome obrigatorio
2. Insert em companies (name, company_type, mission, vision, values, ai_enabled, status='active')
3. Upload logo para storage bucket 'company-logos' (se existir)
4. Update company com logo_url
5. Toast de sucesso + navigate para /companies
```

#### Contagem correta de usuarios

```text
Query atual (incorreta):
  profiles.company_id -> conta apenas empresa primaria

Query correta:
  user_company_relations -> conta todas as relacoes ativas
  Agrupa por company_id, filtra status='active'
```

---

### 5. Resumo Executivo

| Metrica | Valor |
|---------|-------|
| Total de rotas admin-v2 | ~70 |
| Paginas funcionais | ~45 (64%) |
| Paginas placeholder | 25 (36%) |
| Erros criticos encontrados | 3 |
| Problemas de dados | 2 |
| Problemas de UX | 3 |
| Secoes inteiras sem implementacao | 3 (Config, Landing, Emails) |

A prioridade imediata e corrigir a **Fase 1** (criacao de empresas e contagem de usuarios), pois sao funcionalidades core que ja tem UI mas nao funcionam. As demais fases podem ser implementadas incrementalmente.

