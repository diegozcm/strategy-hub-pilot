-- Update safe_delete_user to handle FK constraints by setting them to NULL
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
  -- key_results.assigned_owner_id (nullable FK to profiles)
  UPDATE key_results SET assigned_owner_id = NULL, updated_at = now()
  WHERE assigned_owner_id = _user_id;
  
  -- strategic_projects.responsible_id (nullable FK to profiles)
  UPDATE strategic_projects SET responsible_id = NULL, updated_at = now()
  WHERE responsible_id = _user_id;

  -- Delete user relations
  DELETE FROM public.user_modules WHERE user_id = _user_id;
  DELETE FROM public.company_user_relations WHERE user_id = _user_id;
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
  
  -- Delete user roles (legacy table if exists)
  DELETE FROM public.user_roles WHERE user_id = _user_id;
  
  -- Delete the profile
  DELETE FROM public.profiles WHERE user_id = _user_id;
  
  -- Note: Not deleting from auth.users as this requires service role key
  -- The auth.users entry will be handled separately or remain orphaned
  
  RETURN TRUE;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Erro ao excluir usuário: %', SQLERRM;
END;
$$;