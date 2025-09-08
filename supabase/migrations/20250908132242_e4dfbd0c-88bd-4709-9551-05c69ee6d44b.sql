-- Create audit log table for cleanup operations
CREATE TABLE IF NOT EXISTS public.database_cleanup_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id UUID NOT NULL,
  cleanup_category VARCHAR NOT NULL,
  records_deleted INTEGER NOT NULL DEFAULT 0,
  filter_criteria JSONB DEFAULT '{}',
  executed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  success BOOLEAN NOT NULL DEFAULT true,
  error_details TEXT,
  notes TEXT
);

-- Enable RLS on cleanup logs
ALTER TABLE public.database_cleanup_logs ENABLE ROW LEVEL SECURITY;

-- Policy for cleanup logs - only admins can view and create
CREATE POLICY "Admins can manage cleanup logs" ON public.database_cleanup_logs
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Function to safely cleanup mentoring data
CREATE OR REPLACE FUNCTION public.cleanup_mentoring_data(_admin_id UUID, _company_id UUID DEFAULT NULL, _before_date DATE DEFAULT NULL)
RETURNS TABLE(deleted_sessions INTEGER, deleted_relations INTEGER, deleted_actions INTEGER, success BOOLEAN, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
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
  DELETE FROM public.action_items 
  WHERE session_id IN (
    SELECT ms.id FROM public.mentoring_sessions ms 
    WHERE (_company_id IS NULL OR ms.startup_company_id = _company_id)
    AND (_before_date IS NULL OR ms.session_date::date < _before_date)
  );
  GET DIAGNOSTICS actions_count = ROW_COUNT;

  -- Delete mentoring sessions
  DELETE FROM public.mentoring_sessions 
  WHERE (_company_id IS NULL OR startup_company_id = _company_id)
  AND (_before_date IS NULL OR session_date::date < _before_date);
  GET DIAGNOSTICS sessions_count = ROW_COUNT;

  -- Delete mentor-startup relations if no company filter
  IF _company_id IS NULL THEN
    DELETE FROM public.mentor_startup_relations;
    GET DIAGNOSTICS relations_count = ROW_COUNT;
  ELSE
    DELETE FROM public.mentor_startup_relations WHERE startup_company_id = _company_id;
    GET DIAGNOSTICS relations_count = ROW_COUNT;
  END IF;

  RETURN QUERY SELECT sessions_count, relations_count, actions_count, TRUE, 'Dados de mentoria removidos com sucesso';
END;
$$;

-- Function to cleanup strategic planning data
CREATE OR REPLACE FUNCTION public.cleanup_strategic_data(_admin_id UUID, _company_id UUID DEFAULT NULL)
RETURNS TABLE(deleted_plans INTEGER, deleted_pillars INTEGER, deleted_objectives INTEGER, deleted_projects INTEGER, success BOOLEAN, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
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
  DELETE FROM public.project_objective_relations 
  WHERE project_id IN (
    SELECT sp.id FROM public.strategic_projects sp
    WHERE (_company_id IS NULL OR sp.company_id = _company_id)
  );

  DELETE FROM public.project_kr_relations 
  WHERE project_id IN (
    SELECT sp.id FROM public.strategic_projects sp
    WHERE (_company_id IS NULL OR sp.company_id = _company_id)
  );

  -- Delete strategic projects
  DELETE FROM public.strategic_projects 
  WHERE (_company_id IS NULL OR company_id = _company_id);
  GET DIAGNOSTICS projects_count = ROW_COUNT;

  -- Delete strategic objectives
  DELETE FROM public.strategic_objectives 
  WHERE plan_id IN (
    SELECT sp.id FROM public.strategic_plans sp
    WHERE (_company_id IS NULL OR sp.company_id = _company_id)
  );
  GET DIAGNOSTICS objectives_count = ROW_COUNT;

  -- Delete strategic pillars
  DELETE FROM public.strategic_pillars 
  WHERE company_id = COALESCE(_company_id, company_id);
  GET DIAGNOSTICS pillars_count = ROW_COUNT;

  -- Delete strategic plans
  DELETE FROM public.strategic_plans 
  WHERE (_company_id IS NULL OR company_id = _company_id);
  GET DIAGNOSTICS plans_count = ROW_COUNT;

  RETURN QUERY SELECT plans_count, pillars_count, objectives_count, projects_count, TRUE, 'Dados de planejamento estratégico removidos com sucesso';
END;
$$;

-- Function to cleanup key results and metrics data
CREATE OR REPLACE FUNCTION public.cleanup_metrics_data(_admin_id UUID, _company_id UUID DEFAULT NULL)
RETURNS TABLE(deleted_history INTEGER, deleted_values INTEGER, deleted_results INTEGER, success BOOLEAN, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
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
  DELETE FROM public.key_results_history 
  WHERE key_result_id IN (
    SELECT kr.id FROM public.key_results kr
    JOIN public.strategic_objectives so ON so.id = kr.objective_id
    JOIN public.strategic_plans sp ON sp.id = so.plan_id
    WHERE (_company_id IS NULL OR sp.company_id = _company_id)
  );
  GET DIAGNOSTICS history_count = ROW_COUNT;

  -- Delete key result values
  DELETE FROM public.key_result_values 
  WHERE key_result_id IN (
    SELECT kr.id FROM public.key_results kr
    JOIN public.strategic_objectives so ON so.id = kr.objective_id
    JOIN public.strategic_plans sp ON sp.id = so.plan_id
    WHERE (_company_id IS NULL OR sp.company_id = _company_id)
  );
  GET DIAGNOSTICS values_count = ROW_COUNT;

  -- Delete key results
  DELETE FROM public.key_results 
  WHERE objective_id IN (
    SELECT so.id FROM public.strategic_objectives so
    JOIN public.strategic_plans sp ON sp.id = so.plan_id
    WHERE (_company_id IS NULL OR sp.company_id = _company_id)
  );
  GET DIAGNOSTICS results_count = ROW_COUNT;

  RETURN QUERY SELECT history_count, values_count, results_count, TRUE, 'Dados de métricas e resultados-chave removidos com sucesso';
END;
$$;

-- Function to cleanup strategic analyses (Golden Circle & SWOT)
CREATE OR REPLACE FUNCTION public.cleanup_analyses_data(_admin_id UUID, _company_id UUID DEFAULT NULL)
RETURNS TABLE(deleted_gc_history INTEGER, deleted_gc INTEGER, deleted_swot_history INTEGER, deleted_swot INTEGER, success BOOLEAN, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
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
  DELETE FROM public.golden_circle_history 
  WHERE golden_circle_id IN (
    SELECT gc.id FROM public.golden_circle gc
    WHERE (_company_id IS NULL OR gc.company_id = _company_id)
  );
  GET DIAGNOSTICS gc_history_count = ROW_COUNT;

  -- Delete Golden Circle
  DELETE FROM public.golden_circle 
  WHERE (_company_id IS NULL OR company_id = _company_id);
  GET DIAGNOSTICS gc_count = ROW_COUNT;

  -- Delete SWOT history
  DELETE FROM public.swot_history 
  WHERE swot_analysis_id IN (
    SELECT sa.id FROM public.swot_analysis sa
    WHERE (_company_id IS NULL OR sa.company_id = _company_id)
  );
  GET DIAGNOSTICS swot_history_count = ROW_COUNT;

  -- Delete SWOT analysis
  DELETE FROM public.swot_analysis 
  WHERE (_company_id IS NULL OR company_id = _company_id);
  GET DIAGNOSTICS swot_count = ROW_COUNT;

  RETURN QUERY SELECT gc_history_count, gc_count, swot_history_count, swot_count, TRUE, 'Dados de análises estratégicas removidos com sucesso';
END;
$$;

-- Function to cleanup BEEP assessments data
CREATE OR REPLACE FUNCTION public.cleanup_beep_data(_admin_id UUID, _company_id UUID DEFAULT NULL)
RETURNS TABLE(deleted_answers INTEGER, deleted_assessments INTEGER, success BOOLEAN, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
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
  DELETE FROM public.beep_answers 
  WHERE assessment_id IN (
    SELECT ba.id FROM public.beep_assessments ba
    WHERE (_company_id IS NULL OR ba.company_id = _company_id)
  );
  GET DIAGNOSTICS answers_count = ROW_COUNT;

  -- Delete BEEP assessments
  DELETE FROM public.beep_assessments 
  WHERE (_company_id IS NULL OR company_id = _company_id);
  GET DIAGNOSTICS assessments_count = ROW_COUNT;

  RETURN QUERY SELECT answers_count, assessments_count, TRUE, 'Dados de assessments BEEP removidos com sucesso';
END;
$$;

-- Function to cleanup AI and analytics data
CREATE OR REPLACE FUNCTION public.cleanup_ai_data(_admin_id UUID, _user_id UUID DEFAULT NULL)
RETURNS TABLE(deleted_messages INTEGER, deleted_sessions INTEGER, deleted_insights INTEGER, deleted_recommendations INTEGER, deleted_analytics INTEGER, success BOOLEAN, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
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
  DELETE FROM public.ai_chat_messages 
  WHERE session_id IN (
    SELECT acs.id FROM public.ai_chat_sessions acs
    WHERE (_user_id IS NULL OR acs.user_id = _user_id)
  );
  GET DIAGNOSTICS messages_count = ROW_COUNT;

  -- Delete AI chat sessions
  DELETE FROM public.ai_chat_sessions 
  WHERE (_user_id IS NULL OR user_id = _user_id);
  GET DIAGNOSTICS sessions_count = ROW_COUNT;

  -- Delete AI insights
  DELETE FROM public.ai_insights 
  WHERE (_user_id IS NULL OR user_id = _user_id);
  GET DIAGNOSTICS insights_count = ROW_COUNT;

  -- Delete AI recommendations
  DELETE FROM public.ai_recommendations;
  GET DIAGNOSTICS recommendations_count = ROW_COUNT;

  -- Delete AI analytics
  DELETE FROM public.ai_analytics 
  WHERE (_user_id IS NULL OR user_id = _user_id);
  GET DIAGNOSTICS analytics_count = ROW_COUNT;

  RETURN QUERY SELECT messages_count, sessions_count, insights_count, recommendations_count, analytics_count, TRUE, 'Dados de IA e analytics removidos com sucesso';
END;
$$;

-- Function to cleanup performance reviews
CREATE OR REPLACE FUNCTION public.cleanup_performance_data(_admin_id UUID, _user_id UUID DEFAULT NULL)
RETURNS TABLE(deleted_reviews INTEGER, success BOOLEAN, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
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
  DELETE FROM public.performance_reviews 
  WHERE (_user_id IS NULL OR user_id = _user_id OR reviewer_id = _user_id);
  GET DIAGNOSTICS reviews_count = ROW_COUNT;

  RETURN QUERY SELECT reviews_count, TRUE, 'Dados de avaliações de performance removidos com sucesso';
END;
$$;