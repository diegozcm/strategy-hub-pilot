-- Create or replace the analyze_user_data function
CREATE OR REPLACE FUNCTION analyze_user_data(target_user_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
  projects_data JSON;
  indicators_data JSON;
  objectives_data JSON;
BEGIN
  -- Get projects data
  SELECT COALESCE(json_agg(
    json_build_object(
      'id', p.id,
      'plan_id', p.plan_id,
      'name', p.name,
      'description', p.description,
      'owner_id', p.owner_id,
      'start_date', p.start_date,
      'end_date', p.end_date,
      'budget', p.budget,
      'status', p.status,
      'progress', p.progress,
      'priority', p.priority,
      'created_at', p.created_at,
      'updated_at', p.updated_at,
      'responsible', p.responsible,
      'company_id', p.company_id
    )
  ), '[]'::json) INTO projects_data
  FROM projects p
  WHERE p.owner_id = target_user_id OR p.responsible = target_user_id::text;

  -- Get indicators (key results) data
  SELECT COALESCE(json_agg(
    json_build_object(
      'id', kr.id,
      'name', kr.name,
      'current_value', kr.current_value,
      'target_value', kr.target_value,
      'unit', kr.unit,
      'category', kr.category,
      'owner_id', kr.owner_id,
      'objective_id', kr.objective_id,
      'due_date', kr.due_date,
      'created_at', kr.created_at,
      'updated_at', kr.updated_at,
      'priority', kr.priority,
      'responsible', kr.responsible
    )
  ), '[]'::json) INTO indicators_data
  FROM strategic_key_results kr
  WHERE kr.owner_id = target_user_id OR kr.responsible = target_user_id::text;

  -- Get objectives data
  SELECT COALESCE(json_agg(
    json_build_object(
      'id', o.id,
      'plan_id', o.plan_id,
      'title', o.title,
      'description', o.description,
      'weight', o.weight,
      'owner_id', o.owner_id,
      'target_date', o.target_date,
      'status', o.status,
      'progress', o.progress,
      'created_at', o.created_at,
      'updated_at', o.updated_at,
      'monthly_targets', o.monthly_targets,
      'monthly_actual', o.monthly_actual,
      'yearly_target', o.yearly_target,
      'yearly_actual', o.yearly_actual,
      'pillar_id', o.pillar_id,
      'responsible', o.responsible,
      'deadline', o.deadline
    )
  ), '[]'::json) INTO objectives_data
  FROM strategic_objectives o
  WHERE o.owner_id = target_user_id OR o.responsible = target_user_id::text;

  -- Build the result JSON
  result := json_build_object(
    'projects', projects_data,
    'indicators', indicators_data,
    'objectives', objectives_data,
    'analysis_timestamp', NOW()
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;