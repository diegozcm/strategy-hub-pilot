-- Function to analyze user relations and their impact
CREATE OR REPLACE FUNCTION public.analyze_user_relations(_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  result json;
  ownership_relations json;
  participation_relations json;
  creation_relations json;
  assignment_relations json;
  mentoring_relations json;
BEGIN
  -- Analyze ownership relations (critical - require replacement)
  SELECT json_build_object(
    'companies', (
      SELECT json_agg(json_build_object('id', id, 'name', name, 'type', company_type))
      FROM public.companies WHERE owner_id = _user_id
    ),
    'strategic_projects', (
      SELECT count(*) FROM public.strategic_projects WHERE owner_id = _user_id
    ),
    'strategic_objectives', (
      SELECT count(*) FROM public.strategic_objectives WHERE owner_id = _user_id
    ),
    'key_results', (
      SELECT count(*) FROM public.key_results WHERE owner_id = _user_id
    )
  ) INTO ownership_relations;

  -- Analyze participation relations (important - may need replacement)
  SELECT json_build_object(
    'company_relations', (
      SELECT json_agg(json_build_object('company_id', company_id, 'role', role))
      FROM public.user_company_relations WHERE user_id = _user_id
    ),
    'project_members', (
      SELECT count(*) FROM public.project_members WHERE user_id = _user_id
    ),
    'user_modules', (
      SELECT json_agg(json_build_object('module_id', module_id, 'active', active))
      FROM public.user_modules WHERE user_id = _user_id AND active = true
    )
  ) INTO participation_relations;

  -- Analyze creation relations (historical - preserve with updated_by change)
  SELECT json_build_object(
    'golden_circle', (
      SELECT count(*) FROM public.golden_circle WHERE created_by = _user_id OR updated_by = _user_id
    ),
    'swot_analysis', (
      SELECT count(*) FROM public.swot_analysis WHERE created_by = _user_id OR updated_by = _user_id
    ),
    'system_settings', (
      SELECT count(*) FROM public.system_settings WHERE created_by = _user_id OR updated_by = _user_id
    )
  ) INTO creation_relations;

  -- Analyze assignment relations (active - require replacement)
  SELECT json_build_object(
    'action_items', (
      SELECT count(*) FROM public.action_items WHERE assigned_to = _user_id AND status != 'completed'
    ),
    'ai_recommendations', (
      SELECT count(*) FROM public.ai_recommendations WHERE assigned_to = _user_id AND status != 'completed'
    ),
    'performance_reviews_as_reviewer', (
      SELECT count(*) FROM public.performance_reviews WHERE reviewer_id = _user_id AND status = 'draft'
    ),
    'performance_reviews_as_reviewee', (
      SELECT count(*) FROM public.performance_reviews WHERE user_id = _user_id
    )
  ) INTO assignment_relations;

  -- Analyze mentoring relations (special handling - preserve history, transfer active)
  SELECT json_build_object(
    'mentor_sessions_historical', (
      SELECT count(*) FROM public.mentoring_sessions 
      WHERE mentor_id = _user_id AND status = 'completed'
    ),
    'mentor_sessions_active', (
      SELECT count(*) FROM public.mentoring_sessions 
      WHERE mentor_id = _user_id AND status IN ('scheduled', 'in_progress')
    ),
    'startup_relations', (
      SELECT json_agg(json_build_object('startup_company_id', startup_company_id, 'status', status))
      FROM public.mentor_startup_relations WHERE mentor_id = _user_id
    ),
    'startup_hub_profile', (
      SELECT json_build_object('type', type, 'status', status)
      FROM public.startup_hub_profiles WHERE user_id = _user_id
    )
  ) INTO mentoring_relations;

  -- Build final result
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

-- Function to find compatible replacement users
CREATE OR REPLACE FUNCTION public.find_compatible_replacement_users(_user_id uuid, _admin_id uuid)
RETURNS TABLE(
  user_id uuid,
  first_name text,
  last_name text,
  email text,
  role app_role,
  compatibility_score integer,
  compatibility_details json
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  target_user_roles app_role[];
  target_user_modules uuid[];
  target_companies uuid[];
  target_startup_profile startup_hub_profile_type;
BEGIN
  -- Verify admin permission
  IF NOT public.has_role(_admin_id, 'admin'::app_role) THEN
    RAISE EXCEPTION 'Apenas administradores podem buscar usuários compatíveis';
  END IF;

  -- Don't allow deletion of the target user if they're the last admin
  IF public.has_role(_user_id, 'admin'::app_role) THEN
    IF (SELECT count(*) FROM public.profiles WHERE role = 'admin'::app_role AND status = 'active') <= 1 THEN
      RAISE EXCEPTION 'Não é possível excluir o último administrador do sistema';
    END IF;
  END IF;

  -- Get target user's roles and access
  SELECT ARRAY[p.role] INTO target_user_roles
  FROM public.profiles p WHERE p.user_id = _user_id;

  -- Get target user's modules
  SELECT array_agg(um.module_id) INTO target_user_modules
  FROM public.user_modules um 
  WHERE um.user_id = _user_id AND um.active = true;

  -- Get target user's companies
  SELECT array_agg(ucr.company_id) INTO target_companies
  FROM public.user_company_relations ucr 
  WHERE ucr.user_id = _user_id;

  -- Get target user's startup hub profile
  SELECT shp.type INTO target_startup_profile
  FROM public.startup_hub_profiles shp 
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
      CASE WHEN p.role = ANY(target_user_roles) THEN 40 ELSE 0 END +
      -- Module compatibility (30 points)
      CASE WHEN (
        SELECT count(*) 
        FROM public.user_modules um2 
        WHERE um2.user_id = p.user_id 
          AND um2.module_id = ANY(target_user_modules) 
          AND um2.active = true
      ) >= array_length(target_user_modules, 1) THEN 30 ELSE 0 END +
      -- Company access compatibility (20 points)
      CASE WHEN (
        SELECT count(*) 
        FROM public.user_company_relations ucr2 
        WHERE ucr2.user_id = p.user_id 
          AND ucr2.company_id = ANY(target_companies)
      ) >= array_length(target_companies, 1) THEN 20 ELSE 0 END +
      -- Startup hub profile compatibility (10 points)
      CASE WHEN (
        target_startup_profile IS NULL OR
        EXISTS (
          SELECT 1 FROM public.startup_hub_profiles shp2 
          WHERE shp2.user_id = p.user_id 
            AND shp2.type = target_startup_profile 
            AND shp2.status = 'active'
        )
      ) THEN 10 ELSE 0 END
    )::integer as compatibility_score,
    json_build_object(
      'has_same_role', p.role = ANY(target_user_roles),
      'compatible_modules', (
        SELECT array_agg(um.module_id) 
        FROM public.user_modules um 
        WHERE um.user_id = p.user_id 
          AND um.module_id = ANY(target_user_modules) 
          AND um.active = true
      ),
      'shared_companies', (
        SELECT array_agg(ucr.company_id) 
        FROM public.user_company_relations ucr 
        WHERE ucr.user_id = p.user_id 
          AND ucr.company_id = ANY(target_companies)
      ),
      'startup_profile_match', (
        SELECT shp.type 
        FROM public.startup_hub_profiles shp 
        WHERE shp.user_id = p.user_id 
          AND shp.type = target_startup_profile 
          AND shp.status = 'active'
      )
    ) as compatibility_details
  FROM public.profiles p
  WHERE p.user_id != _user_id 
    AND p.user_id != _admin_id
    AND p.status = 'active'
    -- Only show users with at least 70% compatibility
    AND (
      CASE WHEN p.role = ANY(target_user_roles) THEN 40 ELSE 0 END +
      CASE WHEN (
        SELECT count(*) 
        FROM public.user_modules um2 
        WHERE um2.user_id = p.user_id 
          AND um2.module_id = ANY(target_user_modules) 
          AND um2.active = true
      ) >= COALESCE(array_length(target_user_modules, 1), 0) THEN 30 ELSE 0 END +
      CASE WHEN (
        SELECT count(*) 
        FROM public.user_company_relations ucr2 
        WHERE ucr2.user_id = p.user_id 
          AND ucr2.company_id = ANY(target_companies)
      ) >= COALESCE(array_length(target_companies, 1), 0) THEN 20 ELSE 0 END +
      CASE WHEN (
        target_startup_profile IS NULL OR
        EXISTS (
          SELECT 1 FROM public.startup_hub_profiles shp2 
          WHERE shp2.user_id = p.user_id 
            AND shp2.type = target_startup_profile 
            AND shp2.status = 'active'
        )
      ) THEN 10 ELSE 0 END
    ) >= 70
  ORDER BY compatibility_score DESC, p.first_name, p.last_name;
END;
$function$;

-- Enhanced safe_delete_user function with replacement user support
CREATE OR REPLACE FUNCTION public.safe_delete_user_with_replacement(
  _user_id uuid, 
  _replacement_user_id uuid, 
  _admin_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  operations_log text[] := ARRAY[]::text[];
  affected_records json;
  replacement_user_name text;
  deleted_user_name text;
BEGIN
  -- Verify admin permission
  IF NOT public.has_role(_admin_id, 'admin'::app_role) THEN
    RAISE EXCEPTION 'Apenas administradores podem excluir usuários';
  END IF;

  -- Prevent self-deletion
  IF _user_id = _admin_id THEN
    RAISE EXCEPTION 'Administradores não podem excluir a si mesmos';
  END IF;

  -- Get user names for logging
  SELECT CONCAT(first_name, ' ', last_name) INTO deleted_user_name
  FROM public.profiles WHERE user_id = _user_id;
  
  SELECT CONCAT(first_name, ' ', last_name) INTO replacement_user_name
  FROM public.profiles WHERE user_id = _replacement_user_id;

  -- Verify replacement user exists and is active
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = _replacement_user_id AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'Usuário substituto não encontrado ou inativo';
  END IF;

  -- Start transaction operations
  operations_log := operations_log || ('Iniciando exclusão do usuário: ' || deleted_user_name);
  operations_log := operations_log || ('Usuário substituto: ' || replacement_user_name);

  -- 1. OWNERSHIP TRANSFERS (Critical)
  
  -- Transfer company ownership
  UPDATE public.companies 
  SET owner_id = _replacement_user_id, updated_at = now()
  WHERE owner_id = _user_id;
  
  GET DIAGNOSTICS affected_records = ROW_COUNT;
  IF affected_records > 0 THEN
    operations_log := operations_log || ('Transferiu propriedade de ' || affected_records || ' empresa(s)');
  END IF;

  -- Transfer strategic projects ownership
  UPDATE public.strategic_projects 
  SET owner_id = _replacement_user_id, updated_at = now()
  WHERE owner_id = _user_id;
  
  GET DIAGNOSTICS affected_records = ROW_COUNT;
  IF affected_records > 0 THEN
    operations_log := operations_log || ('Transferiu propriedade de ' || affected_records || ' projeto(s) estratégico(s)');
  END IF;

  -- Transfer strategic objectives ownership
  UPDATE public.strategic_objectives 
  SET owner_id = _replacement_user_id, updated_at = now()
  WHERE owner_id = _user_id;
  
  GET DIAGNOSTICS affected_records = ROW_COUNT;
  IF affected_records > 0 THEN
    operations_log := operations_log || ('Transferiu propriedade de ' || affected_records || ' objetivo(s) estratégico(s)');
  END IF;

  -- Transfer key results ownership
  UPDATE public.key_results 
  SET owner_id = _replacement_user_id, updated_at = now()
  WHERE owner_id = _user_id;
  
  GET DIAGNOSTICS affected_records = ROW_COUNT;
  IF affected_records > 0 THEN
    operations_log := operations_log || ('Transferiu propriedade de ' || affected_records || ' resultado(s) chave');
  END IF;

  -- 2. PARTICIPATION UPDATES

  -- Update user company relations to replacement user
  UPDATE public.user_company_relations 
  SET user_id = _replacement_user_id, updated_at = now()
  WHERE user_id = _user_id;
  
  GET DIAGNOSTICS affected_records = ROW_COUNT;
  IF affected_records > 0 THEN
    operations_log := operations_log || ('Transferiu ' || affected_records || ' relação(ões) de empresa');
  END IF;

  -- Update project members
  UPDATE public.project_members 
  SET user_id = _replacement_user_id
  WHERE user_id = _user_id;
  
  GET DIAGNOSTICS affected_records = ROW_COUNT;
  IF affected_records > 0 THEN
    operations_log := operations_log || ('Transferiu participação em ' || affected_records || ' projeto(s)');
  END IF;

  -- 3. ASSIGNMENT TRANSFERS

  -- Transfer active action items
  UPDATE public.action_items 
  SET assigned_to = _replacement_user_id, updated_at = now()
  WHERE assigned_to = _user_id AND status != 'completed';
  
  GET DIAGNOSTICS affected_records = ROW_COUNT;
  IF affected_records > 0 THEN
    operations_log := operations_log || ('Transferiu ' || affected_records || ' item(ns) de ação ativo(s)');
  END IF;

  -- Transfer active AI recommendations
  UPDATE public.ai_recommendations 
  SET assigned_to = _replacement_user_id, updated_at = now()
  WHERE assigned_to = _user_id AND status != 'completed';
  
  GET DIAGNOSTICS affected_records = ROW_COUNT;
  IF affected_records > 0 THEN
    operations_log := operations_log || ('Transferiu ' || affected_records || ' recomendação(ões) de IA ativa(s)');
  END IF;

  -- Transfer draft performance reviews as reviewer
  UPDATE public.performance_reviews 
  SET reviewer_id = _replacement_user_id, updated_at = now()
  WHERE reviewer_id = _user_id AND status = 'draft';
  
  GET DIAGNOSTICS affected_records = ROW_COUNT;
  IF affected_records > 0 THEN
    operations_log := operations_log || ('Transferiu ' || affected_records || ' avaliação(ões) de desempenho como revisor');
  END IF;

  -- 4. MENTORING SPECIAL HANDLING

  -- Transfer ONLY active/future mentoring sessions (preserve historical ones)
  UPDATE public.mentoring_sessions 
  SET mentor_id = _replacement_user_id, updated_at = now()
  WHERE mentor_id = _user_id AND status IN ('scheduled', 'in_progress');
  
  GET DIAGNOSTICS affected_records = ROW_COUNT;
  IF affected_records > 0 THEN
    operations_log := operations_log || ('Transferiu ' || affected_records || ' sessão(ões) de mentoria ativa(s) - histórico preservado');
  END IF;

  -- Update mentor startup relations
  UPDATE public.mentor_startup_relations 
  SET mentor_id = _replacement_user_id, updated_at = now()
  WHERE mentor_id = _user_id AND status = 'active';
  
  GET DIAGNOSTICS affected_records = ROW_COUNT;
  IF affected_records > 0 THEN
    operations_log := operations_log || ('Transferiu ' || affected_records || ' relação(ões) mentor-startup');
  END IF;

  -- 5. CREATION UPDATES (update updated_by, preserve created_by for history)

  -- Update golden circle updated_by
  UPDATE public.golden_circle 
  SET updated_by = _replacement_user_id, updated_at = now()
  WHERE updated_by = _user_id;

  -- Update swot analysis updated_by
  UPDATE public.swot_analysis 
  SET updated_by = _replacement_user_id, updated_at = now()
  WHERE updated_by = _user_id;

  -- Update system settings updated_by
  UPDATE public.system_settings 
  SET updated_by = _replacement_user_id, updated_at = now()
  WHERE updated_by = _user_id;

  -- 6. CLEAN UP USER-SPECIFIC DATA

  -- Remove user modules
  DELETE FROM public.user_modules WHERE user_id = _user_id;
  operations_log := operations_log || ('Removeu acessos a módulos do usuário');

  -- Remove user roles
  DELETE FROM public.user_roles WHERE user_id = _user_id;
  operations_log := operations_log || ('Removeu roles do usuário');

  -- Remove startup hub profile
  DELETE FROM public.startup_hub_profiles WHERE user_id = _user_id;
  operations_log := operations_log || ('Removeu perfil do startup hub');

  -- Remove user profile
  DELETE FROM public.profiles WHERE user_id = _user_id;
  operations_log := operations_log || ('Removeu perfil do usuário');

  -- Remove from auth.users (final step)
  DELETE FROM auth.users WHERE id = _user_id;
  operations_log := operations_log || ('Removeu usuário da autenticação');

  operations_log := operations_log || ('Exclusão concluída com sucesso');

  -- Return detailed log
  RETURN json_build_object(
    'success', true,
    'deleted_user', deleted_user_name,
    'replacement_user', replacement_user_name,
    'admin_user', _admin_id,
    'operations_log', operations_log,
    'completed_at', now()
  );

EXCEPTION
  WHEN OTHERS THEN
    -- Return error details
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM,
      'operations_completed', operations_log,
      'failed_at', now()
    );
END;
$function$;