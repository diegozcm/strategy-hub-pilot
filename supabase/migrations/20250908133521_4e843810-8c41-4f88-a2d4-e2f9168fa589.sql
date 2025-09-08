-- Fix search_path for cleanup functions to resolve security warnings
DROP FUNCTION IF EXISTS public.cleanup_mentoring_data(UUID, UUID, DATE);
DROP FUNCTION IF EXISTS public.cleanup_strategic_data(UUID, UUID);
DROP FUNCTION IF EXISTS public.cleanup_metrics_data(UUID, UUID);
DROP FUNCTION IF EXISTS public.cleanup_analyses_data(UUID, UUID);
DROP FUNCTION IF EXISTS public.cleanup_beep_data(UUID, UUID);
DROP FUNCTION IF EXISTS public.cleanup_ai_data(UUID, UUID);
DROP FUNCTION IF EXISTS public.cleanup_performance_data(UUID, UUID);

-- Recreate functions with proper search_path
CREATE OR REPLACE FUNCTION public.cleanup_mentoring_data(_admin_id UUID, _company_id UUID DEFAULT NULL, _before_date DATE DEFAULT NULL)
RETURNS TABLE(deleted_sessions INTEGER, deleted_relations INTEGER, deleted_actions INTEGER, success BOOLEAN, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sessions_count INTEGER := 0;
  relations_count INTEGER := 0;
  actions_count INTEGER := 0;
BEGIN
  -- Verify admin permission
  IF NOT has_role(_admin_id, 'admin'::app_role) THEN
    RETURN QUERY SELECT 0, 0, 0, FALSE, 'Apenas administradores podem executar limpeza de dados';
    RETURN;
  END IF;

  -- Delete action items first (due to FK constraints)
  DELETE FROM action_items 
  WHERE session_id IN (
    SELECT ms.id FROM mentoring_sessions ms 
    WHERE (_company_id IS NULL OR ms.startup_company_id = _company_id)
    AND (_before_date IS NULL OR ms.session_date::date < _before_date)
  );
  GET DIAGNOSTICS actions_count = ROW_COUNT;

  -- Delete mentoring sessions
  DELETE FROM mentoring_sessions 
  WHERE (_company_id IS NULL OR startup_company_id = _company_id)
  AND (_before_date IS NULL OR session_date::date < _before_date);
  GET DIAGNOSTICS sessions_count = ROW_COUNT;

  -- Delete mentor-startup relations if no company filter
  IF _company_id IS NULL THEN
    DELETE FROM mentor_startup_relations;
    GET DIAGNOSTICS relations_count = ROW_COUNT;
  ELSE
    DELETE FROM mentor_startup_relations WHERE startup_company_id = _company_id;
    GET DIAGNOSTICS relations_count = ROW_COUNT;
  END IF;

  RETURN QUERY SELECT sessions_count, relations_count, actions_count, TRUE, 'Dados de mentoria removidos com sucesso';
END;
$$;

CREATE OR REPLACE FUNCTION public.cleanup_strategic_data(_admin_id UUID, _company_id UUID DEFAULT NULL)
RETURNS TABLE(deleted_plans INTEGER, deleted_pillars INTEGER, deleted_objectives INTEGER, deleted_projects INTEGER, success BOOLEAN, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  plans_count INTEGER := 0;
  pillars_count INTEGER := 0;
  objectives_count INTEGER := 0;
  projects_count INTEGER := 0;
BEGIN
  -- Verify admin permission
  IF NOT has_role(_admin_id, 'admin'::app_role) THEN
    RETURN QUERY SELECT 0, 0, 0, 0, FALSE, 'Apenas administradores podem executar limpeza de dados';
    RETURN;
  END IF;

  -- Delete in correct order due to FK constraints
  -- Delete project relations first
  DELETE FROM project_objective_relations 
  WHERE project_id IN (
    SELECT sp.id FROM strategic_projects sp
    WHERE (_company_id IS NULL OR sp.company_id = _company_id)
  );

  DELETE FROM project_kr_relations 
  WHERE project_id IN (
    SELECT sp.id FROM strategic_projects sp
    WHERE (_company_id IS NULL OR sp.company_id = _company_id)
  );

  -- Delete strategic projects
  DELETE FROM strategic_projects 
  WHERE (_company_id IS NULL OR company_id = _company_id);
  GET DIAGNOSTICS projects_count = ROW_COUNT;

  -- Delete strategic objectives
  DELETE FROM strategic_objectives 
  WHERE plan_id IN (
    SELECT sp.id FROM strategic_plans sp
    WHERE (_company_id IS NULL OR sp.company_id = _company_id)
  );
  GET DIAGNOSTICS objectives_count = ROW_COUNT;

  -- Delete strategic pillars
  DELETE FROM strategic_pillars 
  WHERE company_id = COALESCE(_company_id, company_id);
  GET DIAGNOSTICS pillars_count = ROW_COUNT;

  -- Delete strategic plans
  DELETE FROM strategic_plans 
  WHERE (_company_id IS NULL OR company_id = _company_id);
  GET DIAGNOSTICS plans_count = ROW_COUNT;

  RETURN QUERY SELECT plans_count, pillars_count, objectives_count, projects_count, TRUE, 'Dados de planejamento estratégico removidos com sucesso';
END;
$$;

CREATE OR REPLACE FUNCTION public.cleanup_metrics_data(_admin_id UUID, _company_id UUID DEFAULT NULL)
RETURNS TABLE(deleted_history INTEGER, deleted_values INTEGER, deleted_results INTEGER, success BOOLEAN, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  history_count INTEGER := 0;
  values_count INTEGER := 0;
  results_count INTEGER := 0;
BEGIN
  -- Verify admin permission
  IF NOT has_role(_admin_id, 'admin'::app_role) THEN
    RETURN QUERY SELECT 0, 0, 0, FALSE, 'Apenas administradores podem executar limpeza de dados';
    RETURN;
  END IF;

  -- Delete key results history
  DELETE FROM key_results_history 
  WHERE key_result_id IN (
    SELECT kr.id FROM key_results kr
    JOIN strategic_objectives so ON so.id = kr.objective_id
    JOIN strategic_plans sp ON sp.id = so.plan_id
    WHERE (_company_id IS NULL OR sp.company_id = _company_id)
  );
  GET DIAGNOSTICS history_count = ROW_COUNT;

  -- Delete key result values
  DELETE FROM key_result_values 
  WHERE key_result_id IN (
    SELECT kr.id FROM key_results kr
    JOIN strategic_objectives so ON so.id = kr.objective_id
    JOIN strategic_plans sp ON sp.id = so.plan_id
    WHERE (_company_id IS NULL OR sp.company_id = _company_id)
  );
  GET DIAGNOSTICS values_count = ROW_COUNT;

  -- Delete key results
  DELETE FROM key_results 
  WHERE objective_id IN (
    SELECT so.id FROM strategic_objectives so
    JOIN strategic_plans sp ON sp.id = so.plan_id
    WHERE (_company_id IS NULL OR sp.company_id = _company_id)
  );
  GET DIAGNOSTICS results_count = ROW_COUNT;

  RETURN QUERY SELECT history_count, values_count, results_count, TRUE, 'Dados de métricas e resultados-chave removidos com sucesso';
END;
$$;

CREATE OR REPLACE FUNCTION public.cleanup_analyses_data(_admin_id UUID, _company_id UUID DEFAULT NULL)
RETURNS TABLE(deleted_gc_history INTEGER, deleted_gc INTEGER, deleted_swot_history INTEGER, deleted_swot INTEGER, success BOOLEAN, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  gc_history_count INTEGER := 0;
  gc_count INTEGER := 0;
  swot_history_count INTEGER := 0;
  swot_count INTEGER := 0;
BEGIN
  -- Verify admin permission
  IF NOT has_role(_admin_id, 'admin'::app_role) THEN
    RETURN QUERY SELECT 0, 0, 0, 0, FALSE, 'Apenas administradores podem executar limpeza de dados';
    RETURN;
  END IF;

  -- Delete Golden Circle history
  DELETE FROM golden_circle_history 
  WHERE golden_circle_id IN (
    SELECT gc.id FROM golden_circle gc
    WHERE (_company_id IS NULL OR gc.company_id = _company_id)
  );
  GET DIAGNOSTICS gc_history_count = ROW_COUNT;

  -- Delete Golden Circle
  DELETE FROM golden_circle 
  WHERE (_company_id IS NULL OR company_id = _company_id);
  GET DIAGNOSTICS gc_count = ROW_COUNT;

  -- Delete SWOT history
  DELETE FROM swot_history 
  WHERE swot_analysis_id IN (
    SELECT sa.id FROM swot_analysis sa
    WHERE (_company_id IS NULL OR sa.company_id = _company_id)
  );
  GET DIAGNOSTICS swot_history_count = ROW_COUNT;

  -- Delete SWOT analysis
  DELETE FROM swot_analysis 
  WHERE (_company_id IS NULL OR company_id = _company_id);
  GET DIAGNOSTICS swot_count = ROW_COUNT;

  RETURN QUERY SELECT gc_history_count, gc_count, swot_history_count, swot_count, TRUE, 'Dados de análises estratégicas removidos com sucesso';
END;
$$;

CREATE OR REPLACE FUNCTION public.cleanup_beep_data(_admin_id UUID, _company_id UUID DEFAULT NULL)
RETURNS TABLE(deleted_answers INTEGER, deleted_assessments INTEGER, success BOOLEAN, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  answers_count INTEGER := 0;
  assessments_count INTEGER := 0;
BEGIN
  -- Verify admin permission
  IF NOT has_role(_admin_id, 'admin'::app_role) THEN
    RETURN QUERY SELECT 0, 0, FALSE, 'Apenas administradores podem executar limpeza de dados';
    RETURN;
  END IF;

  -- Delete BEEP answers
  DELETE FROM beep_answers 
  WHERE assessment_id IN (
    SELECT ba.id FROM beep_assessments ba
    WHERE (_company_id IS NULL OR ba.company_id = _company_id)
  );
  GET DIAGNOSTICS answers_count = ROW_COUNT;

  -- Delete BEEP assessments
  DELETE FROM beep_assessments 
  WHERE (_company_id IS NULL OR company_id = _company_id);
  GET DIAGNOSTICS assessments_count = ROW_COUNT;

  RETURN QUERY SELECT answers_count, assessments_count, TRUE, 'Dados de assessments BEEP removidos com sucesso';
END;
$$;

CREATE OR REPLACE FUNCTION public.cleanup_ai_data(_admin_id UUID, _user_id UUID DEFAULT NULL)
RETURNS TABLE(deleted_messages INTEGER, deleted_sessions INTEGER, deleted_insights INTEGER, deleted_recommendations INTEGER, deleted_analytics INTEGER, success BOOLEAN, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  messages_count INTEGER := 0;
  sessions_count INTEGER := 0;
  insights_count INTEGER := 0;
  recommendations_count INTEGER := 0;
  analytics_count INTEGER := 0;
BEGIN
  -- Verify admin permission
  IF NOT has_role(_admin_id, 'admin'::app_role) THEN
    RETURN QUERY SELECT 0, 0, 0, 0, 0, FALSE, 'Apenas administradores podem executar limpeza de dados';
    RETURN;
  END IF;

  -- Delete AI chat messages
  DELETE FROM ai_chat_messages 
  WHERE session_id IN (
    SELECT acs.id FROM ai_chat_sessions acs
    WHERE (_user_id IS NULL OR acs.user_id = _user_id)
  );
  GET DIAGNOSTICS messages_count = ROW_COUNT;

  -- Delete AI chat sessions
  DELETE FROM ai_chat_sessions 
  WHERE (_user_id IS NULL OR user_id = _user_id);
  GET DIAGNOSTICS sessions_count = ROW_COUNT;

  -- Delete AI insights
  DELETE FROM ai_insights 
  WHERE (_user_id IS NULL OR user_id = _user_id);
  GET DIAGNOSTICS insights_count = ROW_COUNT;

  -- Delete AI recommendations
  DELETE FROM ai_recommendations;
  GET DIAGNOSTICS recommendations_count = ROW_COUNT;

  -- Delete AI analytics
  DELETE FROM ai_analytics 
  WHERE (_user_id IS NULL OR user_id = _user_id);
  GET DIAGNOSTICS analytics_count = ROW_COUNT;

  RETURN QUERY SELECT messages_count, sessions_count, insights_count, recommendations_count, analytics_count, TRUE, 'Dados de IA e analytics removidos com sucesso';
END;
$$;

CREATE OR REPLACE FUNCTION public.cleanup_performance_data(_admin_id UUID, _user_id UUID DEFAULT NULL)
RETURNS TABLE(deleted_reviews INTEGER, success BOOLEAN, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  reviews_count INTEGER := 0;
BEGIN
  -- Verify admin permission
  IF NOT has_role(_admin_id, 'admin'::app_role) THEN
    RETURN QUERY SELECT 0, FALSE, 'Apenas administradores podem executar limpeza de dados';
    RETURN;
  END IF;

  -- Delete performance reviews
  DELETE FROM performance_reviews 
  WHERE (_user_id IS NULL OR user_id = _user_id OR reviewer_id = _user_id);
  GET DIAGNOSTICS reviews_count = ROW_COUNT;

  RETURN QUERY SELECT reviews_count, TRUE, 'Dados de avaliações de performance removidos com sucesso';
END;
$$;