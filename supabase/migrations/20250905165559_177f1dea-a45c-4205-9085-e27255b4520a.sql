-- Fix the handle_new_user function to resolve user_id ambiguity and improve error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  user_count INTEGER := 0;
  user_role TEXT := 'member';
  user_status TEXT := 'inactive';
  admin_notification_result TEXT;
BEGIN
  -- Determinar role baseado no email (com qualificação explícita da tabela)
  IF NEW.email = 'admin@example.com' OR NEW.email = 'diego@cofound.com.br' THEN
    user_role := 'admin';
    user_status := 'active'; -- Admins hardcoded sempre ativos
  ELSE
    -- Contar usuários existentes para determinar se é primeiro (com qualificação explícita)
    SELECT COUNT(*) INTO user_count FROM public.profiles p WHERE p.user_id IS NOT NULL;
    IF user_count = 0 THEN
      user_role := 'admin'; -- Primeiro usuário é sempre admin
      user_status := 'active'; -- E ativo
    ELSE
      user_role := 'member';
      user_status := 'inactive'; -- Novos usuários ficam inativos aguardando aprovação
    END IF;
  END IF;

  -- Inserir perfil com status apropriado (com qualificação explícita)
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

  -- Inserir na tabela user_roles (com qualificação explícita)
  INSERT INTO public.user_roles (user_id, role, created_at, updated_at)
  VALUES (NEW.id, user_role::public.app_role, now(), now())
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Se usuário ficou inativo, tentar notificar admin (com tratamento robusto de erro)
  IF user_status = 'inactive' THEN
    BEGIN
      -- Chamar edge function para notificar admin sobre novo usuário
      -- Usando net.http_post com dados estruturados adequadamente
      SELECT net.http_post(
        url := 'https://pdpzxjlnaqwlyqoyoyhr.supabase.co/functions/v1/notify-admin-new-user',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key', true) || '"}'::jsonb,
        body := jsonb_build_object(
          'userId', NEW.id::text,
          'email', NEW.email,
          'firstName', COALESCE(NEW.raw_user_meta_data ->> 'first_name', split_part(NEW.email, '@', 1)),
          'lastName', COALESCE(NEW.raw_user_meta_data ->> 'last_name', 'User')
        )
      ) INTO admin_notification_result;
      
      -- Log sucesso da notificação
      RAISE LOG 'Admin notification sent successfully for user: %', NEW.email;
      
    EXCEPTION
      WHEN OTHERS THEN
        -- Log erro mas não falha a criação do usuário
        RAISE LOG 'Error calling notify-admin-new-user function: %, SQLSTATE: %, Details: %', 
          SQLERRM, SQLSTATE, admin_notification_result;
        -- Continue sem falhar
    END;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error mas continue sem falhar a criação do usuário
    RAISE LOG 'Error in handle_new_user trigger: %, SQLSTATE: %', SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$function$;