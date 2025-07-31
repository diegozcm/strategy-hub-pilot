-- Primeiro, vamos corrigir a função handle_new_user para garantir que funcione corretamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  user_count INTEGER;
  user_role TEXT := 'member';
BEGIN
  -- Log para debug
  RAISE LOG 'handle_new_user: Processando usuário %', NEW.email;
  
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

  -- Inserir o perfil do usuário (sempre ativo, sem necessidade de aprovação)
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
    'active', -- Sempre ativo por padrão
    now(),
    now()
  );

  -- Inserir na tabela user_roles
  INSERT INTO public.user_roles (user_id, role, created_at, updated_at)
  VALUES (NEW.id, user_role::public.app_role, now(), now())
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Log de sucesso
  RAISE LOG 'handle_new_user: Perfil criado com sucesso para % com role %', NEW.email, user_role;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error detalhado mas não falha
    RAISE LOG 'handle_new_user ERROR para %: % - %', NEW.email, SQLSTATE, SQLERRM;
    RETURN NEW;
END;
$function$;

-- Garantir que o trigger existe e está ativo
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Criar função administrativa para criar perfis em lote para usuários sem perfil
CREATE OR REPLACE FUNCTION public.create_missing_profiles()
RETURNS TABLE(user_id uuid, email text, action text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  missing_user RECORD;
  user_role TEXT;
BEGIN
  -- Encontrar usuários sem perfil
  FOR missing_user IN 
    SELECT au.id, au.email, au.raw_user_meta_data
    FROM auth.users au
    LEFT JOIN public.profiles p ON p.user_id = au.id
    WHERE p.user_id IS NULL
  LOOP
    -- Determinar role (todos novos serão 'member' por padrão)
    user_role := 'member';
    
    -- Inserir perfil
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
      missing_user.id,
      COALESCE(missing_user.raw_user_meta_data ->> 'first_name', split_part(missing_user.email, '@', 1)),
      COALESCE(missing_user.raw_user_meta_data ->> 'last_name', 'User'),
      missing_user.email,
      user_role::public.app_role,
      'active',
      now(),
      now()
    );
    
    -- Inserir role
    INSERT INTO public.user_roles (user_id, role, created_at, updated_at)
    VALUES (missing_user.id, user_role::public.app_role, now(), now())
    ON CONFLICT (user_id, role) DO NOTHING;
    
    -- Retornar resultado
    user_id := missing_user.id;
    email := missing_user.email;
    action := 'profile_created';
    RETURN NEXT;
  END LOOP;
  
  RETURN;
END;
$function$;

-- Executar a função para corrigir usuários existentes sem perfil
SELECT * FROM public.create_missing_profiles();