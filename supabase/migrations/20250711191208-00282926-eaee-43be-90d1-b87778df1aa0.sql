-- Add monthly tracking fields to strategic objectives
ALTER TABLE strategic_objectives 
ADD COLUMN monthly_targets jsonb DEFAULT '{}',
ADD COLUMN monthly_actual jsonb DEFAULT '{}',
ADD COLUMN yearly_target numeric DEFAULT 0,
ADD COLUMN yearly_actual numeric DEFAULT 0;

-- Add monthly tracking fields to key results
ALTER TABLE key_results 
ADD COLUMN monthly_targets jsonb DEFAULT '{}',
ADD COLUMN monthly_actual jsonb DEFAULT '{}',
ADD COLUMN yearly_target numeric DEFAULT 0,
ADD COLUMN yearly_actual numeric DEFAULT 0;

-- Create function to calculate achievement percentage
CREATE OR REPLACE FUNCTION calculate_achievement_percentage(actual numeric, target numeric)
RETURNS numeric
LANGUAGE sql
STABLE
AS $$
  SELECT CASE 
    WHEN target = 0 THEN 0
    WHEN target > 0 THEN ROUND((actual / target) * 100, 2)
    ELSE 0
  END;
$$;

-- Create function to get current month achievement for objectives
CREATE OR REPLACE FUNCTION get_monthly_objective_achievement(objective_id uuid, target_month text)
RETURNS TABLE (
  objective_title text,
  monthly_target numeric,
  monthly_actual numeric,
  monthly_percentage numeric,
  yearly_target numeric,
  yearly_actual numeric,
  yearly_percentage numeric
)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    so.title,
    COALESCE((so.monthly_targets->>target_month)::numeric, 0) as monthly_target,
    COALESCE((so.monthly_actual->>target_month)::numeric, 0) as monthly_actual,
    calculate_achievement_percentage(
      COALESCE((so.monthly_actual->>target_month)::numeric, 0),
      COALESCE((so.monthly_targets->>target_month)::numeric, 1)
    ) as monthly_percentage,
    COALESCE(so.yearly_target, 0) as yearly_target,
    COALESCE(so.yearly_actual, 0) as yearly_actual,
    calculate_achievement_percentage(so.yearly_actual, so.yearly_target) as yearly_percentage
  FROM strategic_objectives so
  WHERE so.id = objective_id;
$$;