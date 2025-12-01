-- Recriar função set_user_module_roles com assinatura compatível e UPSERT
CREATE OR REPLACE FUNCTION public.set_user_module_roles(
  _admin_id uuid,
  _user_id uuid,
  _module_id uuid,
  _roles public.app_role[]
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_slug text;
  v_role app_role;
BEGIN
  -- Verificar se é admin
  IF NOT public.has_role(_admin_id, 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Only admins can set user module roles';
  END IF;
  
  -- Bloquear alterações para o módulo Startup HUB
  SELECT slug INTO v_slug FROM public.system_modules WHERE id = _module_id;
  IF v_slug = 'startup-hub' THEN
    RETURN false;
  END IF;
  
  -- Se array vazio, desativar a role
  IF array_length(_roles, 1) IS NULL OR array_length(_roles, 1) = 0 THEN
    UPDATE user_module_roles 
    SET active = false, updated_at = now() 
    WHERE user_id = _user_id AND module_id = _module_id;
    RETURN true;
  END IF;
  
  -- Pegar primeira role do array (o sistema agora usa uma role por módulo)
  v_role := _roles[1];
  
  -- UPSERT: insere ou atualiza
  INSERT INTO user_module_roles (user_id, module_id, role, active, created_at, updated_at)
  VALUES (_user_id, _module_id, v_role, true, now(), now())
  ON CONFLICT (user_id, module_id)
  DO UPDATE SET
    role = EXCLUDED.role,
    active = true,
    updated_at = now();
    
  RETURN true;
END;
$$;