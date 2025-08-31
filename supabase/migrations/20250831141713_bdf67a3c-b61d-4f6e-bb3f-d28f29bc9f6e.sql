-- Create RPC function to create startup company with automatic relations
CREATE OR REPLACE FUNCTION public.create_startup_company(
  _name text,
  _mission text DEFAULT NULL,
  _vision text DEFAULT NULL,
  _values text[] DEFAULT NULL,
  _logo_url text DEFAULT NULL,
  _owner_id uuid DEFAULT auth.uid()
)
RETURNS TABLE(company_id uuid, success boolean, message text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  new_company_id uuid;
  existing_profile_count integer;
BEGIN
  -- Verificar se o usuário é admin
  IF NOT public.has_role(_owner_id, 'admin'::app_role) THEN
    RETURN QUERY SELECT NULL::uuid, FALSE, 'Apenas administradores podem criar empresas startup';
    RETURN;
  END IF;

  -- Criar a empresa startup
  INSERT INTO public.companies (
    name, 
    mission, 
    vision, 
    values, 
    logo_url, 
    owner_id, 
    company_type, 
    status
  )
  VALUES (
    _name, 
    _mission, 
    _vision, 
    _values, 
    _logo_url, 
    _owner_id, 
    'startup'::company_type, 
    'active'
  )
  RETURNING id INTO new_company_id;

  -- Criar relação user_company para o owner
  INSERT INTO public.user_company_relations (
    user_id, 
    company_id, 
    role
  )
  VALUES (_owner_id, new_company_id, 'admin')
  ON CONFLICT (user_id, company_id) DO UPDATE SET
    role = 'admin',
    updated_at = now();

  -- Verificar se o owner tem perfil startup_hub
  SELECT COUNT(*) INTO existing_profile_count
  FROM public.startup_hub_profiles 
  WHERE user_id = _owner_id AND status = 'active';

  -- Se não tem perfil startup, criar um
  IF existing_profile_count = 0 THEN
    INSERT INTO public.startup_hub_profiles (
      user_id, 
      type, 
      status
    )
    VALUES (_owner_id, 'startup'::startup_hub_profile_type, 'active')
    ON CONFLICT (user_id) DO UPDATE SET
      type = 'startup'::startup_hub_profile_type,
      status = 'active',
      updated_at = now();
  END IF;

  -- Retornar sucesso
  RETURN QUERY SELECT new_company_id, TRUE, 'Empresa startup criada com sucesso';
  RETURN;

EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT NULL::uuid, FALSE, SQLERRM;
    RETURN;
END;
$function$;