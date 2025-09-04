-- Atualizar função handle_new_user para deixar novos usuários como inactive
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_count INTEGER := 0;
  user_role TEXT := 'member';
  user_status TEXT := 'inactive'; -- Mudança: padrão agora é inactive
BEGIN
  -- Determinar role baseado no email
  IF NEW.email = 'admin@example.com' OR NEW.email = 'diego@cofound.com.br' THEN
    user_role := 'admin';
    user_status := 'active'; -- Admins hardcoded sempre ativos
  ELSE
    -- Contar usuários existentes para determinar se é primeiro
    SELECT COUNT(*) INTO user_count FROM public.profiles;
    IF user_count = 0 THEN
      user_role := 'admin'; -- Primeiro usuário é sempre admin
      user_status := 'active'; -- E ativo
    ELSE
      user_role := 'member';
      user_status := 'inactive'; -- Novos usuários ficam inativos aguardando aprovação
    END IF;
  END IF;

  -- Inserir perfil com status inactive por padrão (exceto admins)
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
    user_status,
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
$function$;

-- Inserir configuração para email de notificação do admin
INSERT INTO public.system_settings (key, value, description, category, created_at, updated_at)
VALUES (
  'admin_notification_email',
  '',
  'E-mail que receberá notificações quando novos usuários se cadastrarem e precisarem de aprovação',
  'notifications',
  now(),
  now()
)
ON CONFLICT (key) DO UPDATE SET
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  updated_at = now();