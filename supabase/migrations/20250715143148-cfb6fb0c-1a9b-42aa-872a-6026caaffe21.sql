-- Remover o trigger existente e recriar a função corrigida
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Criar nova função handle_new_user sem erros
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  user_count INTEGER;
  user_role TEXT := 'member';
BEGIN
  -- Count total users to determine if this is the first user
  SELECT COUNT(*) INTO user_count FROM auth.users;
  
  -- Determinar o papel baseado no email
  IF NEW.email = 'admin@example.com' THEN
    user_role := 'admin';
  ELSIF NEW.email = 'manager@example.com' THEN
    user_role := 'manager';
  ELSIF user_count = 1 THEN
    user_role := 'admin'; -- Primeiro usuário é sempre admin
  ELSE
    user_role := 'member';
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
        ELSE split_part(NEW.email, '@', 1)
      END
    ),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', 
      CASE 
        WHEN NEW.email = 'admin@example.com' THEN 'Sistema'
        WHEN NEW.email = 'manager@example.com' THEN 'Sistema'
        ELSE 'User'
      END
    ),
    NEW.email,
    user_role::public.app_role,
    'active',
    now(),
    now()
  );

  -- Inserir na tabela user_roles
  INSERT INTO public.user_roles (user_id, role, created_at, updated_at)
  VALUES (NEW.id, user_role::public.app_role, now(), now())
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error e continue sem falhar
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Recriar o trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();