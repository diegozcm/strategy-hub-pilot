

## Exportar Todos os Dados de uma Empresa

### Objetivo
Criar uma funcao segura de exportacao completa de todos os dados de uma empresa especifica, acessivel apenas por System Admins no painel administrativo.

### Onde ficara o botao
O botao "Exportar Dados" sera adicionado na aba **Acoes** do `CompanyDetailsModal`, junto com os outros cards de acao (Editar, Gerenciar Usuarios, Desativar). Isso permite exportar os dados de qualquer empresa ao clicar em "Ver Perfil" e ir na aba Acoes.

### Arquitetura de Seguranca

A exportacao sera feita via **Edge Function** (`export-company-data`) que:

1. Valida o JWT do usuario autenticado
2. Verifica se o usuario e **System Admin** usando a funcao `is_system_admin()` do banco
3. Registra um log de auditoria da exportacao (nova tabela `company_export_logs`)
4. Coleta todos os dados da empresa usando `SUPABASE_SERVICE_ROLE_KEY` (bypassa RLS para garantir exportacao completa)
5. Retorna um arquivo JSON/XLSX para download

### Tabelas Exportadas (por empresa)

Todas as tabelas que possuem `company_id` direto ou indireto:

- `companies` (dados da empresa)
- `user_company_relations` + `profiles` (usuarios vinculados)
- `golden_circle`, `golden_circle_history`
- `swot_analysis`, `swot_history`
- `vision_alignment`, `vision_alignment_history`, `vision_alignment_objectives`
- `strategic_plans`, `strategic_pillars`, `strategic_objectives`
- `key_results`, `key_result_values`, `key_results_history`
- `kr_fca`, `kr_initiatives`, `kr_monthly_actions`, `kr_status_reports`, `kr_actions_history`
- `strategic_projects`, `project_members`, `project_tasks`, `project_kr_relations`, `project_objective_relations`
- `beep_assessments`, `beep_answers`
- `governance_meetings`, `governance_agenda_items`, `governance_atas`, `governance_rules`, `governance_rule_items`, `governance_rule_documents`
- `ai_chat_sessions`, `ai_chat_messages`, `ai_company_settings`, `ai_insights`, `ai_recommendations`
- `mentor_startup_relations`, `mentoring_sessions`, `action_items`, `mentor_todos`
- `performance_reviews`
- `company_module_settings`, `password_policies`
- `user_login_logs`

### Implementacao

#### 1. Migration SQL - Tabela de Auditoria

```sql
CREATE TABLE public.company_export_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id),
  admin_user_id uuid NOT NULL,
  export_format text NOT NULL DEFAULT 'xlsx',
  tables_exported text[] NOT NULL,
  total_records integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.company_export_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only system admins can access export logs"
  ON public.company_export_logs FOR ALL
  USING (public.is_system_admin(auth.uid()));
```

#### 2. Edge Function: `export-company-data`

- Recebe `{ company_id, format: 'json' | 'xlsx' }`
- Valida autenticacao e `is_system_admin`
- Usa service role para consultar todas as tabelas filtrando por `company_id`
- Para tabelas com relacao indireta (ex: `key_results` via `strategic_objectives` -> `strategic_plans`), faz JOINs encadeados
- Registra o log de exportacao
- Retorna JSON com todos os dados organizados por categoria

#### 3. Frontend - CompanyDetailsModal

- Novo card na aba "Acoes" com icone de Download
- Modal de confirmacao antes de iniciar (AlertDialog)
- Indicador de loading durante a exportacao
- Download automatico do arquivo gerado
- Formato de exportacao: XLSX (com uma aba por tabela) usando a lib `xlsx` ja instalada

### Detalhes Tecnicos

**Edge Function** (`supabase/functions/export-company-data/index.ts`):
- `verify_jwt = false` no config.toml, validacao manual via `getClaims()`
- Usa `SUPABASE_SERVICE_ROLE_KEY` para bypassa RLS e garantir exportacao completa
- Dupla verificacao: `getClaims()` + RPC `is_system_admin(user_id)` no banco

**Frontend** (arquivos modificados):
- `src/components/admin-v2/pages/companies/modals/CompanyDetailsModal.tsx` - adicionar card de exportacao na aba Acoes e logica de download
- `supabase/config.toml` - adicionar configuracao da nova edge function

