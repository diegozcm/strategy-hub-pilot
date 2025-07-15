-- Criar o tipo app_role se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'member');
    END IF;
END
$$;

-- Atualizar perfis existentes para usar emails válidos
UPDATE public.profiles 
SET 
  email = 'admin@example.com'
WHERE email = 'admin@sistema.com';

UPDATE public.profiles 
SET 
  email = 'manager@example.com'
WHERE email = 'gestor@empresa.com';