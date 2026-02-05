-- Remove 'last' aggregation type support from calculate_kr_metrics function
-- KRs with 'last' will fallback to 'sum' in calculations

CREATE OR REPLACE FUNCTION public.calculate_kr_metrics(kr_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  kr RECORD;
  current_month INTEGER;
  current_year INTEGER;
  month_key TEXT;
  ytd_target_val NUMERIC := 0;
  ytd_actual_val NUMERIC := 0;
  yearly_target_val NUMERIC := 0;
  yearly_actual_val NUMERIC := 0;
  current_month_target_val NUMERIC := 0;
  current_month_actual_val NUMERIC := 0;
  q1_target_val NUMERIC := 0;
  q1_actual_val NUMERIC := 0;
  q2_target_val NUMERIC := 0;
  q2_actual_val NUMERIC := 0;
  q3_target_val NUMERIC := 0;
  q3_actual_val NUMERIC := 0;
  q4_target_val NUMERIC := 0;
  q4_actual_val NUMERIC := 0;
  ytd_pct NUMERIC := 0;
  yearly_pct NUMERIC := 0;
  monthly_pct NUMERIC := 0;
  q1_pct NUMERIC := 0;
  q2_pct NUMERIC := 0;
  q3_pct NUMERIC := 0;
  q4_pct NUMERIC := 0;
  i INTEGER;
  month_target NUMERIC;
  month_actual NUMERIC;
  ytd_count INTEGER := 0;
  yearly_count INTEGER := 0;
  q1_count INTEGER := 0;
  q2_count INTEGER := 0;
  q3_count INTEGER := 0;
  q4_count INTEGER := 0;
BEGIN
  -- Get KR data
  SELECT * INTO kr FROM key_results WHERE id = kr_id;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Get current month and year
  current_month := EXTRACT(MONTH FROM CURRENT_DATE);
  current_year := EXTRACT(YEAR FROM CURRENT_DATE);
  
  -- Get current month target and actual
  month_key := current_year || '-' || LPAD(current_month::TEXT, 2, '0');
  current_month_target_val := COALESCE((kr.monthly_targets->>month_key)::NUMERIC, 0);
  current_month_actual_val := COALESCE((kr.monthly_actual->>month_key)::NUMERIC, 0);
  
  -- Calculate YTD (months 1 to current_month) based on aggregation type
  IF kr.aggregation_type = 'average' THEN
    FOR i IN 1..current_month LOOP
      month_key := current_year || '-' || LPAD(i::TEXT, 2, '0');
      month_target := COALESCE((kr.monthly_targets->>month_key)::NUMERIC, 0);
      month_actual := COALESCE((kr.monthly_actual->>month_key)::NUMERIC, 0);
      IF month_actual > 0 OR month_target > 0 THEN
        ytd_target_val := ytd_target_val + month_target;
        ytd_actual_val := ytd_actual_val + month_actual;
        ytd_count := ytd_count + 1;
      END IF;
    END LOOP;
    IF ytd_count > 0 THEN
      ytd_target_val := ytd_target_val / ytd_count;
      ytd_actual_val := ytd_actual_val / ytd_count;
    END IF;
  ELSIF kr.aggregation_type = 'max' THEN
    FOR i IN 1..current_month LOOP
      month_key := current_year || '-' || LPAD(i::TEXT, 2, '0');
      month_target := COALESCE((kr.monthly_targets->>month_key)::NUMERIC, 0);
      month_actual := COALESCE((kr.monthly_actual->>month_key)::NUMERIC, 0);
      IF month_target > ytd_target_val THEN ytd_target_val := month_target; END IF;
      IF month_actual > ytd_actual_val THEN ytd_actual_val := month_actual; END IF;
    END LOOP;
  ELSIF kr.aggregation_type = 'min' THEN
    ytd_target_val := NULL;
    ytd_actual_val := NULL;
    FOR i IN 1..current_month LOOP
      month_key := current_year || '-' || LPAD(i::TEXT, 2, '0');
      month_target := COALESCE((kr.monthly_targets->>month_key)::NUMERIC, 0);
      month_actual := COALESCE((kr.monthly_actual->>month_key)::NUMERIC, 0);
      IF month_target > 0 THEN
        IF ytd_target_val IS NULL OR month_target < ytd_target_val THEN
          ytd_target_val := month_target;
        END IF;
      END IF;
      IF month_actual > 0 THEN
        IF ytd_actual_val IS NULL OR month_actual < ytd_actual_val THEN
          ytd_actual_val := month_actual;
        END IF;
      END IF;
    END LOOP;
    ytd_target_val := COALESCE(ytd_target_val, 0);
    ytd_actual_val := COALESCE(ytd_actual_val, 0);
  ELSE
    -- Default: sum (including fallback for 'last' which is no longer supported)
    FOR i IN 1..current_month LOOP
      month_key := current_year || '-' || LPAD(i::TEXT, 2, '0');
      ytd_target_val := ytd_target_val + COALESCE((kr.monthly_targets->>month_key)::NUMERIC, 0);
      ytd_actual_val := ytd_actual_val + COALESCE((kr.monthly_actual->>month_key)::NUMERIC, 0);
    END LOOP;
  END IF;
  
  -- Calculate Yearly (all 12 months) based on aggregation type
  IF kr.aggregation_type = 'average' THEN
    FOR i IN 1..12 LOOP
      month_key := current_year || '-' || LPAD(i::TEXT, 2, '0');
      month_target := COALESCE((kr.monthly_targets->>month_key)::NUMERIC, 0);
      month_actual := COALESCE((kr.monthly_actual->>month_key)::NUMERIC, 0);
      IF month_actual > 0 OR month_target > 0 THEN
        yearly_target_val := yearly_target_val + month_target;
        yearly_actual_val := yearly_actual_val + month_actual;
        yearly_count := yearly_count + 1;
      END IF;
    END LOOP;
    IF yearly_count > 0 THEN
      yearly_target_val := yearly_target_val / yearly_count;
      yearly_actual_val := yearly_actual_val / yearly_count;
    END IF;
  ELSIF kr.aggregation_type = 'max' THEN
    FOR i IN 1..12 LOOP
      month_key := current_year || '-' || LPAD(i::TEXT, 2, '0');
      month_target := COALESCE((kr.monthly_targets->>month_key)::NUMERIC, 0);
      month_actual := COALESCE((kr.monthly_actual->>month_key)::NUMERIC, 0);
      IF month_target > yearly_target_val THEN yearly_target_val := month_target; END IF;
      IF month_actual > yearly_actual_val THEN yearly_actual_val := month_actual; END IF;
    END LOOP;
  ELSIF kr.aggregation_type = 'min' THEN
    yearly_target_val := NULL;
    yearly_actual_val := NULL;
    FOR i IN 1..12 LOOP
      month_key := current_year || '-' || LPAD(i::TEXT, 2, '0');
      month_target := COALESCE((kr.monthly_targets->>month_key)::NUMERIC, 0);
      month_actual := COALESCE((kr.monthly_actual->>month_key)::NUMERIC, 0);
      IF month_target > 0 THEN
        IF yearly_target_val IS NULL OR month_target < yearly_target_val THEN
          yearly_target_val := month_target;
        END IF;
      END IF;
      IF month_actual > 0 THEN
        IF yearly_actual_val IS NULL OR month_actual < yearly_actual_val THEN
          yearly_actual_val := month_actual;
        END IF;
      END IF;
    END LOOP;
    yearly_target_val := COALESCE(yearly_target_val, 0);
    yearly_actual_val := COALESCE(yearly_actual_val, 0);
  ELSE
    -- Default: sum
    FOR i IN 1..12 LOOP
      month_key := current_year || '-' || LPAD(i::TEXT, 2, '0');
      yearly_target_val := yearly_target_val + COALESCE((kr.monthly_targets->>month_key)::NUMERIC, 0);
      yearly_actual_val := yearly_actual_val + COALESCE((kr.monthly_actual->>month_key)::NUMERIC, 0);
    END LOOP;
  END IF;
  
  -- Calculate Q1 (months 1-3)
  IF kr.aggregation_type = 'average' THEN
    FOR i IN 1..3 LOOP
      month_key := current_year || '-' || LPAD(i::TEXT, 2, '0');
      month_target := COALESCE((kr.monthly_targets->>month_key)::NUMERIC, 0);
      month_actual := COALESCE((kr.monthly_actual->>month_key)::NUMERIC, 0);
      IF month_actual > 0 OR month_target > 0 THEN
        q1_target_val := q1_target_val + month_target;
        q1_actual_val := q1_actual_val + month_actual;
        q1_count := q1_count + 1;
      END IF;
    END LOOP;
    IF q1_count > 0 THEN
      q1_target_val := q1_target_val / q1_count;
      q1_actual_val := q1_actual_val / q1_count;
    END IF;
  ELSIF kr.aggregation_type = 'max' THEN
    FOR i IN 1..3 LOOP
      month_key := current_year || '-' || LPAD(i::TEXT, 2, '0');
      month_target := COALESCE((kr.monthly_targets->>month_key)::NUMERIC, 0);
      month_actual := COALESCE((kr.monthly_actual->>month_key)::NUMERIC, 0);
      IF month_target > q1_target_val THEN q1_target_val := month_target; END IF;
      IF month_actual > q1_actual_val THEN q1_actual_val := month_actual; END IF;
    END LOOP;
  ELSIF kr.aggregation_type = 'min' THEN
    q1_target_val := NULL;
    q1_actual_val := NULL;
    FOR i IN 1..3 LOOP
      month_key := current_year || '-' || LPAD(i::TEXT, 2, '0');
      month_target := COALESCE((kr.monthly_targets->>month_key)::NUMERIC, 0);
      month_actual := COALESCE((kr.monthly_actual->>month_key)::NUMERIC, 0);
      IF month_target > 0 THEN
        IF q1_target_val IS NULL OR month_target < q1_target_val THEN
          q1_target_val := month_target;
        END IF;
      END IF;
      IF month_actual > 0 THEN
        IF q1_actual_val IS NULL OR month_actual < q1_actual_val THEN
          q1_actual_val := month_actual;
        END IF;
      END IF;
    END LOOP;
    q1_target_val := COALESCE(q1_target_val, 0);
    q1_actual_val := COALESCE(q1_actual_val, 0);
  ELSE
    FOR i IN 1..3 LOOP
      month_key := current_year || '-' || LPAD(i::TEXT, 2, '0');
      q1_target_val := q1_target_val + COALESCE((kr.monthly_targets->>month_key)::NUMERIC, 0);
      q1_actual_val := q1_actual_val + COALESCE((kr.monthly_actual->>month_key)::NUMERIC, 0);
    END LOOP;
  END IF;
  
  -- Calculate Q2 (months 4-6)
  IF kr.aggregation_type = 'average' THEN
    FOR i IN 4..6 LOOP
      month_key := current_year || '-' || LPAD(i::TEXT, 2, '0');
      month_target := COALESCE((kr.monthly_targets->>month_key)::NUMERIC, 0);
      month_actual := COALESCE((kr.monthly_actual->>month_key)::NUMERIC, 0);
      IF month_actual > 0 OR month_target > 0 THEN
        q2_target_val := q2_target_val + month_target;
        q2_actual_val := q2_actual_val + month_actual;
        q2_count := q2_count + 1;
      END IF;
    END LOOP;
    IF q2_count > 0 THEN
      q2_target_val := q2_target_val / q2_count;
      q2_actual_val := q2_actual_val / q2_count;
    END IF;
  ELSIF kr.aggregation_type = 'max' THEN
    FOR i IN 4..6 LOOP
      month_key := current_year || '-' || LPAD(i::TEXT, 2, '0');
      month_target := COALESCE((kr.monthly_targets->>month_key)::NUMERIC, 0);
      month_actual := COALESCE((kr.monthly_actual->>month_key)::NUMERIC, 0);
      IF month_target > q2_target_val THEN q2_target_val := month_target; END IF;
      IF month_actual > q2_actual_val THEN q2_actual_val := month_actual; END IF;
    END LOOP;
  ELSIF kr.aggregation_type = 'min' THEN
    q2_target_val := NULL;
    q2_actual_val := NULL;
    FOR i IN 4..6 LOOP
      month_key := current_year || '-' || LPAD(i::TEXT, 2, '0');
      month_target := COALESCE((kr.monthly_targets->>month_key)::NUMERIC, 0);
      month_actual := COALESCE((kr.monthly_actual->>month_key)::NUMERIC, 0);
      IF month_target > 0 THEN
        IF q2_target_val IS NULL OR month_target < q2_target_val THEN
          q2_target_val := month_target;
        END IF;
      END IF;
      IF month_actual > 0 THEN
        IF q2_actual_val IS NULL OR month_actual < q2_actual_val THEN
          q2_actual_val := month_actual;
        END IF;
      END IF;
    END LOOP;
    q2_target_val := COALESCE(q2_target_val, 0);
    q2_actual_val := COALESCE(q2_actual_val, 0);
  ELSE
    FOR i IN 4..6 LOOP
      month_key := current_year || '-' || LPAD(i::TEXT, 2, '0');
      q2_target_val := q2_target_val + COALESCE((kr.monthly_targets->>month_key)::NUMERIC, 0);
      q2_actual_val := q2_actual_val + COALESCE((kr.monthly_actual->>month_key)::NUMERIC, 0);
    END LOOP;
  END IF;
  
  -- Calculate Q3 (months 7-9)
  IF kr.aggregation_type = 'average' THEN
    FOR i IN 7..9 LOOP
      month_key := current_year || '-' || LPAD(i::TEXT, 2, '0');
      month_target := COALESCE((kr.monthly_targets->>month_key)::NUMERIC, 0);
      month_actual := COALESCE((kr.monthly_actual->>month_key)::NUMERIC, 0);
      IF month_actual > 0 OR month_target > 0 THEN
        q3_target_val := q3_target_val + month_target;
        q3_actual_val := q3_actual_val + month_actual;
        q3_count := q3_count + 1;
      END IF;
    END LOOP;
    IF q3_count > 0 THEN
      q3_target_val := q3_target_val / q3_count;
      q3_actual_val := q3_actual_val / q3_count;
    END IF;
  ELSIF kr.aggregation_type = 'max' THEN
    FOR i IN 7..9 LOOP
      month_key := current_year || '-' || LPAD(i::TEXT, 2, '0');
      month_target := COALESCE((kr.monthly_targets->>month_key)::NUMERIC, 0);
      month_actual := COALESCE((kr.monthly_actual->>month_key)::NUMERIC, 0);
      IF month_target > q3_target_val THEN q3_target_val := month_target; END IF;
      IF month_actual > q3_actual_val THEN q3_actual_val := month_actual; END IF;
    END LOOP;
  ELSIF kr.aggregation_type = 'min' THEN
    q3_target_val := NULL;
    q3_actual_val := NULL;
    FOR i IN 7..9 LOOP
      month_key := current_year || '-' || LPAD(i::TEXT, 2, '0');
      month_target := COALESCE((kr.monthly_targets->>month_key)::NUMERIC, 0);
      month_actual := COALESCE((kr.monthly_actual->>month_key)::NUMERIC, 0);
      IF month_target > 0 THEN
        IF q3_target_val IS NULL OR month_target < q3_target_val THEN
          q3_target_val := month_target;
        END IF;
      END IF;
      IF month_actual > 0 THEN
        IF q3_actual_val IS NULL OR month_actual < q3_actual_val THEN
          q3_actual_val := month_actual;
        END IF;
      END IF;
    END LOOP;
    q3_target_val := COALESCE(q3_target_val, 0);
    q3_actual_val := COALESCE(q3_actual_val, 0);
  ELSE
    FOR i IN 7..9 LOOP
      month_key := current_year || '-' || LPAD(i::TEXT, 2, '0');
      q3_target_val := q3_target_val + COALESCE((kr.monthly_targets->>month_key)::NUMERIC, 0);
      q3_actual_val := q3_actual_val + COALESCE((kr.monthly_actual->>month_key)::NUMERIC, 0);
    END LOOP;
  END IF;
  
  -- Calculate Q4 (months 10-12)
  IF kr.aggregation_type = 'average' THEN
    FOR i IN 10..12 LOOP
      month_key := current_year || '-' || LPAD(i::TEXT, 2, '0');
      month_target := COALESCE((kr.monthly_targets->>month_key)::NUMERIC, 0);
      month_actual := COALESCE((kr.monthly_actual->>month_key)::NUMERIC, 0);
      IF month_actual > 0 OR month_target > 0 THEN
        q4_target_val := q4_target_val + month_target;
        q4_actual_val := q4_actual_val + month_actual;
        q4_count := q4_count + 1;
      END IF;
    END LOOP;
    IF q4_count > 0 THEN
      q4_target_val := q4_target_val / q4_count;
      q4_actual_val := q4_actual_val / q4_count;
    END IF;
  ELSIF kr.aggregation_type = 'max' THEN
    FOR i IN 10..12 LOOP
      month_key := current_year || '-' || LPAD(i::TEXT, 2, '0');
      month_target := COALESCE((kr.monthly_targets->>month_key)::NUMERIC, 0);
      month_actual := COALESCE((kr.monthly_actual->>month_key)::NUMERIC, 0);
      IF month_target > q4_target_val THEN q4_target_val := month_target; END IF;
      IF month_actual > q4_actual_val THEN q4_actual_val := month_actual; END IF;
    END LOOP;
  ELSIF kr.aggregation_type = 'min' THEN
    q4_target_val := NULL;
    q4_actual_val := NULL;
    FOR i IN 10..12 LOOP
      month_key := current_year || '-' || LPAD(i::TEXT, 2, '0');
      month_target := COALESCE((kr.monthly_targets->>month_key)::NUMERIC, 0);
      month_actual := COALESCE((kr.monthly_actual->>month_key)::NUMERIC, 0);
      IF month_target > 0 THEN
        IF q4_target_val IS NULL OR month_target < q4_target_val THEN
          q4_target_val := month_target;
        END IF;
      END IF;
      IF month_actual > 0 THEN
        IF q4_actual_val IS NULL OR month_actual < q4_actual_val THEN
          q4_actual_val := month_actual;
        END IF;
      END IF;
    END LOOP;
    q4_target_val := COALESCE(q4_target_val, 0);
    q4_actual_val := COALESCE(q4_actual_val, 0);
  ELSE
    FOR i IN 10..12 LOOP
      month_key := current_year || '-' || LPAD(i::TEXT, 2, '0');
      q4_target_val := q4_target_val + COALESCE((kr.monthly_targets->>month_key)::NUMERIC, 0);
      q4_actual_val := q4_actual_val + COALESCE((kr.monthly_actual->>month_key)::NUMERIC, 0);
    END LOOP;
  END IF;
  
  -- Calculate percentages based on target_direction
  -- For minimize: percentage = (target/actual)*100 when actual > 0
  -- For maximize: percentage = (actual/target)*100 when target > 0
  IF kr.target_direction = 'minimize' THEN
    -- YTD
    IF ytd_actual_val > 0 THEN
      ytd_pct := (ytd_target_val / ytd_actual_val) * 100;
    ELSE
      ytd_pct := 0;
    END IF;
    -- Yearly
    IF yearly_actual_val > 0 THEN
      yearly_pct := (yearly_target_val / yearly_actual_val) * 100;
    ELSE
      yearly_pct := 0;
    END IF;
    -- Monthly
    IF current_month_actual_val > 0 THEN
      monthly_pct := (current_month_target_val / current_month_actual_val) * 100;
    ELSE
      monthly_pct := 0;
    END IF;
    -- Q1
    IF q1_actual_val > 0 THEN
      q1_pct := (q1_target_val / q1_actual_val) * 100;
    ELSE
      q1_pct := 0;
    END IF;
    -- Q2
    IF q2_actual_val > 0 THEN
      q2_pct := (q2_target_val / q2_actual_val) * 100;
    ELSE
      q2_pct := 0;
    END IF;
    -- Q3
    IF q3_actual_val > 0 THEN
      q3_pct := (q3_target_val / q3_actual_val) * 100;
    ELSE
      q3_pct := 0;
    END IF;
    -- Q4
    IF q4_actual_val > 0 THEN
      q4_pct := (q4_target_val / q4_actual_val) * 100;
    ELSE
      q4_pct := 0;
    END IF;
  ELSE
    -- Default: maximize
    -- YTD
    IF ytd_target_val > 0 THEN
      ytd_pct := (ytd_actual_val / ytd_target_val) * 100;
    ELSE
      ytd_pct := 0;
    END IF;
    -- Yearly
    IF yearly_target_val > 0 THEN
      yearly_pct := (yearly_actual_val / yearly_target_val) * 100;
    ELSE
      yearly_pct := 0;
    END IF;
    -- Monthly
    IF current_month_target_val > 0 THEN
      monthly_pct := (current_month_actual_val / current_month_target_val) * 100;
    ELSE
      monthly_pct := 0;
    END IF;
    -- Q1
    IF q1_target_val > 0 THEN
      q1_pct := (q1_actual_val / q1_target_val) * 100;
    ELSE
      q1_pct := 0;
    END IF;
    -- Q2
    IF q2_target_val > 0 THEN
      q2_pct := (q2_actual_val / q2_target_val) * 100;
    ELSE
      q2_pct := 0;
    END IF;
    -- Q3
    IF q3_target_val > 0 THEN
      q3_pct := (q3_actual_val / q3_target_val) * 100;
    ELSE
      q3_pct := 0;
    END IF;
    -- Q4
    IF q4_target_val > 0 THEN
      q4_pct := (q4_actual_val / q4_target_val) * 100;
    ELSE
      q4_pct := 0;
    END IF;
  END IF;
  
  -- Update the key_result with calculated values
  UPDATE key_results SET
    ytd_target = ytd_target_val,
    ytd_actual = ytd_actual_val,
    ytd_percentage = ytd_pct,
    yearly_target = yearly_target_val,
    yearly_actual = yearly_actual_val,
    yearly_percentage = yearly_pct,
    current_month_target = current_month_target_val,
    current_month_actual = current_month_actual_val,
    monthly_percentage = monthly_pct,
    q1_target = q1_target_val,
    q1_actual = q1_actual_val,
    q1_percentage = q1_pct,
    q2_target = q2_target_val,
    q2_actual = q2_actual_val,
    q2_percentage = q2_pct,
    q3_target = q3_target_val,
    q3_actual = q3_actual_val,
    q3_percentage = q3_pct,
    q4_target = q4_target_val,
    q4_actual = q4_actual_val,
    q4_percentage = q4_pct,
    updated_at = NOW()
  WHERE id = kr_id;
END;
$function$;