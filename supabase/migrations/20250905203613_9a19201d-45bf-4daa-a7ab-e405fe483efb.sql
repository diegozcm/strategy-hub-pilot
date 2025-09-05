-- Remove problematic duplicate RLS policy from profiles table that causes ambiguity
-- This policy should only exist on startup_hub_profiles table, not on profiles

-- First, check if the duplicate policy exists and remove it
DROP POLICY IF EXISTS "Startups can view their assigned mentors profiles" ON public.profiles;

-- Also ensure we don't have any other ambiguous policies on profiles table
-- Check for any policies that might reference user_id ambiguously

-- Create a simplified, more robust user creation function
CREATE OR REPLACE FUNCTION public.create_user_by_admin_v2(
  _admin_id uuid,
  _email text,
  _password text,
  _first_name text,
  _last_name text,
  _phone text DEFAULT NULL,
  _position text DEFAULT NULL,
  _department text DEFAULT NULL,
  _role app_role DEFAULT 'member'::app_role,
  _company_id uuid DEFAULT NULL
)
RETURNS TABLE(success boolean, user_id uuid, message text, debug_log text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_user_id UUID;
  debug_msg TEXT := '';
BEGIN
  debug_msg := 'Starting user creation by admin: ' || _admin_id::text;
  
  -- Verify admin has permission
  IF NOT public.has_role(_admin_id, 'admin'::app_role) THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 'Apenas administradores podem criar usuários', debug_msg;
    RETURN;
  END IF;

  debug_msg := debug_msg || ' | Admin verified';

  -- Start transaction block
  BEGIN
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

    debug_msg := debug_msg || ' | Auth user created: ' || new_user_id::text;

    -- Wait a moment for trigger to create profile
    PERFORM pg_sleep(0.1);

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

    debug_msg := debug_msg || ' | Profile updated';

    -- Create user role if it doesn't exist
    INSERT INTO public.user_roles (user_id, role, created_at, updated_at)
    VALUES (new_user_id, _role, NOW(), NOW())
    ON CONFLICT (user_id, role) DO NOTHING;

    debug_msg := debug_msg || ' | User role created';

    -- Create company relation if company_id provided
    IF _company_id IS NOT NULL THEN
      INSERT INTO public.user_company_relations (user_id, company_id, role, created_at, updated_at)
      VALUES (new_user_id, _company_id, _role::VARCHAR, NOW(), NOW())
      ON CONFLICT (user_id, company_id) DO UPDATE SET
        role = _role::VARCHAR,
        updated_at = NOW();
      
      debug_msg := debug_msg || ' | Company relation created';
    END IF;

    debug_msg := debug_msg || ' | Success - User creation completed';
    RETURN QUERY SELECT TRUE, new_user_id, 'Usuário criado com sucesso', debug_msg;

  EXCEPTION
    WHEN OTHERS THEN
      debug_msg := debug_msg || ' | ERROR: ' || SQLERRM;
      RETURN QUERY SELECT FALSE, NULL::UUID, 'Erro na criação do usuário: ' || SQLERRM, debug_msg;
      RETURN;
  END;
END;
$$;

-- Create helper function for configuring user modules (separate from user creation)
CREATE OR REPLACE FUNCTION public.configure_user_modules(
  _admin_id uuid,
  _user_id uuid,
  _module_ids uuid[],
  _module_roles jsonb DEFAULT '{}'::jsonb,
  _startup_hub_options jsonb DEFAULT '{}'::jsonb
)
RETURNS TABLE(success boolean, message text, debug_log text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  module_id uuid;
  debug_msg text := '';
BEGIN
  debug_msg := 'Starting module configuration for user: ' || _user_id::text;
  
  -- Verify admin has permission
  IF NOT public.has_role(_admin_id, 'admin'::app_role) THEN
    RETURN QUERY SELECT FALSE, 'Apenas administradores podem configurar módulos', debug_msg;
    RETURN;
  END IF;

  -- Grant access to each module
  FOREACH module_id IN ARRAY _module_ids
  LOOP
    -- Grant module access
    PERFORM public.grant_module_access(_admin_id, _user_id, module_id);
    debug_msg := debug_msg || ' | Module access granted: ' || module_id::text;
    
    -- Configure roles for non-startup-hub modules
    IF NOT EXISTS (
      SELECT 1 FROM public.system_modules sm 
      WHERE sm.id = module_id AND sm.slug = 'startup-hub'
    ) THEN
      -- Set module roles if provided
      IF _module_roles ? module_id::text THEN
        PERFORM public.set_user_module_roles(
          _admin_id, 
          _user_id, 
          module_id, 
          ARRAY(SELECT jsonb_array_elements_text(_module_roles->module_id::text))::app_role[]
        );
        debug_msg := debug_msg || ' | Module roles configured for: ' || module_id::text;
      END IF;
    END IF;
  END LOOP;

  -- Handle startup-hub specific configuration
  IF EXISTS (
    SELECT 1 FROM public.system_modules sm 
    JOIN unnest(_module_ids) AS mid(id) ON sm.id = mid.id
    WHERE sm.slug = 'startup-hub'
  ) THEN
    -- Configure startup hub profile if options provided
    IF _startup_hub_options ? 'type' THEN
      INSERT INTO public.startup_hub_profiles (user_id, type, status)
      VALUES (
        _user_id, 
        (_startup_hub_options->>'type')::startup_hub_profile_type, 
        'active'
      )
      ON CONFLICT (user_id) DO UPDATE SET
        type = (_startup_hub_options->>'type')::startup_hub_profile_type,
        status = 'active',
        updated_at = NOW();
      
      debug_msg := debug_msg || ' | Startup hub profile configured';
    END IF;
  END IF;

  debug_msg := debug_msg || ' | Module configuration completed successfully';
  RETURN QUERY SELECT TRUE, 'Módulos configurados com sucesso', debug_msg;

EXCEPTION
  WHEN OTHERS THEN
    debug_msg := debug_msg || ' | ERROR: ' || SQLERRM;
    RETURN QUERY SELECT FALSE, 'Erro na configuração dos módulos: ' || SQLERRM, debug_msg;
END;
$$;