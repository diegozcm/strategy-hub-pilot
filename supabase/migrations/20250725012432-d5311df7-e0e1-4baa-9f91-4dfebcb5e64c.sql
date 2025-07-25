-- Update the analyze_user_data function to use key_results instead of indicators
CREATE OR REPLACE FUNCTION public.analyze_user_data(target_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    result JSON;
    projects_data JSON;
    key_results_data JSON;
    objectives_data JSON;
BEGIN
    -- Get user's projects data
    SELECT json_agg(row_to_json(p)) INTO projects_data
    FROM strategic_projects p
    WHERE p.owner_id = target_user_id OR target_user_id IN (
        SELECT pm.user_id FROM project_members pm WHERE pm.project_id = p.id
    );
    
    -- Get user's key results data (replacing indicators)
    SELECT json_agg(json_build_object(
        'id', kr.id,
        'name', kr.title,
        'current_value', kr.current_value,
        'target_value', kr.target_value,
        'unit', kr.unit,
        'category', 'key_result',
        'status', kr.status,
        'owner_id', kr.owner_id,
        'objective_id', kr.objective_id,
        'due_date', kr.due_date,
        'created_at', kr.created_at,
        'updated_at', kr.updated_at
    )) INTO key_results_data
    FROM key_results kr
    WHERE kr.owner_id = target_user_id;
    
    -- Get user's objectives data
    SELECT json_agg(row_to_json(o)) INTO objectives_data
    FROM strategic_objectives o
    WHERE o.owner_id = target_user_id;
    
    -- Build result (keeping 'indicators' key for backward compatibility with edge function)
    result := json_build_object(
        'projects', COALESCE(projects_data, '[]'::JSON),
        'indicators', COALESCE(key_results_data, '[]'::JSON),
        'objectives', COALESCE(objectives_data, '[]'::JSON),
        'analysis_timestamp', NOW()
    );
    
    RETURN result;
END;
$function$