-- Remove approval columns from profiles table
ALTER TABLE public.profiles DROP COLUMN IF EXISTS approved_by;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS approved_at;

-- Update existing functions to remove approval logic
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

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error e continue sem falhar
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$function$;

-- Update activate_user function to remove approval logic
CREATE OR REPLACE FUNCTION public.activate_user(_user_id uuid, _admin_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Verificar se o admin tem permissão
  IF NOT public.has_role(_admin_id, 'admin') THEN
    RAISE EXCEPTION 'Apenas administradores podem reativar usuários';
  END IF;

  -- Atualizar status na tabela profiles
  UPDATE public.profiles 
  SET 
    status = 'active',
    updated_at = now()
  WHERE user_id = _user_id;

  RETURN TRUE;
END;
$function$;

-- Update update_user_role function to remove approval logic
CREATE OR REPLACE FUNCTION public.update_user_role(_user_id uuid, _new_role app_role, _admin_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Verificar se o admin tem permissão
  IF NOT public.has_role(_admin_id, 'admin') THEN
    RAISE EXCEPTION 'Apenas administradores podem alterar roles de usuários';
  END IF;

  -- Atualizar o role na tabela profiles
  UPDATE public.profiles 
  SET 
    role = _new_role,
    updated_at = now()
  WHERE user_id = _user_id;

  -- Atualizar ou inserir na tabela user_roles
  INSERT INTO public.user_roles (user_id, role, created_at, updated_at)
  VALUES (_user_id, _new_role, now(), now())
  ON CONFLICT (user_id, role) DO UPDATE SET
    updated_at = now();

  -- Remover roles antigos se necessário
  DELETE FROM public.user_roles 
  WHERE user_id = _user_id AND role != _new_role;

  RETURN TRUE;
END;
$function$;