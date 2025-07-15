-- Atualizar perfis existentes para usar emails válidos
UPDATE public.profiles 
SET 
  email = 'admin@example.com'
WHERE email = 'admin@sistema.com';

UPDATE public.profiles 
SET 
  email = 'manager@example.com'
WHERE email = 'gestor@empresa.com';

-- Atualizar a função handle_new_user para usar emails válidos
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
  IF NEW.email = 'admin@example.com' THEN
    user_role := 'admin';
  ELSIF NEW.email = 'manager@example.com' THEN
    user_role := 'admin'; -- Manager também será admin
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
        WHEN NEW.email = 'admin@example.com' THEN 'Admin'
        WHEN NEW.email = 'manager@example.com' THEN 'Manager'
        ELSE ''
      END
    ),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', 
      CASE 
        WHEN NEW.email = 'admin@example.com' THEN 'Sistema'
        WHEN NEW.email = 'manager@example.com' THEN 'Sistema'
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