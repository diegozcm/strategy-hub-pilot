-- Drop and recreate the function with correct types
DROP FUNCTION IF EXISTS public.find_compatible_replacement_users(uuid, uuid);

CREATE OR REPLACE FUNCTION public.find_compatible_replacement_users(_user_id uuid, _admin_id uuid)
RETURNS TABLE(
  user_id uuid, 
  first_name varchar, 
  last_name varchar, 
  email varchar, 
  role app_role, 
  compatibility_score integer, 
  compatibility_details json
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  target_user_roles app_role[];
  target_user_modules uuid[];
  target_companies uuid[];
  target_startup_profile startup_hub_profile_type;
BEGIN
  -- Verify admin permission
  IF NOT has_role(_admin_id, 'admin'::app_role) THEN
    RAISE EXCEPTION 'Apenas administradores podem buscar usuários compatíveis';
  END IF;

  -- Don't allow deletion of the target user if they're the last admin
  IF has_role(_user_id, 'admin'::app_role) THEN
    IF (SELECT count(*) FROM profiles WHERE role = 'admin'::app_role AND status = 'active') <= 1 THEN
      RAISE EXCEPTION 'Não é possível excluir o último administrador do sistema';
    END IF;
  END IF;

  -- Get target user's roles and access
  SELECT ARRAY[p.role] INTO target_user_roles
  FROM profiles p WHERE p.user_id = _user_id;

  -- Get target user's modules (handle null case)
  SELECT COALESCE(array_agg(um.module_id), ARRAY[]::uuid[]) INTO target_user_modules
  FROM user_modules um 
  WHERE um.user_id = _user_id AND um.active = true;

  -- Get target user's companies (handle null case)
  SELECT COALESCE(array_agg(ucr.company_id), ARRAY[]::uuid[]) INTO target_companies
  FROM user_company_relations ucr 
  WHERE ucr.user_id = _user_id;

  -- Get target user's startup hub profile
  SELECT shp.type INTO target_startup_profile
  FROM startup_hub_profiles shp 
  WHERE shp.user_id = _user_id AND shp.status = 'active';

  -- Find compatible users
  RETURN QUERY
  SELECT 
    p.user_id,
    p.first_name,
    p.last_name,
    p.email,
    p.role,
    (
      -- Base role compatibility (40 points)
      CASE WHEN p.role = ANY(COALESCE(target_user_roles, ARRAY[]::app_role[])) THEN 40 ELSE 0 END +
      -- Module compatibility (30 points)
      CASE WHEN array_length(target_user_modules, 1) IS NULL OR (
        SELECT count(*) 
        FROM user_modules um2 
        WHERE um2.user_id = p.user_id 
          AND um2.module_id = ANY(target_user_modules) 
          AND um2.active = true
      ) >= array_length(target_user_modules, 1) THEN 30 ELSE 0 END +
      -- Company access compatibility (20 points)
      CASE WHEN array_length(target_companies, 1) IS NULL OR (
        SELECT count(*) 
        FROM user_company_relations ucr2 
        WHERE ucr2.user_id = p.user_id 
          AND ucr2.company_id = ANY(target_companies)
      ) >= array_length(target_companies, 1) THEN 20 ELSE 0 END +
      -- Startup hub profile compatibility (10 points)
      CASE WHEN (
        target_startup_profile IS NULL OR
        EXISTS (
          SELECT 1 FROM startup_hub_profiles shp2 
          WHERE shp2.user_id = p.user_id 
            AND shp2.type = target_startup_profile 
            AND shp2.status = 'active'
        )
      ) THEN 10 ELSE 0 END
    )::integer as compatibility_score,
    json_build_object(
      'has_same_role', p.role = ANY(COALESCE(target_user_roles, ARRAY[]::app_role[])),
      'compatible_modules', (
        SELECT COALESCE(array_agg(um.module_id), ARRAY[]::uuid[])
        FROM user_modules um 
        WHERE um.user_id = p.user_id 
          AND (array_length(target_user_modules, 1) IS NULL OR um.module_id = ANY(target_user_modules))
          AND um.active = true
      ),
      'shared_companies', (
        SELECT COALESCE(array_agg(ucr.company_id), ARRAY[]::uuid[])
        FROM user_company_relations ucr 
        WHERE ucr.user_id = p.user_id 
          AND (array_length(target_companies, 1) IS NULL OR ucr.company_id = ANY(target_companies))
      ),
      'startup_profile_match', (
        SELECT shp.type 
        FROM startup_hub_profiles shp 
        WHERE shp.user_id = p.user_id 
          AND shp.type = target_startup_profile 
          AND shp.status = 'active'
      )
    ) as compatibility_details
  FROM profiles p
  WHERE p.user_id != _user_id 
    AND p.user_id != _admin_id
    AND p.status = 'active'
    -- Show users with at least 30% compatibility (lowered threshold)
    AND (
      CASE WHEN p.role = ANY(COALESCE(target_user_roles, ARRAY[]::app_role[])) THEN 40 ELSE 0 END +
      CASE WHEN array_length(target_user_modules, 1) IS NULL OR (
        SELECT count(*) 
        FROM user_modules um2 
        WHERE um2.user_id = p.user_id 
          AND um2.module_id = ANY(target_user_modules) 
          AND um2.active = true
      ) >= array_length(target_user_modules, 1) THEN 30 ELSE 0 END +
      CASE WHEN array_length(target_companies, 1) IS NULL OR (
        SELECT count(*) 
        FROM user_company_relations ucr2 
        WHERE ucr2.user_id = p.user_id 
          AND ucr2.company_id = ANY(target_companies)
      ) >= array_length(target_companies, 1) THEN 20 ELSE 0 END +
      CASE WHEN (
        target_startup_profile IS NULL OR
        EXISTS (
          SELECT 1 FROM startup_hub_profiles shp2 
          WHERE shp2.user_id = p.user_id 
            AND shp2.type = target_startup_profile 
            AND shp2.status = 'active'
        )
      ) THEN 10 ELSE 0 END
    ) >= 30
  ORDER BY compatibility_score DESC, p.first_name, p.last_name;
END;
$function$;