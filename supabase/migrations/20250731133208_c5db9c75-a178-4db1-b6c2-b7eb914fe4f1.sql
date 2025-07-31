-- Corrigir a função que tinha ambiguidade no nome da coluna
CREATE OR REPLACE FUNCTION public.create_missing_profiles()
RETURNS TABLE(missing_user_id uuid, missing_email text, action text)
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
    
    -- Inserir role (especificando explicitamente a tabela)
    INSERT INTO public.user_roles (user_id, role, created_at, updated_at)
    VALUES (missing_user.id, user_role::public.app_role, now(), now())
    ON CONFLICT (public.user_roles.user_id, public.user_roles.role) DO NOTHING;
    
    -- Retornar resultado
    missing_user_id := missing_user.id;
    missing_email := missing_user.email;
    action := 'profile_created';
    RETURN NEXT;
  END LOOP;
  
  RETURN;
END;
$function$;

-- Executar a função para corrigir usuários existentes sem perfil
SELECT * FROM public.create_missing_profiles();