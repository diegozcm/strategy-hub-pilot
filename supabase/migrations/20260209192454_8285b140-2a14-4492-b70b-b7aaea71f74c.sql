
-- Fix: Replace company_user_relations with user_company_relations in both deletion functions

-- Fix safe_delete_user
DROP FUNCTION IF EXISTS public.safe_delete_user(uuid, uuid);

CREATE OR REPLACE FUNCTION public.safe_delete_user(
  _user_id uuid,
  _admin_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check admin permissions
  IF NOT public.has_role(_admin_id, 'admin') THEN
    RAISE EXCEPTION 'Apenas administradores podem excluir usuários';
  END IF;

  -- Cannot delete yourself
  IF _user_id = _admin_id THEN
    RAISE EXCEPTION 'Administradores não podem excluir a si mesmos';
  END IF;

  -- Set nullable FK references to NULL before deletion
  UPDATE key_results SET assigned_owner_id = NULL, updated_at = now()
  WHERE assigned_owner_id = _user_id;
  
  UPDATE strategic_projects SET responsible_id = NULL, updated_at = now()
  WHERE responsible_id = _user_id;

  -- Delete user relations
  DELETE FROM public.user_modules WHERE user_id = _user_id;
  DELETE FROM public.user_company_relations WHERE user_id = _user_id;
  DELETE FROM public.project_members WHERE user_id = _user_id;
  DELETE FROM public.startup_hub_profiles WHERE user_id = _user_id;
  DELETE FROM public.admin_impersonation_sessions WHERE admin_user_id = _user_id OR impersonated_user_id = _user_id;
  
  -- Delete AI-related data
  DELETE FROM public.ai_chat_messages WHERE session_id IN (SELECT id FROM ai_chat_sessions WHERE user_id = _user_id);
  DELETE FROM public.ai_chat_sessions WHERE user_id = _user_id;
  DELETE FROM public.ai_insights WHERE user_id = _user_id;
  DELETE FROM public.ai_user_preferences WHERE user_id = _user_id;
  DELETE FROM public.ai_analytics WHERE user_id = _user_id;
  
  -- Delete BEEP data
  DELETE FROM public.beep_answers WHERE assessment_id IN (SELECT id FROM beep_assessments WHERE user_id = _user_id);
  DELETE FROM public.beep_assessments WHERE user_id = _user_id;
  
  -- Delete access logs
  DELETE FROM public.profile_access_logs WHERE accessing_user_id = _user_id OR accessed_user_id = _user_id;
  
  -- Delete user roles
  DELETE FROM public.user_roles WHERE user_id = _user_id;
  
  -- Delete the profile
  DELETE FROM public.profiles WHERE user_id = _user_id;
  
  RETURN TRUE;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Erro ao excluir usuário: %', SQLERRM;
END;
$$;

-- Fix safe_delete_user_with_replacement
DROP FUNCTION IF EXISTS public.safe_delete_user_with_replacement(uuid, uuid, uuid);

CREATE OR REPLACE FUNCTION public.safe_delete_user_with_replacement(
  _user_id uuid,
  _replacement_user_id uuid,
  _admin_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_profile RECORD;
  replacement_profile RECORD;
  admin_profile RECORD;
  affected_records INTEGER;
  operations_log TEXT[] := ARRAY[]::TEXT[];
  result_json JSONB;
BEGIN
  -- Validate admin permissions
  SELECT * INTO admin_profile FROM profiles WHERE user_id = _admin_id;
  IF admin_profile IS NULL OR admin_profile.role NOT IN ('system_admin', 'admin') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Permissão negada. Apenas administradores podem excluir usuários.'
    );
  END IF;

  SELECT * INTO user_profile FROM profiles WHERE user_id = _user_id;
  IF user_profile IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Usuário não encontrado.');
  END IF;

  IF _user_id = _admin_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Você não pode excluir sua própria conta.');
  END IF;

  SELECT * INTO replacement_profile FROM profiles WHERE user_id = _replacement_user_id;
  IF replacement_profile IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Usuário substituto não encontrado.');
  END IF;

  IF _user_id = _replacement_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'O usuário substituto não pode ser o mesmo usuário a ser excluído.');
  END IF;

  -- Transfer ownership
  UPDATE companies SET owner_id = _replacement_user_id, updated_at = now() WHERE owner_id = _user_id;
  GET DIAGNOSTICS affected_records = ROW_COUNT;
  IF affected_records > 0 THEN operations_log := operations_log || ('Transferiu propriedade de ' || affected_records || ' empresa(s)'); END IF;

  UPDATE strategic_plans SET owner_id = _replacement_user_id, updated_at = now() WHERE owner_id = _user_id;
  GET DIAGNOSTICS affected_records = ROW_COUNT;
  IF affected_records > 0 THEN operations_log := operations_log || ('Transferiu propriedade de ' || affected_records || ' plano(s) estratégico(s)'); END IF;

  UPDATE strategic_projects SET owner_id = _replacement_user_id, updated_at = now() WHERE owner_id = _user_id;
  GET DIAGNOSTICS affected_records = ROW_COUNT;
  IF affected_records > 0 THEN operations_log := operations_log || ('Transferiu propriedade de ' || affected_records || ' projeto(s) estratégico(s)'); END IF;

  UPDATE strategic_projects SET responsible_id = _replacement_user_id, updated_at = now() WHERE responsible_id = _user_id;
  GET DIAGNOSTICS affected_records = ROW_COUNT;
  IF affected_records > 0 THEN operations_log := operations_log || ('Transferiu responsável de ' || affected_records || ' projeto(s) estratégico(s)'); END IF;

  UPDATE strategic_objectives SET owner_id = _replacement_user_id, updated_at = now() WHERE owner_id = _user_id;
  GET DIAGNOSTICS affected_records = ROW_COUNT;
  IF affected_records > 0 THEN operations_log := operations_log || ('Transferiu propriedade de ' || affected_records || ' objetivo(s) estratégico(s)'); END IF;

  UPDATE key_results SET owner_id = _replacement_user_id, updated_at = now() WHERE owner_id = _user_id;
  GET DIAGNOSTICS affected_records = ROW_COUNT;
  IF affected_records > 0 THEN operations_log := operations_log || ('Transferiu propriedade de ' || affected_records || ' resultado(s) chave'); END IF;

  UPDATE key_results SET assigned_owner_id = _replacement_user_id, updated_at = now() WHERE assigned_owner_id = _user_id;
  GET DIAGNOSTICS affected_records = ROW_COUNT;
  IF affected_records > 0 THEN operations_log := operations_log || ('Transferiu responsabilidade de ' || affected_records || ' resultado(s) chave'); END IF;

  UPDATE action_items SET assigned_to = _replacement_user_id, updated_at = now() WHERE assigned_to = _user_id;
  GET DIAGNOSTICS affected_records = ROW_COUNT;
  IF affected_records > 0 THEN operations_log := operations_log || ('Transferiu ' || affected_records || ' item(ns) de ação'); END IF;

  UPDATE ai_recommendations SET assigned_to = _replacement_user_id, updated_at = now() WHERE assigned_to = _user_id;
  GET DIAGNOSTICS affected_records = ROW_COUNT;
  IF affected_records > 0 THEN operations_log := operations_log || ('Transferiu ' || affected_records || ' recomendação(ões) de IA'); END IF;

  UPDATE mentoring_sessions SET mentor_id = _replacement_user_id, updated_at = now() WHERE mentor_id = _user_id;
  GET DIAGNOSTICS affected_records = ROW_COUNT;
  IF affected_records > 0 THEN operations_log := operations_log || ('Transferiu ' || affected_records || ' sessão(ões) de mentoria'); END IF;

  UPDATE mentor_startup_relations SET mentor_id = _replacement_user_id, updated_at = now() WHERE mentor_id = _user_id;
  GET DIAGNOSTICS affected_records = ROW_COUNT;
  IF affected_records > 0 THEN operations_log := operations_log || ('Transferiu ' || affected_records || ' relação(ões) mentor-startup'); END IF;

  UPDATE mentor_todos SET mentor_id = _replacement_user_id, updated_at = now() WHERE mentor_id = _user_id;
  GET DIAGNOSTICS affected_records = ROW_COUNT;
  IF affected_records > 0 THEN operations_log := operations_log || ('Transferiu ' || affected_records || ' tarefa(s) de mentor'); END IF;

  UPDATE performance_reviews SET reviewer_id = _replacement_user_id, updated_at = now() WHERE reviewer_id = _user_id;
  GET DIAGNOSTICS affected_records = ROW_COUNT;
  IF affected_records > 0 THEN operations_log := operations_log || ('Transferiu ' || affected_records || ' avaliação(ões) como avaliador'); END IF;

  -- Delete user data
  DELETE FROM user_modules WHERE user_id = _user_id;
  GET DIAGNOSTICS affected_records = ROW_COUNT;
  IF affected_records > 0 THEN operations_log := operations_log || ('Removeu ' || affected_records || ' módulo(s) do usuário'); END IF;

  -- FIXED: was company_user_relations, now user_company_relations
  DELETE FROM user_company_relations WHERE user_id = _user_id;
  GET DIAGNOSTICS affected_records = ROW_COUNT;
  IF affected_records > 0 THEN operations_log := operations_log || ('Removeu ' || affected_records || ' relação(ões) empresa-usuário'); END IF;

  DELETE FROM project_members WHERE user_id = _user_id;
  GET DIAGNOSTICS affected_records = ROW_COUNT;
  IF affected_records > 0 THEN operations_log := operations_log || ('Removeu participação em ' || affected_records || ' projeto(s)'); END IF;

  DELETE FROM startup_hub_profiles WHERE user_id = _user_id;
  GET DIAGNOSTICS affected_records = ROW_COUNT;
  IF affected_records > 0 THEN operations_log := operations_log || ('Removeu perfil(is) do startup hub'); END IF;

  DELETE FROM admin_impersonation_sessions WHERE admin_user_id = _user_id OR impersonated_user_id = _user_id;
  GET DIAGNOSTICS affected_records = ROW_COUNT;
  IF affected_records > 0 THEN operations_log := operations_log || ('Removeu ' || affected_records || ' sessão(ões) de impersonação'); END IF;

  DELETE FROM ai_chat_messages WHERE session_id IN (SELECT id FROM ai_chat_sessions WHERE user_id = _user_id);
  DELETE FROM ai_chat_sessions WHERE user_id = _user_id;
  GET DIAGNOSTICS affected_records = ROW_COUNT;
  IF affected_records > 0 THEN operations_log := operations_log || ('Removeu sessões de chat com IA'); END IF;

  DELETE FROM ai_insights WHERE user_id = _user_id;
  DELETE FROM ai_user_preferences WHERE user_id = _user_id;
  DELETE FROM ai_analytics WHERE user_id = _user_id;

  DELETE FROM beep_answers WHERE assessment_id IN (SELECT id FROM beep_assessments WHERE user_id = _user_id);
  DELETE FROM beep_assessments WHERE user_id = _user_id;

  DELETE FROM profile_access_logs WHERE accessing_user_id = _user_id OR accessed_user_id = _user_id;

  DELETE FROM profiles WHERE user_id = _user_id;
  operations_log := operations_log || ('Removeu perfil do usuário');

  result_json := jsonb_build_object(
    'success', true,
    'deleted_user', user_profile.email,
    'replacement_user', replacement_profile.email,
    'admin_user', admin_profile.email,
    'operations_log', to_jsonb(operations_log),
    'completed_at', now()
  );

  RETURN result_json;

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'operations_completed', to_jsonb(operations_log),
      'failed_at', now()
    );
END;
$$;
