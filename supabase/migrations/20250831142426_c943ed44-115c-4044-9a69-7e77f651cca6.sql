-- Fix the ambiguous company_id error by correcting has_role function and RLS policies

-- 1. First, recreate the has_role function with proper column qualifications
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    LEFT JOIN public.companies c ON p.company_id = c.id
    WHERE p.user_id = _user_id
      AND p.role = _role
      AND p.status = 'active'
      AND (c.status IS NULL OR c.status = 'active')
  );
$function$;

-- 2. Drop and recreate the problematic RLS policy on companies table with better column qualification
DROP POLICY IF EXISTS "Users can view companies" ON public.companies;

CREATE POLICY "Users can view companies" 
ON public.companies 
FOR SELECT 
USING (
  (auth.uid() IS NOT NULL) 
  AND (
    (companies.company_type = 'regular'::company_type) 
    OR (
      (companies.company_type = 'startup'::company_type) 
      AND (EXISTS (
        SELECT 1
        FROM public.user_company_relations ucr
        WHERE ucr.company_id = companies.id 
          AND ucr.user_id = auth.uid()
      ))
    )
  )
);

-- 3. Update create_startup_company function to be more explicit and avoid policy conflicts
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
  -- Verificar se o usuário é admin usando a função corrigida
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
  FROM public.startup_hub_profiles shp
  WHERE shp.user_id = _owner_id AND shp.status = 'active';

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