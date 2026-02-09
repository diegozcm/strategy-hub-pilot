

## Correcao da Exclusao de Usuarios + Fase 3 (Templates de Email)

---

### Parte 1: Correcao do Bug de Exclusao de Usuarios

#### Problema Identificado

O erro na imagem e claro: `relation "public.company_user_relations" does not exist`.

A tabela real no banco se chama `user_company_relations`, mas as duas funcoes SQL de exclusao referenciam o nome errado `company_user_relations`:

| Funcao | Arquivo de Migracao | Linha com erro |
|--------|---------------------|----------------|
| `safe_delete_user` | `20260204201951_*.sql` | Linha 35: `DELETE FROM public.company_user_relations` |
| `safe_delete_user_with_replacement` | `20260204201537_*.sql` | Linha 192: `DELETE FROM company_user_relations` |

#### Solucao

Criar uma nova migracao SQL que recria ambas as funcoes com o nome correto da tabela (`user_company_relations`), removendo a referencia errada a `company_user_relations`.

**Alteracoes especificas:**
- Na funcao `safe_delete_user`: remover a linha `DELETE FROM public.company_user_relations` (linha 35), ja que a linha seguinte (36) ja faz `DELETE FROM public.user_company_relations` corretamente
- Na funcao `safe_delete_user_with_replacement`: trocar `DELETE FROM company_user_relations` para `DELETE FROM user_company_relations`

---

### Parte 2: Fase 3 - Templates de Email

#### Contexto

A tabela `email_templates` ja existe no banco com 2 templates cadastrados:
- `welcome_credentials` - Credenciais de Boas-vindas
- `password_reset` - Reset de Senha

Estrutura da tabela: `id`, `template_key`, `template_name`, `subject`, `body_html`, `available_variables`, `description`, `is_active`, `created_at`, `updated_at`, `created_by`, `updated_by`

#### 7 paginas placeholder a implementar:

**2.1 AllEmailTemplatesPage** - Lista todos os templates do banco com status, acoes de editar/duplicar/ativar-desativar

**2.2 WelcomeTemplatePage** - Editor do template `welcome_credentials` com preview ao vivo e variaveis disponiveis

**2.3 CredentialsTemplatePage** - Mesma estrutura, filtrando por `welcome_credentials`

**2.4 PasswordRecoveryTemplatePage** - Editor do template `password_reset`

**2.5 NotificationTemplatePage** - Editor para templates de notificacao (pode criar novo se nao existir)

**2.6 NewTemplatePage** - Formulario para criar novo template com campos: chave, nome, assunto, corpo HTML, variaveis, descricao

**2.7 PreviewEmailPage** - Preview de template com dados simulados preenchendo as variaveis

#### Abordagem de Implementacao

Criar um componente reutilizavel `EmailTemplateEditor` que sera compartilhado entre todas as paginas de edicao de template. Este componente tera:
- Editor de HTML com syntax highlighting basico (textarea com monospace)
- Painel lateral com variaveis disponiveis (clicaveis para inserir)
- Preview ao vivo renderizando o HTML com dados de exemplo
- Botoes para salvar e ativar/desativar

---

### Detalhes Tecnicos

#### Arquivos a criar/modificar:

| Arquivo | Acao |
|---------|------|
| Nova migracao SQL | Recriar `safe_delete_user` e `safe_delete_user_with_replacement` com nome correto da tabela |
| `src/components/admin-v2/pages/emails/EmailTemplateEditor.tsx` | **Novo** - Componente reutilizavel de edicao |
| `src/components/admin-v2/pages/emails/AllEmailTemplatesPage.tsx` | Reescrever - Lista de templates do banco |
| `src/components/admin-v2/pages/emails/WelcomeTemplatePage.tsx` | Reescrever - Editor do template welcome |
| `src/components/admin-v2/pages/emails/CredentialsTemplatePage.tsx` | Reescrever - Editor do template credentials |
| `src/components/admin-v2/pages/emails/PasswordRecoveryTemplatePage.tsx` | Reescrever - Editor do template password_reset |
| `src/components/admin-v2/pages/emails/NotificationTemplatePage.tsx` | Reescrever - Editor/criacao de template notificacao |
| `src/components/admin-v2/pages/emails/NewTemplatePage.tsx` | Reescrever - Formulario de novo template |
| `src/components/admin-v2/pages/emails/PreviewEmailPage.tsx` | Reescrever - Preview com dados simulados |

#### Logica do EmailTemplateEditor:
- Recebe `templateKey` como prop para carregar template existente
- Query via `supabase.from('email_templates').select('*').eq('template_key', key)`
- Update via `supabase.from('email_templates').update({...}).eq('id', id)`
- Preview usa `dangerouslySetInnerHTML` com DOMPurify (ja instalado) em um iframe sandbox
- Variaveis sao renderizadas substituindo `{{variavel}}` por valores de exemplo

