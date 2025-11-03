-- Add calculated columns to key_results table
ALTER TABLE key_results 
ADD COLUMN IF NOT EXISTS ytd_target NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS ytd_actual NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_month_target NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_month_actual NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS ytd_percentage NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS monthly_percentage NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS yearly_percentage NUMERIC DEFAULT 0;

-- Create function to calculate KR metrics
CREATE OR REPLACE FUNCTION calculate_kr_metrics(kr_id UUID)
RETURNS void AS $$
DECLARE
  kr RECORD;
  current_year INT;
  current_month INT;
  current_month_key TEXT;
  ytd_target_val NUMERIC := 0;
  ytd_actual_val NUMERIC := 0;
  month_target_val NUMERIC := 0;
  month_actual_val NUMERIC := 0;
  year_target_val NUMERIC := 0;
  year_actual_val NUMERIC := 0;
  ytd_percentage_val NUMERIC := 0;
  monthly_percentage_val NUMERIC := 0;
  yearly_percentage_val NUMERIC := 0;
  month_key TEXT;
  month_target NUMERIC;
  month_actual NUMERIC;
  month_count INT := 0;
  ytd_month_count INT := 0;
BEGIN
  -- Get current key result data
  SELECT * INTO kr FROM key_results WHERE id = kr_id;
  
  IF kr IS NULL THEN
    RETURN;
  END IF;
  
  -- Get current date info
  current_year := EXTRACT(YEAR FROM CURRENT_DATE);
  current_month := EXTRACT(MONTH FROM CURRENT_DATE);
  current_month_key := current_year || '-' || LPAD(current_month::TEXT, 2, '0');
  
  -- Calculate current month values
  IF kr.monthly_targets ? current_month_key THEN
    month_target_val := (kr.monthly_targets->>current_month_key)::NUMERIC;
  END IF;
  
  IF kr.monthly_actual ? current_month_key THEN
    month_actual_val := (kr.monthly_actual->>current_month_key)::NUMERIC;
  END IF;
  
  -- Calculate YTD based on aggregation type
  IF kr.aggregation_type = 'sum' THEN
    -- Sum all months from January to current month
    FOR i IN 1..current_month LOOP
      month_key := current_year || '-' || LPAD(i::TEXT, 2, '0');
      
      IF kr.monthly_targets ? month_key AND kr.monthly_actual ? month_key THEN
        month_target := (kr.monthly_targets->>month_key)::NUMERIC;
        month_actual := (kr.monthly_actual->>month_key)::NUMERIC;
        
        IF month_target IS NOT NULL AND month_actual IS NOT NULL THEN
          ytd_target_val := ytd_target_val + month_target;
          ytd_actual_val := ytd_actual_val + month_actual;
          ytd_month_count := ytd_month_count + 1;
        END IF;
      END IF;
    END LOOP;
    
  ELSIF kr.aggregation_type = 'average' THEN
    -- Average all months from January to current month
    FOR i IN 1..current_month LOOP
      month_key := current_year || '-' || LPAD(i::TEXT, 2, '0');
      
      IF kr.monthly_targets ? month_key AND kr.monthly_actual ? month_key THEN
        month_target := (kr.monthly_targets->>month_key)::NUMERIC;
        month_actual := (kr.monthly_actual->>month_key)::NUMERIC;
        
        IF month_target IS NOT NULL AND month_actual IS NOT NULL THEN
          ytd_target_val := ytd_target_val + month_target;
          ytd_actual_val := ytd_actual_val + month_actual;
          ytd_month_count := ytd_month_count + 1;
        END IF;
      END IF;
    END LOOP;
    
    IF ytd_month_count > 0 THEN
      ytd_target_val := ytd_target_val / ytd_month_count;
      ytd_actual_val := ytd_actual_val / ytd_month_count;
    END IF;
    
  ELSIF kr.aggregation_type = 'max' THEN
    -- Maximum value from January to current month
    ytd_target_val := -999999999;
    ytd_actual_val := -999999999;
    
    FOR i IN 1..current_month LOOP
      month_key := current_year || '-' || LPAD(i::TEXT, 2, '0');
      
      IF kr.monthly_targets ? month_key AND kr.monthly_actual ? month_key THEN
        month_target := (kr.monthly_targets->>month_key)::NUMERIC;
        month_actual := (kr.monthly_actual->>month_key)::NUMERIC;
        
        IF month_target IS NOT NULL AND month_target > ytd_target_val THEN
          ytd_target_val := month_target;
        END IF;
        
        IF month_actual IS NOT NULL AND month_actual > ytd_actual_val THEN
          ytd_actual_val := month_actual;
        END IF;
      END IF;
    END LOOP;
    
    IF ytd_target_val = -999999999 THEN ytd_target_val := 0; END IF;
    IF ytd_actual_val = -999999999 THEN ytd_actual_val := 0; END IF;
    
  ELSIF kr.aggregation_type = 'min' THEN
    -- Minimum value from January to current month
    ytd_target_val := 999999999;
    ytd_actual_val := 999999999;
    
    FOR i IN 1..current_month LOOP
      month_key := current_year || '-' || LPAD(i::TEXT, 2, '0');
      
      IF kr.monthly_targets ? month_key AND kr.monthly_actual ? month_key THEN
        month_target := (kr.monthly_targets->>month_key)::NUMERIC;
        month_actual := (kr.monthly_actual->>month_key)::NUMERIC;
        
        IF month_target IS NOT NULL AND month_target < ytd_target_val THEN
          ytd_target_val := month_target;
        END IF;
        
        IF month_actual IS NOT NULL AND month_actual < ytd_actual_val THEN
          ytd_actual_val := month_actual;
        END IF;
      END IF;
    END LOOP;
    
    IF ytd_target_val = 999999999 THEN ytd_target_val := 0; END IF;
    IF ytd_actual_val = 999999999 THEN ytd_actual_val := 0; END IF;
  END IF;
  
  -- Calculate yearly values
  year_target_val := COALESCE(kr.yearly_target, 0);
  year_actual_val := COALESCE(kr.yearly_actual, 0);
  
  -- Calculate percentages based on target_direction
  IF kr.target_direction = 'maximize' THEN
    -- For maximize: (actual / target) * 100
    IF month_target_val > 0 THEN
      monthly_percentage_val := ROUND((month_actual_val / month_target_val) * 100, 2);
    END IF;
    
    IF ytd_target_val > 0 THEN
      ytd_percentage_val := ROUND((ytd_actual_val / ytd_target_val) * 100, 2);
    END IF;
    
    IF year_target_val > 0 THEN
      yearly_percentage_val := ROUND((year_actual_val / year_target_val) * 100, 2);
    END IF;
    
  ELSIF kr.target_direction = 'minimize' THEN
    -- For minimize: (target / actual) * 100 if actual > 0, else 100%
    IF month_actual_val > 0 THEN
      monthly_percentage_val := ROUND((month_target_val / month_actual_val) * 100, 2);
    ELSIF month_target_val = 0 THEN
      monthly_percentage_val := 100;
    END IF;
    
    IF ytd_actual_val > 0 THEN
      ytd_percentage_val := ROUND((ytd_target_val / ytd_actual_val) * 100, 2);
    ELSIF ytd_target_val = 0 THEN
      ytd_percentage_val := 100;
    END IF;
    
    IF year_actual_val > 0 THEN
      yearly_percentage_val := ROUND((year_target_val / year_actual_val) * 100, 2);
    ELSIF year_target_val = 0 THEN
      yearly_percentage_val := 100;
    END IF;
  END IF;
  
  -- Update key result with calculated values WITHOUT triggering history
  UPDATE key_results
  SET 
    ytd_target = ytd_target_val,
    ytd_actual = ytd_actual_val,
    current_month_target = month_target_val,
    current_month_actual = month_actual_val,
    ytd_percentage = ytd_percentage_val,
    monthly_percentage = monthly_percentage_val,
    yearly_percentage = yearly_percentage_val,
    last_updated = NOW()
  WHERE id = kr_id;
END;
$$ LANGUAGE plpgsql;

-- Create trigger function to auto-calculate metrics
CREATE OR REPLACE FUNCTION trigger_calculate_kr_metrics()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM calculate_kr_metrics(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop old trigger if exists
DROP TRIGGER IF EXISTS update_kr_calculated_metrics ON key_results;

-- Create trigger to auto-calculate metrics
CREATE TRIGGER update_kr_calculated_metrics
AFTER INSERT OR UPDATE OF monthly_targets, monthly_actual, yearly_target, yearly_actual, aggregation_type, target_direction
ON key_results
FOR EACH ROW
EXECUTE FUNCTION trigger_calculate_kr_metrics();

-- Temporarily disable history trigger for initial recalculation
ALTER TABLE key_results DISABLE TRIGGER save_key_results_history_trigger;

-- Recalculate all existing key results
DO $$
DECLARE
  kr_record RECORD;
BEGIN
  FOR kr_record IN SELECT id FROM key_results LOOP
    PERFORM calculate_kr_metrics(kr_record.id);
  END LOOP;
END $$;

-- Re-enable history trigger
ALTER TABLE key_results ENABLE TRIGGER save_key_results_history_trigger;