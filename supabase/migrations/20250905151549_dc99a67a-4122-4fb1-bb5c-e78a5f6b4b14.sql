-- Fix ambiguous column reference in create_user_by_admin function
CREATE OR REPLACE FUNCTION public.create_user_by_admin(
  _admin_id uuid, 
  _email text, 
  _password text, 
  _first_name text, 
  _last_name text, 
  _phone text DEFAULT NULL::text, 
  _position text DEFAULT NULL::text, 
  _department text DEFAULT NULL::text, 
  _role app_role DEFAULT 'member'::app_role, 
  _company_id uuid DEFAULT NULL::uuid
)
RETURNS TABLE(success boolean, user_id uuid, message text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  new_user_id UUID;
BEGIN
  -- Verify admin has permission
  IF NOT public.has_role(_admin_id, 'admin'::app_role) THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 'Apenas administradores podem criar usuários';
    RETURN;
  END IF;

  -- Create auth user
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    _email,
    crypt(_password, gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('first_name', _first_name, 'last_name', _last_name),
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  ) RETURNING id INTO new_user_id;

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
  WHERE profiles.user_id = new_user_id;

  -- Create user role with explicit table reference
  INSERT INTO public.user_roles (user_id, role, created_at, updated_at)
  VALUES (new_user_id, _role, NOW(), NOW())
  ON CONFLICT (user_roles.user_id, user_roles.role) DO NOTHING;

  -- Create company relation if company_id provided with explicit table references
  IF _company_id IS NOT NULL THEN
    INSERT INTO public.user_company_relations (user_id, company_id, role, created_at, updated_at)
    VALUES (new_user_id, _company_id, _role::VARCHAR, NOW(), NOW())
    ON CONFLICT (user_company_relations.user_id, user_company_relations.company_id) DO UPDATE SET
      role = _role::VARCHAR,
      updated_at = NOW();
  END IF;

  RETURN QUERY SELECT TRUE, new_user_id, 'Usuário criado com sucesso';
END;
$function$;