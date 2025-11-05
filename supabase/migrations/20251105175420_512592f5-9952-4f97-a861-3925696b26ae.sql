-- FASE 2: Corrigir dados inconsistentes do diego@cofound.com.br
-- Adicionar role admin no user_roles e atualizar profiles

-- 1. Inserir diego@cofound.com.br na tabela user_roles com role admin
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role 
FROM auth.users 
WHERE email = 'diego@cofound.com.br'
ON CONFLICT (user_id, role) DO NOTHING;

-- 2. Atualizar profiles.role para consistência (embora não seja mais usado para admin check)
UPDATE public.profiles
SET role = 'admin'::app_role
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'diego@cofound.com.br');