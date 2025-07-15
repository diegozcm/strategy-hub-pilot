
-- Primeiro, vamos verificar se temos empresas criadas
INSERT INTO public.companies (id, name, owner_id, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000001', 'Sistema Principal', '00000000-0000-0000-0000-000000000000', now(), now())
ON CONFLICT (id) DO NOTHING;

-- Atualizar a função handle_new_user para mapear os tipos de usuário corretamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  user_count INTEGER;
  user_role app_role := 'member';
  company_uuid UUID := '00000000-0000-0000-0000-000000000001';
BEGIN
  -- Count total users to determine if this is the first user
  SELECT COUNT(*) INTO user_count FROM auth.users;
  
  -- Determinar o papel baseado no email
  IF NEW.email = 'admin@sistema.com' THEN
    user_role := 'admin';
  ELSIF NEW.email = 'gestor@empresa.com' THEN
    user_role := 'admin'; -- Gestor também será admin
  ELSIF user_count = 1 THEN
    user_role := 'admin'; -- Primeiro usuário é sempre admin
  END IF;

  -- Inserir o perfil do usuário
  INSERT INTO public.profiles (
    user_id, 
    first_name, 
    last_name, 
    email, 
    role,
    status,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', 
      CASE 
        WHEN NEW.email = 'admin@sistema.com' THEN 'Admin'
        WHEN NEW.email = 'gestor@empresa.com' THEN 'Gestor'
        ELSE ''
      END
    ),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', 
      CASE 
        WHEN NEW.email = 'admin@sistema.com' THEN 'Sistema'
        WHEN NEW.email = 'gestor@empresa.com' THEN 'Empresa'
        ELSE ''
      END
    ),
    NEW.email,
    user_role,
    'active',
    now(),
    now()
  );

  -- Inserir na tabela user_roles
  INSERT INTO public.user_roles (user_id, role, created_at, updated_at)
  VALUES (NEW.id, user_role, now(), now())
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Atualizar perfis existentes se necessário
UPDATE public.profiles 
SET 
  role = 'admin',
  status = 'active',
  first_name = 'Admin',
  last_name = 'Sistema'
WHERE email = 'admin@sistema.com';

UPDATE public.profiles 
SET 
  role = 'admin',
  status = 'active',
  first_name = 'Gestor',
  last_name = 'Empresa'
WHERE email = 'gestor@empresa.com';

-- Inserir/atualizar user_roles para usuários existentes
INSERT INTO public.user_roles (user_id, role, created_at, updated_at)
SELECT p.user_id, 'admin'::app_role, now(), now()
FROM public.profiles p
WHERE p.email IN ('admin@sistema.com', 'gestor@empresa.com')
ON CONFLICT (user_id, role) DO NOTHING;
