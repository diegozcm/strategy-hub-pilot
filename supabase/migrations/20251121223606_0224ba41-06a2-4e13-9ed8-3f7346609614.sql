-- ================================================
-- FIX FUNCTION SEARCH PATH WARNINGS
-- Adding SET search_path = public to all remaining functions
-- ================================================

-- 1. get_user_modules
CREATE OR REPLACE FUNCTION public.get_user_modules(_user_id uuid)
 RETURNS TABLE(module_id uuid, name character varying, slug character varying, description text, icon character varying)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $function$
  SELECT sm.id, sm.name, sm.slug, sm.description, sm.icon
  FROM public.system_modules sm
  INNER JOIN public.user_modules um ON sm.id = um.module_id
  WHERE um.user_id = _user_id 
    AND um.active = true 
    AND sm.active = true;
$function$;

-- 2. grant_module_access
CREATE OR REPLACE FUNCTION public.grant_module_access(_admin_id uuid, _user_id uuid, _module_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  IF NOT public.has_role(_admin_id, 'admin') THEN
    RAISE EXCEPTION 'Apenas administradores podem conceder acesso a módulos';
  END IF;

  INSERT INTO public.user_modules (user_id, module_id, granted_by, active)
  VALUES (_user_id, _module_id, _admin_id, true)
  ON CONFLICT (user_id, module_id) DO UPDATE SET
    active = true,
    granted_by = _admin_id,
    granted_at = now(),
    updated_at = now();

  RETURN TRUE;
END;
$function$;

-- 3. generate_temporary_password
CREATE OR REPLACE FUNCTION public.generate_temporary_password()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
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
$function$;

-- 4. revoke_module_access
CREATE OR REPLACE FUNCTION public.revoke_module_access(_admin_id uuid, _user_id uuid, _module_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  IF NOT public.has_role(_admin_id, 'admin') THEN
    RAISE EXCEPTION 'Apenas administradores podem revogar acesso a módulos';
  END IF;

  UPDATE public.user_modules 
  SET active = false, updated_at = now()
  WHERE user_id = _user_id AND module_id = _module_id;

  RETURN TRUE;
END;
$function$;

-- 5. switch_user_module
CREATE OR REPLACE FUNCTION public.switch_user_module(_user_id uuid, _module_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  IF NOT EXISTS(
    SELECT 1 FROM public.user_modules 
    WHERE user_id = _user_id AND module_id = _module_id AND active = true
  ) THEN
    RAISE EXCEPTION 'Usuário não tem acesso a este módulo';
  END IF;

  UPDATE public.profiles 
  SET current_module_id = _module_id, updated_at = now()
  WHERE user_id = _user_id;

  RETURN TRUE;
END;
$function$;

-- 6. get_user_startup_company
CREATE OR REPLACE FUNCTION public.get_user_startup_company(_user_id uuid)
 RETURNS TABLE(id uuid, name character varying, mission text, vision text, company_values text[], logo_url text, website text, created_at timestamp with time zone, updated_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $function$
  SELECT c.id, c.name, c.mission, c.vision, c.values as company_values, c.logo_url, 
         null::text as website, c.created_at, c.updated_at
  FROM public.companies c
  JOIN public.user_company_relations ucr ON ucr.company_id = c.id
  WHERE ucr.user_id = _user_id 
    AND c.company_type = 'startup'
    AND c.status = 'active'
  LIMIT 1;
$function$;

-- 7. safe_delete_user
CREATE OR REPLACE FUNCTION public.safe_delete_user(_user_id uuid, _admin_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  IF NOT public.has_role(_admin_id, 'admin') THEN
    RAISE EXCEPTION 'Apenas administradores podem excluir usuários';
  END IF;

  IF _user_id = _admin_id THEN
    RAISE EXCEPTION 'Administradores não podem excluir a si mesmos';
  END IF;

  DELETE FROM public.user_company_relations WHERE user_id = _user_id;
  DELETE FROM public.user_roles WHERE user_id = _user_id;
  DELETE FROM public.profiles WHERE user_id = _user_id;
  DELETE FROM auth.users WHERE id = _user_id;

  RETURN TRUE;
END;
$function$;

-- 8. can_delete_company
CREATE OR REPLACE FUNCTION public.can_delete_company(_company_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE
 SET search_path = public
AS $function$
DECLARE
  user_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO user_count
  FROM public.user_company_relations ucr
  JOIN public.profiles p ON p.user_id = ucr.user_id
  WHERE ucr.company_id = _company_id 
    AND p.status = 'active';

  RETURN user_count = 0;
END;
$function$;

-- 9. start_impersonation
CREATE OR REPLACE FUNCTION public.start_impersonation(_admin_id uuid, _target_user_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  session_id uuid;
BEGIN
  IF NOT public.has_role(_admin_id, 'admin'::app_role) THEN
    RAISE EXCEPTION 'Apenas administradores podem fazer impersonation';
  END IF;

  IF _admin_id = _target_user_id THEN
    RAISE EXCEPTION 'Não é possível fazer impersonation de si mesmo';
  END IF;

  UPDATE public.admin_impersonation_sessions 
  SET 
    is_active = false,
    ended_at = now(),
    updated_at = now()
  WHERE admin_user_id = _admin_id AND is_active = true;

  INSERT INTO public.admin_impersonation_sessions (
    admin_user_id,
    impersonated_user_id,
    is_active
  )
  VALUES (_admin_id, _target_user_id, true)
  RETURNING id INTO session_id;

  RETURN session_id;
END;
$function$;

-- 10. end_impersonation
CREATE OR REPLACE FUNCTION public.end_impersonation(_admin_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  IF NOT public.has_role(_admin_id, 'admin'::app_role) THEN
    RAISE EXCEPTION 'Apenas administradores podem finalizar impersonation';
  END IF;

  UPDATE public.admin_impersonation_sessions 
  SET 
    is_active = false,
    ended_at = now(),
    updated_at = now()
  WHERE admin_user_id = _admin_id AND is_active = true;

  RETURN true;
END;
$function$;

-- 11. get_user_module_roles
CREATE OR REPLACE FUNCTION public.get_user_module_roles(_user_id uuid)
 RETURNS TABLE(module_id uuid, roles app_role[])
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $function$
  select umr.module_id,
         array_agg(umr.role order by umr.role) filter (where umr.active) as roles
  from public.user_module_roles umr
  where umr.user_id = _user_id
    and umr.active = true
  group by umr.module_id;
$function$;

-- 12. debug_auth_context
CREATE OR REPLACE FUNCTION public.debug_auth_context()
 RETURNS TABLE(current_user_id uuid, session_exists boolean, profile_exists boolean, profile_company_id uuid, user_company_relations_count bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    auth.uid() as current_user_id,
    (auth.uid() IS NOT NULL) as session_exists,
    EXISTS(SELECT 1 FROM profiles WHERE user_id = auth.uid()) as profile_exists,
    (SELECT company_id FROM profiles WHERE user_id = auth.uid()) as profile_company_id,
    (SELECT COUNT(*) FROM user_company_relations WHERE user_id = auth.uid()) as user_company_relations_count;
END;
$function$;

-- 13. set_user_module_roles
CREATE OR REPLACE FUNCTION public.set_user_module_roles(_admin_id uuid, _user_id uuid, _module_id uuid, _roles app_role[])
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
declare
  v_slug text;
begin
  if not public.has_role(_admin_id, 'admin'::public.app_role) then
    raise exception 'Apenas administradores podem alterar perfis por módulo';
  end if;

  select sm.slug into v_slug
  from public.system_modules sm
  where sm.id = _module_id;

  if v_slug = 'startup-hub' then
    raise exception 'Perfis por módulo (admin/manager/member) não se aplicam ao Startup HUB. Use os perfis Startup/Mentor.';
  end if;

  insert into public.user_module_roles (user_id, module_id, role, active)
  select _user_id, _module_id, r, true
  from unnest(_roles) as r
  on conflict (user_id, module_id, role) do update
    set active = true,
        updated_at = now();

  update public.user_module_roles
  set active = false,
      updated_at = now()
  where user_id = _user_id
    and module_id = _module_id
    and role not in (select * from unnest(_roles));

  return true;
end;
$function$;

-- 14. prevent_roles_for_startup_hub
CREATE OR REPLACE FUNCTION public.prevent_roles_for_startup_hub()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
declare
  v_slug text;
  v_module_id uuid;
begin
  v_module_id := coalesce(new.module_id, old.module_id);

  select sm.slug into v_slug
  from public.system_modules sm
  where sm.id = v_module_id;

  if v_slug = 'startup-hub' then
    raise exception 'Não é permitido gravar roles em user_module_roles para o módulo Startup HUB';
  end if;

  return new;
end;
$function$;

-- 15. create_missing_profiles
CREATE OR REPLACE FUNCTION public.create_missing_profiles()
 RETURNS TABLE(missing_user_id uuid, missing_email text, action text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  missing_user RECORD;
  user_role TEXT := 'member';
BEGIN
  FOR missing_user IN 
    SELECT au.id, au.email, au.raw_user_meta_data
    FROM auth.users au
    LEFT JOIN public.profiles p ON p.user_id = au.id
    WHERE p.user_id IS NULL
  LOOP
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
      missing_user.id,
      COALESCE(missing_user.raw_user_meta_data ->> 'first_name', split_part(missing_user.email, '@', 1)),
      COALESCE(missing_user.raw_user_meta_data ->> 'last_name', 'User'),
      missing_user.email,
      user_role::public.app_role,
      'active',
      now(),
      now()
    );
    
    INSERT INTO public.user_roles (user_id, role, created_at, updated_at)
    VALUES (missing_user.id, user_role::public.app_role, now(), now())
    ON CONFLICT (user_id, role) DO NOTHING;
    
    missing_user_id := missing_user.id;
    missing_email := missing_user.email;
    action := 'profile_created';
    RETURN NEXT;
  END LOOP;
  
  RETURN;
END;
$function$;

-- 16. deactivate_user
CREATE OR REPLACE FUNCTION public.deactivate_user(_user_id uuid, _admin_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  IF NOT public.has_role(_admin_id, 'admin') THEN
    RAISE EXCEPTION 'Apenas administradores podem desativar usuários';
  END IF;

  IF _user_id = _admin_id THEN
    RAISE EXCEPTION 'Administradores não podem desativar a si mesmos';
  END IF;

  UPDATE public.profiles 
  SET 
    status = 'inactive',
    updated_at = now()
  WHERE user_id = _user_id;

  RETURN TRUE;
END;
$function$;

-- 17. activate_user
CREATE OR REPLACE FUNCTION public.activate_user(_user_id uuid, _admin_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  IF NOT public.has_role(_admin_id, 'admin') THEN
    RAISE EXCEPTION 'Apenas administradores podem reativar usuários';
  END IF;

  UPDATE public.profiles 
  SET 
    status = 'active',
    updated_at = now()
  WHERE user_id = _user_id;

  RETURN TRUE;
END;
$function$;

-- 18. update_user_role
CREATE OR REPLACE FUNCTION public.update_user_role(_user_id uuid, _new_role app_role, _admin_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  IF NOT public.has_role(_admin_id, 'admin') THEN
    RAISE EXCEPTION 'Apenas administradores podem alterar roles de usuários';
  END IF;

  UPDATE public.profiles 
  SET 
    role = _new_role,
    updated_at = now()
  WHERE user_id = _user_id;

  INSERT INTO public.user_roles (user_id, role, created_at, updated_at)
  VALUES (_user_id, _new_role, now(), now())
  ON CONFLICT (user_id, role) DO UPDATE SET
    updated_at = now();

  DELETE FROM public.user_roles 
  WHERE user_id = _user_id AND role != _new_role;

  RETURN TRUE;
END;
$function$;

-- 19. create_startup_company
CREATE OR REPLACE FUNCTION public.create_startup_company(_name text, _mission text DEFAULT NULL::text, _vision text DEFAULT NULL::text, _values text[] DEFAULT NULL::text[], _logo_url text DEFAULT NULL::text, _owner_id uuid DEFAULT auth.uid())
 RETURNS TABLE(company_id uuid, success boolean, message text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  new_company_id uuid;
  existing_profile_count integer;
BEGIN
  IF NOT public.has_role(_owner_id, 'admin'::app_role) THEN
    RETURN QUERY SELECT NULL::uuid, FALSE, 'Apenas administradores podem criar empresas startup';
    RETURN;
  END IF;

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
  RETURNING companies.id INTO new_company_id;

  INSERT INTO public.user_company_relations (
    user_id, 
    company_id, 
    role
  )
  VALUES (_owner_id, new_company_id, 'admin')
  ON CONFLICT (user_id, company_id) DO UPDATE SET
    role = 'admin',
    updated_at = now();

  SELECT COUNT(*) INTO existing_profile_count
  FROM public.startup_hub_profiles shp
  WHERE shp.user_id = _owner_id AND shp.status = 'active';

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

  RETURN QUERY SELECT new_company_id, TRUE, 'Empresa startup criada com sucesso';
  RETURN;

EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT NULL::uuid, FALSE, SQLERRM;
    RETURN;
END;
$function$;

-- 20. analyze_user_relations
CREATE OR REPLACE FUNCTION public.analyze_user_relations(_user_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  result json;
  ownership_relations json;
  participation_relations json;
  creation_relations json;
  assignment_relations json;
  mentoring_relations json;
BEGIN
  SELECT json_build_object(
    'companies', (
      SELECT json_agg(json_build_object('id', id, 'name', name, 'type', company_type))
      FROM companies WHERE owner_id = _user_id
    ),
    'strategic_projects', (
      SELECT count(*) FROM strategic_projects WHERE owner_id = _user_id
    ),
    'strategic_objectives', (
      SELECT count(*) FROM strategic_objectives WHERE owner_id = _user_id
    ),
    'key_results', (
      SELECT count(*) FROM key_results WHERE owner_id = _user_id
    )
  ) INTO ownership_relations;

  SELECT json_build_object(
    'company_relations', (
      SELECT json_agg(json_build_object('company_id', company_id, 'role', role))
      FROM user_company_relations WHERE user_id = _user_id
    ),
    'project_members', (
      SELECT count(*) FROM project_members WHERE user_id = _user_id
    ),
    'user_modules', (
      SELECT json_agg(json_build_object('module_id', module_id, 'active', active))
      FROM user_modules WHERE user_id = _user_id AND active = true
    )
  ) INTO participation_relations;

  SELECT json_build_object(
    'golden_circle', (
      SELECT count(*) FROM golden_circle WHERE created_by = _user_id OR updated_by = _user_id
    ),
    'swot_analysis', (
      SELECT count(*) FROM swot_analysis WHERE created_by = _user_id OR updated_by = _user_id
    ),
    'system_settings', (
      SELECT count(*) FROM system_settings WHERE created_by = _user_id OR updated_by = _user_id
    )
  ) INTO creation_relations;

  SELECT json_build_object(
    'action_items', (
      SELECT count(*) FROM action_items WHERE assigned_to = _user_id AND status != 'completed'
    ),
    'ai_recommendations', (
      SELECT count(*) FROM ai_recommendations WHERE assigned_to = _user_id AND status != 'completed'
    ),
    'performance_reviews_as_reviewer', (
      SELECT count(*) FROM performance_reviews WHERE reviewer_id = _user_id AND status = 'draft'
    ),
    'performance_reviews_as_reviewee', (
      SELECT count(*) FROM performance_reviews WHERE user_id = _user_id
    )
  ) INTO assignment_relations;

  SELECT json_build_object(
    'mentor_sessions_historical', (
      SELECT count(*) FROM mentoring_sessions 
      WHERE mentor_id = _user_id AND status = 'completed'
    ),
    'mentor_sessions_active', (
      SELECT count(*) FROM mentoring_sessions 
      WHERE mentor_id = _user_id AND status IN ('scheduled', 'in_progress')
    ),
    'startup_relations', (
      SELECT json_agg(json_build_object('startup_company_id', startup_company_id, 'status', status))
      FROM mentor_startup_relations WHERE mentor_id = _user_id
    ),
    'startup_hub_profile', (
      SELECT json_build_object('type', type, 'status', status)
      FROM startup_hub_profiles WHERE user_id = _user_id
    )
  ) INTO mentoring_relations;

  result := json_build_object(
    'user_id', _user_id,
    'ownership', ownership_relations,
    'participation', participation_relations,
    'creation', creation_relations,
    'assignment', assignment_relations,
    'mentoring', mentoring_relations,
    'analyzed_at', now()
  );

  RETURN result;
END;
$function$;

-- 21. assign_user_to_company
CREATE OR REPLACE FUNCTION public.assign_user_to_company(_user_id uuid, _company_id uuid, _admin_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  IF NOT public.has_role(_admin_id, 'admin') THEN
    RAISE EXCEPTION 'Apenas administradores podem vincular usuários a empresas';
  END IF;

  UPDATE public.profiles 
  SET 
    company_id = _company_id,
    updated_at = now()
  WHERE user_id = _user_id;

  RETURN TRUE;
END;
$function$;

-- 22. unassign_user_from_company
CREATE OR REPLACE FUNCTION public.unassign_user_from_company(_user_id uuid, _admin_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  IF NOT public.has_role(_admin_id, 'admin') THEN
    RAISE EXCEPTION 'Apenas administradores podem desvincular usuários de empresas';
  END IF;

  UPDATE public.profiles 
  SET 
    company_id = NULL,
    updated_at = now()
  WHERE user_id = _user_id;

  RETURN TRUE;
END;
$function$;

-- 23. create_startup_company_debug
CREATE OR REPLACE FUNCTION public.create_startup_company_debug(_name text, _mission text DEFAULT NULL::text, _vision text DEFAULT NULL::text, _values text[] DEFAULT NULL::text[], _logo_url text DEFAULT NULL::text, _owner_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(company_id uuid, success boolean, message text, step_log text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  new_company_id uuid;
  existing_profile_count integer;
  step_message text := '';
BEGIN
  step_message := 'Iniciando criacao de startup';
  
  IF _owner_id IS NULL THEN
    _owner_id := auth.uid();
  END IF;

  step_message := step_message || ' | owner_id: ' || COALESCE(_owner_id::text, 'NULL');

  IF NOT public.has_role(_owner_id, 'admin'::app_role) THEN
    RETURN QUERY SELECT NULL::uuid, FALSE, 'Apenas administradores podem criar empresas startup'::text, step_message;
    RETURN;
  END IF;

  step_message := step_message || ' | Admin verificado';

  BEGIN
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
    RETURNING companies.id INTO new_company_id;
    
    step_message := step_message || ' | Empresa criada: ' || new_company_id::text;
    
  EXCEPTION
    WHEN OTHERS THEN
      step_message := step_message || ' | ERRO ao criar empresa: ' || SQLERRM;
      RETURN QUERY SELECT NULL::uuid, FALSE, 'Erro ao criar empresa: ' || SQLERRM, step_message;
      RETURN;
  END;

  BEGIN
    INSERT INTO public.user_company_relations (
      user_id, 
      company_id, 
      role
    )
    VALUES (_owner_id, new_company_id, 'admin')
    ON CONFLICT (user_id, company_id) DO UPDATE SET
      role = 'admin',
      updated_at = now();
      
    step_message := step_message || ' | Relacao user_company criada';
    
  EXCEPTION
    WHEN OTHERS THEN
      step_message := step_message || ' | ERRO ao criar relacao: ' || SQLERRM;
      RETURN QUERY SELECT new_company_id, FALSE, 'Erro ao criar relação: ' || SQLERRM, step_message;
      RETURN;
  END;

  SELECT COUNT(*) INTO existing_profile_count
  FROM public.startup_hub_profiles shp
  WHERE shp.user_id = _owner_id AND shp.status = 'active';

  step_message := step_message || ' | Perfis existentes: ' || existing_profile_count::text;

  IF existing_profile_count = 0 THEN
    BEGIN
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
        
      step_message := step_message || ' | Perfil startup criado';
      
    EXCEPTION
      WHEN OTHERS THEN
        step_message := step_message || ' | ERRO ao criar perfil: ' || SQLERRM;
        RETURN QUERY SELECT new_company_id, FALSE, 'Erro ao criar perfil: ' || SQLERRM, step_message;
        RETURN;
    END;
  END IF;

  step_message := step_message || ' | Sucesso completo';
  
  RETURN QUERY SELECT new_company_id, TRUE, 'Empresa startup criada com sucesso'::text, step_message;
  RETURN;

EXCEPTION
  WHEN OTHERS THEN
    step_message := step_message || ' | ERRO GERAL: ' || SQLERRM;
    RETURN QUERY SELECT NULL::uuid, FALSE, 'Erro geral: ' || SQLERRM, step_message;
    RETURN;
END;
$function$;

-- 24. assign_user_to_company_v2
CREATE OR REPLACE FUNCTION public.assign_user_to_company_v2(_user_id uuid, _company_id uuid, _admin_id uuid, _role character varying DEFAULT 'member'::character varying)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  IF NOT public.has_role(_admin_id, 'admin') THEN
    RAISE EXCEPTION 'Apenas administradores podem vincular usuários a empresas';
  END IF;

  INSERT INTO public.user_company_relations (user_id, company_id, role, created_at, updated_at)
  VALUES (_user_id, _company_id, _role, now(), now())
  ON CONFLICT (user_id, company_id) DO UPDATE SET
    role = _role,
    updated_at = now();

  RETURN TRUE;
END;
$function$;

-- 25. unassign_user_from_company_v2
CREATE OR REPLACE FUNCTION public.unassign_user_from_company_v2(_user_id uuid, _company_id uuid, _admin_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  IF NOT public.has_role(_admin_id, 'admin') THEN
    RAISE EXCEPTION 'Apenas administradores podem desvincular usuários de empresas';
  END IF;

  DELETE FROM public.user_company_relations
  WHERE user_id = _user_id AND company_id = _company_id;

  RETURN TRUE;
END;
$function$;

-- 26. create_startup_company_v2
CREATE OR REPLACE FUNCTION public.create_startup_company_v2(_name text, _mission text DEFAULT NULL::text, _vision text DEFAULT NULL::text, _values text[] DEFAULT NULL::text[], _logo_url text DEFAULT NULL::text, _owner_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(company_id uuid, success boolean, message text, step_log text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  new_company_id uuid;
  existing_profile_count integer;
  step_message text := '';
  relation_created boolean := false;
  profile_created boolean := false;
BEGIN
  step_message := 'Iniciando criacao de startup v2';
  
  IF _owner_id IS NULL THEN
    _owner_id := auth.uid();
  END IF;

  step_message := step_message || ' | owner_id: ' || COALESCE(_owner_id::text, 'NULL');

  IF NOT EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = _owner_id 
    AND p.role = 'admin'::app_role 
    AND p.status = 'active'
  ) THEN
    RETURN QUERY SELECT NULL::uuid, FALSE, 'Apenas administradores podem criar empresas startup'::text, step_message;
    RETURN;
  END IF;

  step_message := step_message || ' | Admin verificado';

  BEGIN
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
    
    step_message := step_message || ' | Empresa criada: ' || new_company_id::text;

    BEGIN
      INSERT INTO public.user_company_relations (
        user_id, 
        company_id, 
        role,
        created_at,
        updated_at
      )
      VALUES (_owner_id, new_company_id, 'admin', now(), now());
      
      relation_created := true;
      step_message := step_message || ' | Relacao user_company criada';
      
    EXCEPTION
      WHEN OTHERS THEN
        step_message := step_message || ' | ERRO ao criar relacao: ' || SQLERRM;
        RAISE EXCEPTION 'Erro ao criar relação user_company: %', SQLERRM;
    END;

    SELECT COUNT(*) INTO existing_profile_count
    FROM public.startup_hub_profiles shp
    WHERE shp.user_id = _owner_id AND shp.status = 'active';

    step_message := step_message || ' | Perfis existentes: ' || existing_profile_count::text;

    IF existing_profile_count = 0 THEN
      BEGIN
        INSERT INTO public.startup_hub_profiles (
          user_id, 
          type, 
          status,
          created_at,
          updated_at
        )
        VALUES (_owner_id, 'startup'::startup_hub_profile_type, 'active', now(), now());
        
        profile_created := true;
        step_message := step_message || ' | Perfil startup criado';
        
      EXCEPTION
        WHEN OTHERS THEN
          step_message := step_message || ' | ERRO ao criar perfil: ' || SQLERRM;
          RAISE EXCEPTION 'Erro ao criar perfil startup: %', SQLERRM;
      END;
    ELSE
      step_message := step_message || ' | Perfil ja existia';
    END IF;

    step_message := step_message || ' | Sucesso completo';
    
    RETURN QUERY SELECT new_company_id, TRUE, 'Empresa startup criada com sucesso'::text, step_message;
    RETURN;

  EXCEPTION
    WHEN OTHERS THEN
      step_message := step_message || ' | ROLLBACK executado - ERRO: ' || SQLERRM;
      RETURN QUERY SELECT NULL::uuid, FALSE, 'Erro na criação da startup: ' || SQLERRM, step_message;
      RETURN;
  END;
END;
$function$;

-- 27. check_startup_integrity
CREATE OR REPLACE FUNCTION public.check_startup_integrity(_company_id uuid)
 RETURNS TABLE(has_company boolean, has_relation boolean, has_profile boolean, is_complete boolean, issues text[])
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  _has_company boolean := false;
  _has_relation boolean := false;
  _has_profile boolean := false;
  _owner_id uuid;
  _issues text[] := ARRAY[]::text[];
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM public.companies c 
    WHERE c.id = _company_id 
    AND c.company_type = 'startup'
    AND c.status = 'active'
  ), c.owner_id INTO _has_company, _owner_id
  FROM public.companies c 
  WHERE c.id = _company_id;

  IF NOT _has_company THEN
    _issues := _issues || 'Empresa não encontrada ou não é startup ativa';
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM public.user_company_relations ucr
    WHERE ucr.company_id = _company_id 
    AND ucr.user_id = _owner_id
    AND ucr.role = 'admin'
  ) INTO _has_relation;

  IF NOT _has_relation THEN
    _issues := _issues || 'Relação owner-empresa não encontrada';
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM public.startup_hub_profiles shp
    WHERE shp.user_id = _owner_id 
    AND shp.type = 'startup'
    AND shp.status = 'active'
  ) INTO _has_profile;

  IF NOT _has_profile THEN
    _issues := _issues || 'Perfil startup_hub não encontrado';
  END IF;

  RETURN QUERY SELECT 
    _has_company,
    _has_relation, 
    _has_profile,
    (_has_company AND _has_relation AND _has_profile),
    _issues;
END;
$function$;

-- 28. repair_startup
CREATE OR REPLACE FUNCTION public.repair_startup(_company_id uuid)
 RETURNS TABLE(success boolean, message text, actions_taken text[])
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  _owner_id uuid;
  _actions text[] := ARRAY[]::text[];
  repair_success boolean := true;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role = 'admin'::app_role 
    AND p.status = 'active'
  ) THEN
    RETURN QUERY SELECT FALSE, 'Apenas admins podem reparar startups', ARRAY[]::text[];
    RETURN;
  END IF;

  SELECT c.owner_id INTO _owner_id
  FROM public.companies c 
  WHERE c.id = _company_id 
  AND c.company_type = 'startup';

  IF _owner_id IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Empresa startup não encontrada', ARRAY[]::text[];
    RETURN;
  END IF;

  IF NOT EXISTS(
    SELECT 1 FROM public.user_company_relations ucr
    WHERE ucr.company_id = _company_id 
    AND ucr.user_id = _owner_id
  ) THEN
    INSERT INTO public.user_company_relations (user_id, company_id, role)
    VALUES (_owner_id, _company_id, 'admin');
    _actions := _actions || 'Relação user_company criada';
  END IF;

  IF NOT EXISTS(
    SELECT 1 FROM public.startup_hub_profiles shp
    WHERE shp.user_id = _owner_id 
    AND shp.type = 'startup'
    AND shp.status = 'active'
  ) THEN
    INSERT INTO public.startup_hub_profiles (user_id, type, status)
    VALUES (_owner_id, 'startup'::startup_hub_profile_type, 'active')
    ON CONFLICT (user_id) DO UPDATE SET
      type = 'startup'::startup_hub_profile_type,
      status = 'active',
      updated_at = now();
    _actions := _actions || 'Perfil startup_hub criado/reparado';
  END IF;

  RETURN QUERY SELECT TRUE, 'Startup reparada com sucesso', _actions;

EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT FALSE, 'Erro ao reparar startup: ' || SQLERRM, _actions;
END;
$function$;

-- 29. get_user_company_id
CREATE OR REPLACE FUNCTION public.get_user_company_id(_user_id uuid)
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $function$
  SELECT c.id 
  FROM public.companies c 
  WHERE c.owner_id = _user_id
  OR EXISTS (
    SELECT 1 FROM public.user_company_relations ucr 
    WHERE ucr.user_id = _user_id AND ucr.company_id = c.id
  )
  LIMIT 1;
$function$;

-- 30. get_table_names
CREATE OR REPLACE FUNCTION public.get_table_names()
 RETURNS text[]
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $function$
  SELECT array_agg(table_name::text)
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    AND table_name NOT LIKE '%_old'
    AND table_name NOT LIKE '%_backup'
    AND table_name NOT LIKE 'pg_%'
    AND table_name != 'spatial_ref_sys';
$function$;