-- Limpar módulo OKR Execution do sistema

-- 1. Deletar registro do módulo OKR
DELETE FROM public.system_modules WHERE slug = 'okr-execution';

-- 2. Deletar todas as tabelas OKR (ordem importa devido a Foreign Keys)
DROP TABLE IF EXISTS public.okr_initiatives CASCADE;
DROP TABLE IF EXISTS public.okr_key_results CASCADE;
DROP TABLE IF EXISTS public.okr_objectives CASCADE;
DROP TABLE IF EXISTS public.okr_periods CASCADE;
DROP TABLE IF EXISTS public.okr_year_transitions CASCADE;
DROP TABLE IF EXISTS public.okr_years CASCADE;

-- 3. Limpar entradas órfãs em user_modules relacionadas ao módulo OKR
DELETE FROM public.user_modules 
WHERE module_id IN (
  SELECT id FROM public.system_modules WHERE slug = 'okr-execution'
);

-- 4. Limpar entradas órfãs em user_module_roles relacionadas ao módulo OKR
DELETE FROM public.user_module_roles 
WHERE module_id IN (
  SELECT id FROM public.system_modules WHERE slug = 'okr-execution'
);

-- Nota: Módulo AI Copilot permanece intacto no banco de dados,
-- apenas foi removido da UI de gerenciamento de usuários