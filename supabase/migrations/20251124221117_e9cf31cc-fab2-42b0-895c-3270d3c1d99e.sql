-- ============================================
-- ROLLBACK COMPLETO DO MÓDULO OKR PLANNING
-- ============================================

-- ETAPA 1: Remover dados das tabelas OKR (respeitando foreign keys)
DELETE FROM okr_actions;
DELETE FROM okr_check_ins;
DELETE FROM okr_key_results;
DELETE FROM okr_objectives;
DELETE FROM okr_pillars;
DELETE FROM okr_quarters;
DELETE FROM okr_years;

-- ETAPA 2: Remover associações de usuários ao módulo
DELETE FROM user_module_roles 
WHERE module_id = (SELECT id FROM system_modules WHERE slug = 'okr-planning');

DELETE FROM user_modules 
WHERE module_id = (SELECT id FROM system_modules WHERE slug = 'okr-planning');

-- ETAPA 3: Remover o módulo do sistema
DELETE FROM system_modules WHERE slug = 'okr-planning';

-- ETAPA 4: Dropar tabelas OKR permanentemente (respeitando dependências)
DROP TABLE IF EXISTS okr_actions CASCADE;
DROP TABLE IF EXISTS okr_check_ins CASCADE;
DROP TABLE IF EXISTS okr_key_results CASCADE;
DROP TABLE IF EXISTS okr_objectives CASCADE;
DROP TABLE IF EXISTS okr_pillars CASCADE;
DROP TABLE IF EXISTS okr_quarters CASCADE;
DROP TABLE IF EXISTS okr_years CASCADE;