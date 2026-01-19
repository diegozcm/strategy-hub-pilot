-- Fix configure_user_profile to not use removed 'role' column from user_company_relations
CREATE OR REPLACE FUNCTION public.configure_user_profile(
  _admin_id uuid,
  _user_id uuid,
  _email text,
  _first_name text,
  _last_name text,
  _phone text DEFAULT NULL,
  _position text DEFAULT NULL,
  _department text DEFAULT NULL,
  _role app_role DEFAULT 'member'::app_role,
  _company_id uuid DEFAULT NULL
)
RETURNS TABLE(success boolean, message text, debug_log text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  debug_msg text := '';
BEGIN
  debug_msg := 'Starting profile configuration for user: ' || _user_id::text;
  
  -- Verify admin has permission
  IF NOT public.has_role(_admin_id, 'admin'::app_role) THEN
    RETURN QUERY SELECT FALSE, 'Apenas administradores podem configurar perfis', debug_msg;
    RETURN;
  END IF;

  debug_msg := debug_msg || ' | Admin verified';

  BEGIN
    -- Update the profile created by the trigger with admin-specific data
    UPDATE public.profiles 
    SET 
      first_name = _first_name,
      last_name = _last_name,
      email = _email,
      phone = _phone,
      position = _position,
      department = _department,
      role = _role,
      status = 'active',
      company_id = _company_id,
      must_change_password = TRUE,
      created_by_admin = _admin_id,
      updated_at = NOW()
    WHERE profiles.user_id = _user_id;

    debug_msg := debug_msg || ' | Profile updated';

    -- Create user role if it doesn't exist
    INSERT INTO public.user_roles (user_id, role, created_at, updated_at)
    VALUES (_user_id, _role, NOW(), NOW())
    ON CONFLICT (user_id, role) DO NOTHING;

    debug_msg := debug_msg || ' | User role created';

    -- Create company relation if company_id provided (role column was removed)
    IF _company_id IS NOT NULL THEN
      INSERT INTO public.user_company_relations (user_id, company_id, created_at, updated_at)
      VALUES (_user_id, _company_id, NOW(), NOW())
      ON CONFLICT (user_id, company_id) DO UPDATE SET
        updated_at = NOW();
      
      debug_msg := debug_msg || ' | Company relation created';
    END IF;

    debug_msg := debug_msg || ' | Profile configuration completed successfully';
    RETURN QUERY SELECT TRUE, 'Perfil configurado com sucesso', debug_msg;

  EXCEPTION
    WHEN OTHERS THEN
      debug_msg := debug_msg || ' | ERROR: ' || SQLERRM;
      RETURN QUERY SELECT FALSE, 'Erro na configuração do perfil: ' || SQLERRM, debug_msg;
      RETURN;
  END;
END;
$function$;