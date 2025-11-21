
-- Corrigir role do usuário Bernardo Bruschi
-- Remover role 'admin' e manter apenas 'member'

-- 1. Remover o role 'admin' da tabela user_roles
DELETE FROM public.user_roles
WHERE user_id = 'e0509600-0fad-47ef-a964-3a50cffdbf3a'
AND role = 'admin'::app_role;

-- 2. Atualizar o profile_role para 'member'
UPDATE public.profiles
SET 
  role = 'member'::app_role,
  updated_at = now()
WHERE user_id = 'e0509600-0fad-47ef-a964-3a50cffdbf3a';

-- 3. Garantir que existe apenas o role 'member' em user_roles
INSERT INTO public.user_roles (user_id, role, created_at, updated_at)
VALUES ('e0509600-0fad-47ef-a964-3a50cffdbf3a', 'member'::app_role, now(), now())
ON CONFLICT (user_id, role) DO UPDATE SET updated_at = now();
