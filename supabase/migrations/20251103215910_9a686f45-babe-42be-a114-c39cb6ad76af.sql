-- Add support for calculating metrics for specific months
-- This allows users to view any month's data, not just the current month

-- Function to calculate KR metrics for a specific month
CREATE OR REPLACE FUNCTION calculate_kr_metrics_for_month(
  p_kr_id UUID,
  p_year INT,
  p_month INT
)
RETURNS TABLE (
  month_target NUMERIC,
  month_actual NUMERIC,
  month_percentage NUMERIC
) AS $$
DECLARE
  v_monthly_targets JSONB;
  v_monthly_actual JSONB;
  v_month_key TEXT;
  v_target NUMERIC;
  v_actual NUMERIC;
  v_percentage NUMERIC;
BEGIN
  -- Format month key as 'YYYY-MM'
  v_month_key := p_year::TEXT || '-' || LPAD(p_month::TEXT, 2, '0');
  
  -- Get monthly data from key_results table
  SELECT 
    COALESCE(kr.monthly_targets, '{}'::JSONB),
    COALESCE(kr.monthly_actual, '{}'::JSONB)
  INTO v_monthly_targets, v_monthly_actual
  FROM key_results kr
  WHERE kr.id = p_kr_id;
  
  -- Extract values for the specific month
  v_target := COALESCE((v_monthly_targets->>v_month_key)::NUMERIC, 0);
  v_actual := COALESCE((v_monthly_actual->>v_month_key)::NUMERIC, 0);
  
  -- Calculate percentage
  IF v_target > 0 THEN
    v_percentage := (v_actual / v_target) * 100;
  ELSE
    v_percentage := 0;
  END IF;
  
  RETURN QUERY SELECT v_target, v_actual, v_percentage;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;