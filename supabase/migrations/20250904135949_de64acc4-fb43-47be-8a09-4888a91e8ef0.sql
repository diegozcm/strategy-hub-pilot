-- Função para admin confirmar e-mail de usuário manualmente
CREATE OR REPLACE FUNCTION public.confirm_user_email(_user_id uuid, _admin_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Verificar se o admin tem permissão
  IF NOT public.has_role(_admin_id, 'admin'::app_role) THEN
    RAISE EXCEPTION 'Apenas administradores podem confirmar e-mails de usuários';
  END IF;

  -- Confirmar e-mail no auth.users
  UPDATE auth.users 
  SET 
    email_confirmed_at = now(),
    updated_at = now()
  WHERE id = _user_id;

  RETURN TRUE;
END;
$function$;