

## Refinar Exportacao: Foco em Dados Estrategicos e Operacionais

### O que muda

A exportacao atual puxa muitos dados desnecessarios (chats de IA, logs de login, dados de startup/mentoria, preferencias de usuario, etc.). O objetivo e focar apenas nos dados estrategicos e operacionais que fazem sentido importar para outra empresa.

### Tabelas que PERMANECEM na exportacao

**Dados da empresa:**
- `companies` - dados basicos da empresa

**Ferramentas estrategicas:**
- `golden_circle` + `golden_circle_history`
- `swot_analysis` + `swot_history`
- `vision_alignment` + `vision_alignment_history` + `vision_alignment_objectives` + `vision_alignment_removed_dupes`

**Cadeia estrategica completa (OKRs):**
- `strategic_plans` - planos estrategicos
- `strategic_pillars` - pilares
- `strategic_objectives` - objetivos
- `key_results` - resultados-chave
- `key_result_values` - valores/metas mensais
- `key_results_history` - historico de alteracoes dos KRs

**KR sub-dados:**
- `kr_initiatives` - iniciativas
- `kr_fca` - analises FCA (Fato, Causa, Acao)
- `kr_monthly_actions` - acoes mensais
- `kr_actions_history` - historico das acoes
- `kr_status_reports` - relatorios de status

**Projetos:**
- `strategic_projects` - projetos estrategicos
- `project_members` - membros dos projetos
- `project_tasks` - tarefas dos projetos
- `project_kr_relations` - relacao projeto-KR
- `project_objective_relations` - relacao projeto-objetivo

**Governanca:**
- `governance_meetings` + `governance_agenda_items` + `governance_atas`
- `governance_rules` + `governance_rule_items` + `governance_rule_documents`

**Avaliacoes:**
- `beep_assessments` + `beep_answers`
- `performance_reviews`

**Configuracoes da empresa:**
- `company_module_settings`

### Tabelas REMOVIDAS da exportacao

- `user_company_relations` - relacoes usuario-empresa (nao faz sentido importar usuarios)
- `profiles` - perfis de usuario
- `user_login_logs` - logs de login
- `ai_chat_sessions` + `ai_chat_messages` - conversas de IA
- `ai_company_settings` - config de IA
- `ai_insights` + `ai_recommendations` - insights de IA
- `ai_analytics` + `ai_user_preferences` - analytics e preferencias de IA
- `mentor_startup_relations` + `mentoring_sessions` + `action_items` + `mentor_todos` - dados de mentoria/startup
- `startup_hub_profiles` - perfis de startup hub
- `user_module_profiles`, `user_module_roles`, `user_modules`, `user_roles` - dados de modulos/roles de usuarios
- `profile_access_logs` - logs de acesso
- `password_policies` - politicas de senha

### Detalhes Tecnicos

**Arquivo modificado:** `supabase/functions/export-company-data/index.ts`

Mudancas:
1. Remover toda a secao de "User-based tables" (linhas 163-179) - nao busca mais dados de usuarios
2. Remover busca de `user_company_relations` (nao precisa mais de userIds)
3. Remover busca de tabelas de IA: `ai_chat_sessions`, `ai_chat_messages`, `ai_company_settings`, `ai_insights`, `ai_recommendations`
4. Remover busca de tabelas de mentoria: `mentor_startup_relations`, `mentoring_sessions`, `action_items`, `mentor_todos`
5. Remover `password_policies`
6. Manter toda a cadeia estrategica (plans -> pillars -> objectives -> KRs -> values/history/FCA/initiatives/actions/status_reports)
7. Manter projetos com tasks, members e relacoes
8. Manter governanca completa
9. Manter BEEP, performance reviews e company_module_settings

