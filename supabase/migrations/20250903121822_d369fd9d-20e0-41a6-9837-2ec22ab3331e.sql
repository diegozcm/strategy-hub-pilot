-- Update handle_new_user function to create users as active by default
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_count INTEGER := 0;
  user_role TEXT := 'member';
  user_status TEXT := 'active'; -- Change default to active
BEGIN
  -- Determinar role baseado no email
  IF NEW.email = 'admin@example.com' OR NEW.email = 'diego@cofound.com.br' THEN
    user_role := 'admin';
    user_status := 'active'; -- Admins sempre ativos
  ELSE
    -- Contar usuários existentes para determinar se é primeiro
    SELECT COUNT(*) INTO user_count FROM public.profiles;
    IF user_count = 0 THEN
      user_role := 'admin'; -- Primeiro usuário é sempre admin
      user_status := 'active'; -- E ativo
    ELSE
      user_role := 'member';
      user_status := 'active'; -- Novos usuários agora vêm ativos por padrão
    END IF;
  END IF;

  -- Inserir perfil com status ativo por padrão
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
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', 'User'),
    NEW.email,
    user_role::public.app_role,
    user_status, -- Usar status ativo
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
    -- Log error mas continue sem falhar
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$;