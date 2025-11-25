-- Adicionar campos de Quarter na tabela key_results
ALTER TABLE key_results
ADD COLUMN q1_target NUMERIC DEFAULT 0,
ADD COLUMN q1_actual NUMERIC DEFAULT 0,
ADD COLUMN q1_percentage NUMERIC DEFAULT 0,
ADD COLUMN q2_target NUMERIC DEFAULT 0,
ADD COLUMN q2_actual NUMERIC DEFAULT 0,
ADD COLUMN q2_percentage NUMERIC DEFAULT 0,
ADD COLUMN q3_target NUMERIC DEFAULT 0,
ADD COLUMN q3_actual NUMERIC DEFAULT 0,
ADD COLUMN q3_percentage NUMERIC DEFAULT 0,
ADD COLUMN q4_target NUMERIC DEFAULT 0,
ADD COLUMN q4_actual NUMERIC DEFAULT 0,
ADD COLUMN q4_percentage NUMERIC DEFAULT 0;

-- Atualizar função calculate_kr_metrics para incluir cálculo de quarters
CREATE OR REPLACE FUNCTION public.calculate_kr_metrics(kr_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $function$
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
  
  -- Quarter variables
  q1_target_val NUMERIC := 0;
  q1_actual_val NUMERIC := 0;
  q1_percentage_val NUMERIC := 0;
  q2_target_val NUMERIC := 0;
  q2_actual_val NUMERIC := 0;
  q2_percentage_val NUMERIC := 0;
  q3_target_val NUMERIC := 0;
  q3_actual_val NUMERIC := 0;
  q3_percentage_val NUMERIC := 0;
  q4_target_val NUMERIC := 0;
  q4_actual_val NUMERIC := 0;
  q4_percentage_val NUMERIC := 0;
  quarter_month_count INT;
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
  
  -- Calculate Quarter values (Q1: Jan-Mar, Q2: Apr-Jun, Q3: Jul-Sep, Q4: Oct-Dec)
  -- Q1 (months 1-3)
  quarter_month_count := 0;
  IF kr.aggregation_type = 'sum' THEN
    FOR i IN 1..3 LOOP
      month_key := current_year || '-' || LPAD(i::TEXT, 2, '0');
      IF kr.monthly_targets ? month_key THEN
        q1_target_val := q1_target_val + COALESCE((kr.monthly_targets->>month_key)::NUMERIC, 0);
      END IF;
      IF kr.monthly_actual ? month_key THEN
        q1_actual_val := q1_actual_val + COALESCE((kr.monthly_actual->>month_key)::NUMERIC, 0);
      END IF;
    END LOOP;
  ELSIF kr.aggregation_type = 'average' THEN
    FOR i IN 1..3 LOOP
      month_key := current_year || '-' || LPAD(i::TEXT, 2, '0');
      IF kr.monthly_targets ? month_key AND kr.monthly_actual ? month_key THEN
        q1_target_val := q1_target_val + COALESCE((kr.monthly_targets->>month_key)::NUMERIC, 0);
        q1_actual_val := q1_actual_val + COALESCE((kr.monthly_actual->>month_key)::NUMERIC, 0);
        quarter_month_count := quarter_month_count + 1;
      END IF;
    END LOOP;
    IF quarter_month_count > 0 THEN
      q1_target_val := q1_target_val / quarter_month_count;
      q1_actual_val := q1_actual_val / quarter_month_count;
    END IF;
  ELSIF kr.aggregation_type = 'max' THEN
    q1_target_val := -999999999;
    q1_actual_val := -999999999;
    FOR i IN 1..3 LOOP
      month_key := current_year || '-' || LPAD(i::TEXT, 2, '0');
      IF kr.monthly_targets ? month_key THEN
        month_target := (kr.monthly_targets->>month_key)::NUMERIC;
        IF month_target > q1_target_val THEN q1_target_val := month_target; END IF;
      END IF;
      IF kr.monthly_actual ? month_key THEN
        month_actual := (kr.monthly_actual->>month_key)::NUMERIC;
        IF month_actual > q1_actual_val THEN q1_actual_val := month_actual; END IF;
      END IF;
    END LOOP;
    IF q1_target_val = -999999999 THEN q1_target_val := 0; END IF;
    IF q1_actual_val = -999999999 THEN q1_actual_val := 0; END IF;
  ELSIF kr.aggregation_type = 'min' THEN
    q1_target_val := 999999999;
    q1_actual_val := 999999999;
    FOR i IN 1..3 LOOP
      month_key := current_year || '-' || LPAD(i::TEXT, 2, '0');
      IF kr.monthly_targets ? month_key THEN
        month_target := (kr.monthly_targets->>month_key)::NUMERIC;
        IF month_target < q1_target_val THEN q1_target_val := month_target; END IF;
      END IF;
      IF kr.monthly_actual ? month_key THEN
        month_actual := (kr.monthly_actual->>month_key)::NUMERIC;
        IF month_actual < q1_actual_val THEN q1_actual_val := month_actual; END IF;
      END IF;
    END LOOP;
    IF q1_target_val = 999999999 THEN q1_target_val := 0; END IF;
    IF q1_actual_val = 999999999 THEN q1_actual_val := 0; END IF;
  END IF;
  
  -- Q2 (months 4-6)
  quarter_month_count := 0;
  IF kr.aggregation_type = 'sum' THEN
    FOR i IN 4..6 LOOP
      month_key := current_year || '-' || LPAD(i::TEXT, 2, '0');
      IF kr.monthly_targets ? month_key THEN
        q2_target_val := q2_target_val + COALESCE((kr.monthly_targets->>month_key)::NUMERIC, 0);
      END IF;
      IF kr.monthly_actual ? month_key THEN
        q2_actual_val := q2_actual_val + COALESCE((kr.monthly_actual->>month_key)::NUMERIC, 0);
      END IF;
    END LOOP;
  ELSIF kr.aggregation_type = 'average' THEN
    FOR i IN 4..6 LOOP
      month_key := current_year || '-' || LPAD(i::TEXT, 2, '0');
      IF kr.monthly_targets ? month_key AND kr.monthly_actual ? month_key THEN
        q2_target_val := q2_target_val + COALESCE((kr.monthly_targets->>month_key)::NUMERIC, 0);
        q2_actual_val := q2_actual_val + COALESCE((kr.monthly_actual->>month_key)::NUMERIC, 0);
        quarter_month_count := quarter_month_count + 1;
      END IF;
    END LOOP;
    IF quarter_month_count > 0 THEN
      q2_target_val := q2_target_val / quarter_month_count;
      q2_actual_val := q2_actual_val / quarter_month_count;
    END IF;
  ELSIF kr.aggregation_type = 'max' THEN
    q2_target_val := -999999999;
    q2_actual_val := -999999999;
    FOR i IN 4..6 LOOP
      month_key := current_year || '-' || LPAD(i::TEXT, 2, '0');
      IF kr.monthly_targets ? month_key THEN
        month_target := (kr.monthly_targets->>month_key)::NUMERIC;
        IF month_target > q2_target_val THEN q2_target_val := month_target; END IF;
      END IF;
      IF kr.monthly_actual ? month_key THEN
        month_actual := (kr.monthly_actual->>month_key)::NUMERIC;
        IF month_actual > q2_actual_val THEN q2_actual_val := month_actual; END IF;
      END IF;
    END LOOP;
    IF q2_target_val = -999999999 THEN q2_target_val := 0; END IF;
    IF q2_actual_val = -999999999 THEN q2_actual_val := 0; END IF;
  ELSIF kr.aggregation_type = 'min' THEN
    q2_target_val := 999999999;
    q2_actual_val := 999999999;
    FOR i IN 4..6 LOOP
      month_key := current_year || '-' || LPAD(i::TEXT, 2, '0');
      IF kr.monthly_targets ? month_key THEN
        month_target := (kr.monthly_targets->>month_key)::NUMERIC;
        IF month_target < q2_target_val THEN q2_target_val := month_target; END IF;
      END IF;
      IF kr.monthly_actual ? month_key THEN
        month_actual := (kr.monthly_actual->>month_key)::NUMERIC;
        IF month_actual < q2_actual_val THEN q2_actual_val := month_actual; END IF;
      END IF;
    END LOOP;
    IF q2_target_val = 999999999 THEN q2_target_val := 0; END IF;
    IF q2_actual_val = 999999999 THEN q2_actual_val := 0; END IF;
  END IF;
  
  -- Q3 (months 7-9)
  quarter_month_count := 0;
  IF kr.aggregation_type = 'sum' THEN
    FOR i IN 7..9 LOOP
      month_key := current_year || '-' || LPAD(i::TEXT, 2, '0');
      IF kr.monthly_targets ? month_key THEN
        q3_target_val := q3_target_val + COALESCE((kr.monthly_targets->>month_key)::NUMERIC, 0);
      END IF;
      IF kr.monthly_actual ? month_key THEN
        q3_actual_val := q3_actual_val + COALESCE((kr.monthly_actual->>month_key)::NUMERIC, 0);
      END IF;
    END LOOP;
  ELSIF kr.aggregation_type = 'average' THEN
    FOR i IN 7..9 LOOP
      month_key := current_year || '-' || LPAD(i::TEXT, 2, '0');
      IF kr.monthly_targets ? month_key AND kr.monthly_actual ? month_key THEN
        q3_target_val := q3_target_val + COALESCE((kr.monthly_targets->>month_key)::NUMERIC, 0);
        q3_actual_val := q3_actual_val + COALESCE((kr.monthly_actual->>month_key)::NUMERIC, 0);
        quarter_month_count := quarter_month_count + 1;
      END IF;
    END LOOP;
    IF quarter_month_count > 0 THEN
      q3_target_val := q3_target_val / quarter_month_count;
      q3_actual_val := q3_actual_val / quarter_month_count;
    END IF;
  ELSIF kr.aggregation_type = 'max' THEN
    q3_target_val := -999999999;
    q3_actual_val := -999999999;
    FOR i IN 7..9 LOOP
      month_key := current_year || '-' || LPAD(i::TEXT, 2, '0');
      IF kr.monthly_targets ? month_key THEN
        month_target := (kr.monthly_targets->>month_key)::NUMERIC;
        IF month_target > q3_target_val THEN q3_target_val := month_target; END IF;
      END IF;
      IF kr.monthly_actual ? month_key THEN
        month_actual := (kr.monthly_actual->>month_key)::NUMERIC;
        IF month_actual > q3_actual_val THEN q3_actual_val := month_actual; END IF;
      END IF;
    END LOOP;
    IF q3_target_val = -999999999 THEN q3_target_val := 0; END IF;
    IF q3_actual_val = -999999999 THEN q3_actual_val := 0; END IF;
  ELSIF kr.aggregation_type = 'min' THEN
    q3_target_val := 999999999;
    q3_actual_val := 999999999;
    FOR i IN 7..9 LOOP
      month_key := current_year || '-' || LPAD(i::TEXT, 2, '0');
      IF kr.monthly_targets ? month_key THEN
        month_target := (kr.monthly_targets->>month_key)::NUMERIC;
        IF month_target < q3_target_val THEN q3_target_val := month_target; END IF;
      END IF;
      IF kr.monthly_actual ? month_key THEN
        month_actual := (kr.monthly_actual->>month_key)::NUMERIC;
        IF month_actual < q3_actual_val THEN q3_actual_val := month_actual; END IF;
      END IF;
    END LOOP;
    IF q3_target_val = 999999999 THEN q3_target_val := 0; END IF;
    IF q3_actual_val = 999999999 THEN q3_actual_val := 0; END IF;
  END IF;
  
  -- Q4 (months 10-12)
  quarter_month_count := 0;
  IF kr.aggregation_type = 'sum' THEN
    FOR i IN 10..12 LOOP
      month_key := current_year || '-' || LPAD(i::TEXT, 2, '0');
      IF kr.monthly_targets ? month_key THEN
        q4_target_val := q4_target_val + COALESCE((kr.monthly_targets->>month_key)::NUMERIC, 0);
      END IF;
      IF kr.monthly_actual ? month_key THEN
        q4_actual_val := q4_actual_val + COALESCE((kr.monthly_actual->>month_key)::NUMERIC, 0);
      END IF;
    END LOOP;
  ELSIF kr.aggregation_type = 'average' THEN
    FOR i IN 10..12 LOOP
      month_key := current_year || '-' || LPAD(i::TEXT, 2, '0');
      IF kr.monthly_targets ? month_key AND kr.monthly_actual ? month_key THEN
        q4_target_val := q4_target_val + COALESCE((kr.monthly_targets->>month_key)::NUMERIC, 0);
        q4_actual_val := q4_actual_val + COALESCE((kr.monthly_actual->>month_key)::NUMERIC, 0);
        quarter_month_count := quarter_month_count + 1;
      END IF;
    END LOOP;
    IF quarter_month_count > 0 THEN
      q4_target_val := q4_target_val / quarter_month_count;
      q4_actual_val := q4_actual_val / quarter_month_count;
    END IF;
  ELSIF kr.aggregation_type = 'max' THEN
    q4_target_val := -999999999;
    q4_actual_val := -999999999;
    FOR i IN 10..12 LOOP
      month_key := current_year || '-' || LPAD(i::TEXT, 2, '0');
      IF kr.monthly_targets ? month_key THEN
        month_target := (kr.monthly_targets->>month_key)::NUMERIC;
        IF month_target > q4_target_val THEN q4_target_val := month_target; END IF;
      END IF;
      IF kr.monthly_actual ? month_key THEN
        month_actual := (kr.monthly_actual->>month_key)::NUMERIC;
        IF month_actual > q4_actual_val THEN q4_actual_val := month_actual; END IF;
      END IF;
    END LOOP;
    IF q4_target_val = -999999999 THEN q4_target_val := 0; END IF;
    IF q4_actual_val = -999999999 THEN q4_actual_val := 0; END IF;
  ELSIF kr.aggregation_type = 'min' THEN
    q4_target_val := 999999999;
    q4_actual_val := 999999999;
    FOR i IN 10..12 LOOP
      month_key := current_year || '-' || LPAD(i::TEXT, 2, '0');
      IF kr.monthly_targets ? month_key THEN
        month_target := (kr.monthly_targets->>month_key)::NUMERIC;
        IF month_target < q4_target_val THEN q4_target_val := month_target; END IF;
      END IF;
      IF kr.monthly_actual ? month_key THEN
        month_actual := (kr.monthly_actual->>month_key)::NUMERIC;
        IF month_actual < q4_actual_val THEN q4_actual_val := month_actual; END IF;
      END IF;
    END LOOP;
    IF q4_target_val = 999999999 THEN q4_target_val := 0; END IF;
    IF q4_actual_val = 999999999 THEN q4_actual_val := 0; END IF;
  END IF;
  
  -- Calculate percentages for quarters based on target_direction
  IF kr.target_direction = 'maximize' THEN
    IF q1_target_val > 0 THEN
      q1_percentage_val := ROUND((q1_actual_val / q1_target_val) * 100, 2);
    END IF;
    IF q2_target_val > 0 THEN
      q2_percentage_val := ROUND((q2_actual_val / q2_target_val) * 100, 2);
    END IF;
    IF q3_target_val > 0 THEN
      q3_percentage_val := ROUND((q3_actual_val / q3_target_val) * 100, 2);
    END IF;
    IF q4_target_val > 0 THEN
      q4_percentage_val := ROUND((q4_actual_val / q4_target_val) * 100, 2);
    END IF;
    
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
    IF q1_actual_val > 0 THEN
      q1_percentage_val := ROUND((q1_target_val / q1_actual_val) * 100, 2);
    ELSIF q1_target_val = 0 THEN
      q1_percentage_val := 100;
    END IF;
    
    IF q2_actual_val > 0 THEN
      q2_percentage_val := ROUND((q2_target_val / q2_actual_val) * 100, 2);
    ELSIF q2_target_val = 0 THEN
      q2_percentage_val := 100;
    END IF;
    
    IF q3_actual_val > 0 THEN
      q3_percentage_val := ROUND((q3_target_val / q3_actual_val) * 100, 2);
    ELSIF q3_target_val = 0 THEN
      q3_percentage_val := 100;
    END IF;
    
    IF q4_actual_val > 0 THEN
      q4_percentage_val := ROUND((q4_target_val / q4_actual_val) * 100, 2);
    ELSIF q4_target_val = 0 THEN
      q4_percentage_val := 100;
    END IF;
    
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
    q1_target = q1_target_val,
    q1_actual = q1_actual_val,
    q1_percentage = q1_percentage_val,
    q2_target = q2_target_val,
    q2_actual = q2_actual_val,
    q2_percentage = q2_percentage_val,
    q3_target = q3_target_val,
    q3_actual = q3_actual_val,
    q3_percentage = q3_percentage_val,
    q4_target = q4_target_val,
    q4_actual = q4_actual_val,
    q4_percentage = q4_percentage_val,
    last_updated = NOW()
  WHERE id = kr_id;
END;
$function$;