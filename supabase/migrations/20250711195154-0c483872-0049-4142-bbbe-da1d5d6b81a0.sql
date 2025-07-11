-- Add confirmed_at field to ai_insights to track when insights were confirmed
ALTER TABLE public.ai_insights 
ADD COLUMN confirmed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN confirmed_by UUID;

-- Add index for better performance when querying confirmed insights
CREATE INDEX idx_ai_insights_confirmed ON public.ai_insights(confirmed_at, status);

-- Update RLS policies to ensure proper data access
DROP POLICY IF EXISTS "Users can view their own insights" ON public.ai_insights;
CREATE POLICY "Users can view their own insights" 
ON public.ai_insights 
FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own insights" ON public.ai_insights;
CREATE POLICY "Users can update their own insights" 
ON public.ai_insights 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create function to generate insights based on real data
CREATE OR REPLACE FUNCTION public.analyze_user_data(target_user_id UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
    projects_data JSON;
    indicators_data JSON;
    objectives_data JSON;
BEGIN
    -- Get user's projects data
    SELECT json_agg(row_to_json(p)) INTO projects_data
    FROM strategic_projects p
    WHERE p.owner_id = target_user_id OR target_user_id IN (
        SELECT pm.user_id FROM project_members pm WHERE pm.project_id = p.id
    );
    
    -- Get user's indicators data
    SELECT json_agg(row_to_json(i)) INTO indicators_data
    FROM indicators i
    WHERE i.owner_id = target_user_id;
    
    -- Get user's objectives data
    SELECT json_agg(row_to_json(o)) INTO objectives_data
    FROM strategic_objectives o
    WHERE o.owner_id = target_user_id;
    
    -- Build result
    result := json_build_object(
        'projects', COALESCE(projects_data, '[]'::JSON),
        'indicators', COALESCE(indicators_data, '[]'::JSON),
        'objectives', COALESCE(objectives_data, '[]'::JSON),
        'analysis_timestamp', NOW()
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;