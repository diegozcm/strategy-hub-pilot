-- Limpar todos os dados do sistema
-- Desabilitar temporariamente as políticas RLS para permitir limpeza
ALTER TABLE ai_analytics DISABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chat_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chat_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights DISABLE ROW LEVEL SECURITY;
ALTER TABLE ai_recommendations DISABLE ROW LEVEL SECURITY;
ALTER TABLE ai_user_preferences DISABLE ROW LEVEL SECURITY;
ALTER TABLE key_result_values DISABLE ROW LEVEL SECURITY;
ALTER TABLE key_results DISABLE ROW LEVEL SECURITY;
ALTER TABLE performance_reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE project_kr_relations DISABLE ROW LEVEL SECURITY;
ALTER TABLE project_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE project_objective_relations DISABLE ROW LEVEL SECURITY;
ALTER TABLE project_tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE strategic_objectives DISABLE ROW LEVEL SECURITY;
ALTER TABLE strategic_pillars DISABLE ROW LEVEL SECURITY;
ALTER TABLE strategic_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE strategic_projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE companies DISABLE ROW LEVEL SECURITY;

-- Limpar dados das tabelas (ordem respeitando foreign keys)
DELETE FROM ai_analytics;
DELETE FROM ai_chat_messages;
DELETE FROM ai_chat_sessions;
DELETE FROM ai_insights;
DELETE FROM ai_recommendations;
DELETE FROM ai_user_preferences;
DELETE FROM key_result_values;
DELETE FROM key_results;
DELETE FROM performance_reviews;
DELETE FROM project_kr_relations;
DELETE FROM project_members;
DELETE FROM project_objective_relations;
DELETE FROM project_tasks;
DELETE FROM strategic_objectives;
DELETE FROM strategic_pillars;
DELETE FROM strategic_plans;
DELETE FROM strategic_projects;
DELETE FROM profiles;
DELETE FROM companies;

-- Recriar empresa padrão para sistema
INSERT INTO companies (id, name, active) 
VALUES ('00000000-0000-0000-0000-000000000001', 'Sistema Principal', true);

-- Reativar políticas RLS
ALTER TABLE ai_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE key_result_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE key_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_kr_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_objective_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategic_objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategic_pillars ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategic_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategic_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;