-- Drop existing function and recreate with fixed transfers
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

  -- Get user to delete
  SELECT * INTO user_profile FROM profiles WHERE user_id = _user_id;
  IF user_profile IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Usuário não encontrado.'
    );
  END IF;

  -- Cannot delete yourself
  IF _user_id = _admin_id THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Você não pode excluir sua própria conta.'
    );
  END IF;

  -- Validate replacement user
  SELECT * INTO replacement_profile FROM profiles WHERE user_id = _replacement_user_id;
  IF replacement_profile IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Usuário substituto não encontrado.'
    );
  END IF;

  -- Cannot use same user as replacement
  IF _user_id = _replacement_user_id THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'O usuário substituto não pode ser o mesmo usuário a ser excluído.'
    );
  END IF;

  -- Start transferring ownership and references
  
  -- Transfer companies ownership
  UPDATE companies 
  SET owner_id = _replacement_user_id, updated_at = now()
  WHERE owner_id = _user_id;
  GET DIAGNOSTICS affected_records = ROW_COUNT;
  IF affected_records > 0 THEN
    operations_log := operations_log || ('Transferiu propriedade de ' || affected_records || ' empresa(s)');
  END IF;

  -- Transfer strategic plans ownership
  UPDATE strategic_plans 
  SET owner_id = _replacement_user_id, updated_at = now()
  WHERE owner_id = _user_id;
  GET DIAGNOSTICS affected_records = ROW_COUNT;
  IF affected_records > 0 THEN
    operations_log := operations_log || ('Transferiu propriedade de ' || affected_records || ' plano(s) estratégico(s)');
  END IF;

  -- Transfer strategic projects ownership
  UPDATE strategic_projects 
  SET owner_id = _replacement_user_id, updated_at = now()
  WHERE owner_id = _user_id;
  GET DIAGNOSTICS affected_records = ROW_COUNT;
  IF affected_records > 0 THEN
    operations_log := operations_log || ('Transferiu propriedade de ' || affected_records || ' projeto(s) estratégico(s)');
  END IF;

  -- Transfer strategic projects responsible_id (NEW FIX)
  UPDATE strategic_projects 
  SET responsible_id = _replacement_user_id, updated_at = now()
  WHERE responsible_id = _user_id;
  GET DIAGNOSTICS affected_records = ROW_COUNT;
  IF affected_records > 0 THEN
    operations_log := operations_log || ('Transferiu responsável de ' || affected_records || ' projeto(s) estratégico(s)');
  END IF;

  -- Transfer strategic objectives ownership
  UPDATE strategic_objectives 
  SET owner_id = _replacement_user_id, updated_at = now()
  WHERE owner_id = _user_id;
  GET DIAGNOSTICS affected_records = ROW_COUNT;
  IF affected_records > 0 THEN
    operations_log := operations_log || ('Transferiu propriedade de ' || affected_records || ' objetivo(s) estratégico(s)');
  END IF;

  -- Transfer key results ownership
  UPDATE key_results 
  SET owner_id = _replacement_user_id, updated_at = now()
  WHERE owner_id = _user_id;
  GET DIAGNOSTICS affected_records = ROW_COUNT;
  IF affected_records > 0 THEN
    operations_log := operations_log || ('Transferiu propriedade de ' || affected_records || ' resultado(s) chave');
  END IF;

  -- Transfer key results assigned_owner_id (NEW FIX)
  UPDATE key_results 
  SET assigned_owner_id = _replacement_user_id, updated_at = now()
  WHERE assigned_owner_id = _user_id;
  GET DIAGNOSTICS affected_records = ROW_COUNT;
  IF affected_records > 0 THEN
    operations_log := operations_log || ('Transferiu responsabilidade de ' || affected_records || ' resultado(s) chave');
  END IF;

  -- Transfer action items
  UPDATE action_items 
  SET assigned_to = _replacement_user_id, updated_at = now()
  WHERE assigned_to = _user_id;
  GET DIAGNOSTICS affected_records = ROW_COUNT;
  IF affected_records > 0 THEN
    operations_log := operations_log || ('Transferiu ' || affected_records || ' item(ns) de ação');
  END IF;

  -- Transfer AI recommendations
  UPDATE ai_recommendations 
  SET assigned_to = _replacement_user_id, updated_at = now()
  WHERE assigned_to = _user_id;
  GET DIAGNOSTICS affected_records = ROW_COUNT;
  IF affected_records > 0 THEN
    operations_log := operations_log || ('Transferiu ' || affected_records || ' recomendação(ões) de IA');
  END IF;

  -- Transfer mentoring sessions (as mentor)
  UPDATE mentoring_sessions 
  SET mentor_id = _replacement_user_id, updated_at = now()
  WHERE mentor_id = _user_id;
  GET DIAGNOSTICS affected_records = ROW_COUNT;
  IF affected_records > 0 THEN
    operations_log := operations_log || ('Transferiu ' || affected_records || ' sessão(ões) de mentoria');
  END IF;

  -- Transfer mentor startup relations
  UPDATE mentor_startup_relations 
  SET mentor_id = _replacement_user_id, updated_at = now()
  WHERE mentor_id = _user_id;
  GET DIAGNOSTICS affected_records = ROW_COUNT;
  IF affected_records > 0 THEN
    operations_log := operations_log || ('Transferiu ' || affected_records || ' relação(ões) mentor-startup');
  END IF;

  -- Transfer mentor todos
  UPDATE mentor_todos 
  SET mentor_id = _replacement_user_id, updated_at = now()
  WHERE mentor_id = _user_id;
  GET DIAGNOSTICS affected_records = ROW_COUNT;
  IF affected_records > 0 THEN
    operations_log := operations_log || ('Transferiu ' || affected_records || ' tarefa(s) de mentor');
  END IF;

  -- Transfer performance reviews (as reviewer)
  UPDATE performance_reviews 
  SET reviewer_id = _replacement_user_id, updated_at = now()
  WHERE reviewer_id = _user_id;
  GET DIAGNOSTICS affected_records = ROW_COUNT;
  IF affected_records > 0 THEN
    operations_log := operations_log || ('Transferiu ' || affected_records || ' avaliação(ões) como avaliador');
  END IF;

  -- Delete user modules
  DELETE FROM user_modules WHERE user_id = _user_id;
  GET DIAGNOSTICS affected_records = ROW_COUNT;
  IF affected_records > 0 THEN
    operations_log := operations_log || ('Removeu ' || affected_records || ' módulo(s) do usuário');
  END IF;

  -- Delete company user relations
  DELETE FROM company_user_relations WHERE user_id = _user_id;
  GET DIAGNOSTICS affected_records = ROW_COUNT;
  IF affected_records > 0 THEN
    operations_log := operations_log || ('Removeu ' || affected_records || ' relação(ões) empresa-usuário');
  END IF;

  -- Delete project members
  DELETE FROM project_members WHERE user_id = _user_id;
  GET DIAGNOSTICS affected_records = ROW_COUNT;
  IF affected_records > 0 THEN
    operations_log := operations_log || ('Removeu participação em ' || affected_records || ' projeto(s)');
  END IF;

  -- Delete startup hub profiles
  DELETE FROM startup_hub_profiles WHERE user_id = _user_id;
  GET DIAGNOSTICS affected_records = ROW_COUNT;
  IF affected_records > 0 THEN
    operations_log := operations_log || ('Removeu perfil(is) do startup hub');
  END IF;

  -- Delete admin impersonation sessions
  DELETE FROM admin_impersonation_sessions WHERE admin_user_id = _user_id OR impersonated_user_id = _user_id;
  GET DIAGNOSTICS affected_records = ROW_COUNT;
  IF affected_records > 0 THEN
    operations_log := operations_log || ('Removeu ' || affected_records || ' sessão(ões) de impersonação');
  END IF;

  -- Delete AI chat sessions and messages
  DELETE FROM ai_chat_messages WHERE session_id IN (SELECT id FROM ai_chat_sessions WHERE user_id = _user_id);
  DELETE FROM ai_chat_sessions WHERE user_id = _user_id;
  GET DIAGNOSTICS affected_records = ROW_COUNT;
  IF affected_records > 0 THEN
    operations_log := operations_log || ('Removeu sessões de chat com IA');
  END IF;

  -- Delete AI insights
  DELETE FROM ai_insights WHERE user_id = _user_id;
  GET DIAGNOSTICS affected_records = ROW_COUNT;
  IF affected_records > 0 THEN
    operations_log := operations_log || ('Removeu ' || affected_records || ' insight(s) de IA');
  END IF;

  -- Delete AI user preferences
  DELETE FROM ai_user_preferences WHERE user_id = _user_id;

  -- Delete AI analytics
  DELETE FROM ai_analytics WHERE user_id = _user_id;

  -- Delete BEEP assessments and answers
  DELETE FROM beep_answers WHERE assessment_id IN (SELECT id FROM beep_assessments WHERE user_id = _user_id);
  DELETE FROM beep_assessments WHERE user_id = _user_id;

  -- Delete profile access logs
  DELETE FROM profile_access_logs WHERE accessing_user_id = _user_id OR accessed_user_id = _user_id;

  -- Finally delete the profile
  DELETE FROM profiles WHERE user_id = _user_id;
  operations_log := operations_log || ('Removeu perfil do usuário');

  -- Build result
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