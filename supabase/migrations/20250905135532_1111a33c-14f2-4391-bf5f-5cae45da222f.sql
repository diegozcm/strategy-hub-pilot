-- Add new fields to profiles table for admin user creation
ALTER TABLE public.profiles 
ADD COLUMN must_change_password BOOLEAN DEFAULT FALSE,
ADD COLUMN created_by_admin UUID REFERENCES auth.users(id),
ADD COLUMN first_login_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN password_changed_at TIMESTAMP WITH TIME ZONE;

-- Create function to generate temporary password
CREATE OR REPLACE FUNCTION public.generate_temporary_password()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- Create function for admin to create users
CREATE OR REPLACE FUNCTION public.create_user_by_admin(
  _admin_id UUID,
  _email TEXT,
  _password TEXT,
  _first_name TEXT,
  _last_name TEXT,
  _phone TEXT DEFAULT NULL,
  _position TEXT DEFAULT NULL,
  _department TEXT DEFAULT NULL,
  _role app_role DEFAULT 'member',
  _company_id UUID DEFAULT NULL
)
RETURNS TABLE(success BOOLEAN, user_id UUID, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
    recovery_sent_at,
    last_sign_in_at,
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
    NOW(),
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

  -- Create profile
  INSERT INTO public.profiles (
    user_id,
    first_name,
    last_name,
    email,
    phone,
    position,
    department,
    role,
    status,
    company_id,
    must_change_password,
    created_by_admin,
    created_at,
    updated_at
  ) VALUES (
    new_user_id,
    _first_name,
    _last_name,
    _email,
    _phone,
    _position,
    _department,
    _role,
    'active',
    _company_id,
    TRUE,
    _admin_id,
    NOW(),
    NOW()
  );

  -- Create user role
  INSERT INTO public.user_roles (user_id, role, created_at, updated_at)
  VALUES (new_user_id, _role, NOW(), NOW());

  -- Create company relation if company_id provided
  IF _company_id IS NOT NULL THEN
    INSERT INTO public.user_company_relations (user_id, company_id, role, created_at, updated_at)
    VALUES (new_user_id, _company_id, _role::VARCHAR, NOW(), NOW());
  END IF;

  RETURN QUERY SELECT TRUE, new_user_id, 'Usuário criado com sucesso';
END;
$$;