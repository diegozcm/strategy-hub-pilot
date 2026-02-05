-- Adicionar suporte para aggregation_type = 'last' na função calculate_kr_metrics

CREATE OR REPLACE FUNCTION public.calculate_kr_metrics(kr_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  kr RECORD;
  current_month INTEGER;
  current_year INTEGER;
  month_key TEXT;
  month_target NUMERIC;
  month_actual NUMERIC;
  ytd_target_val NUMERIC := 0;
  ytd_actual_val NUMERIC := 0;
  yearly_target_val NUMERIC := 0;
  yearly_actual_val NUMERIC := 0;
  q1_target_val NUMERIC := 0;
  q1_actual_val NUMERIC := 0;
  q2_target_val NUMERIC := 0;
  q2_actual_val NUMERIC := 0;
  q3_target_val NUMERIC := 0;
  q3_actual_val NUMERIC := 0;
  q4_target_val NUMERIC := 0;
  q4_actual_val NUMERIC := 0;
  ytd_percentage_val NUMERIC := 0;
  yearly_percentage_val NUMERIC := 0;
  q1_percentage_val NUMERIC := 0;
  q2_percentage_val NUMERIC := 0;
  q3_percentage_val NUMERIC := 0;
  q4_percentage_val NUMERIC := 0;
  monthly_percentage_val NUMERIC := 0;
  current_month_target_val NUMERIC := 0;
  current_month_actual_val NUMERIC := 0;
  avg_count INTEGER := 0;
  i INTEGER;
  found_value BOOLEAN := FALSE;
BEGIN
  -- Get the KR record
  SELECT * INTO kr FROM key_results WHERE id = kr_id;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Get current month and year
  current_month := EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER;
  current_year := EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER;
  
  -- Get current month target and actual
  month_key := current_year || '-' || LPAD(current_month::TEXT, 2, '0');
  
  IF kr.monthly_targets ? month_key THEN
    current_month_target_val := COALESCE((kr.monthly_targets->>month_key)::NUMERIC, 0);
  END IF;
  
  IF kr.monthly_actual ? month_key THEN
    current_month_actual_val := COALESCE((kr.monthly_actual->>month_key)::NUMERIC, 0);
  END IF;
  
  -- Calculate monthly percentage
  IF kr.target_direction = 'minimize' THEN
    IF current_month_actual_val > 0 THEN
      monthly_percentage_val := (current_month_target_val / current_month_actual_val) * 100;
    ELSE
      monthly_percentage_val := 0;
    END IF;
  ELSE
    IF current_month_target_val > 0 THEN
      monthly_percentage_val := (current_month_actual_val / current_month_target_val) * 100;
    ELSE
      monthly_percentage_val := 0;
    END IF;
  END IF;
  
  -- Calculate YTD metrics based on aggregation_type
  IF kr.aggregation_type = 'sum' OR kr.aggregation_type IS NULL THEN
    FOR i IN 1..current_month LOOP
      month_key := current_year || '-' || LPAD(i::TEXT, 2, '0');
      
      IF kr.monthly_targets ? month_key THEN
        ytd_target_val := ytd_target_val + COALESCE((kr.monthly_targets->>month_key)::NUMERIC, 0);
      END IF;
      
      IF kr.monthly_actual ? month_key THEN
        ytd_actual_val := ytd_actual_val + COALESCE((kr.monthly_actual->>month_key)::NUMERIC, 0);
      END IF;
    END LOOP;
    
  ELSIF kr.aggregation_type = 'average' THEN
    avg_count := 0;
    FOR i IN 1..current_month LOOP
      month_key := current_year || '-' || LPAD(i::TEXT, 2, '0');
      
      IF kr.monthly_actual ? month_key THEN
        month_actual := COALESCE((kr.monthly_actual->>month_key)::NUMERIC, 0);
        IF month_actual <> 0 THEN
          ytd_actual_val := ytd_actual_val + month_actual;
          IF kr.monthly_targets ? month_key THEN
            ytd_target_val := ytd_target_val + COALESCE((kr.monthly_targets->>month_key)::NUMERIC, 0);
          END IF;
          avg_count := avg_count + 1;
        END IF;
      END IF;
    END LOOP;
    IF avg_count > 0 THEN
      ytd_target_val := ytd_target_val / avg_count;
      ytd_actual_val := ytd_actual_val / avg_count;
    END IF;
    
  ELSIF kr.aggregation_type = 'max' THEN
    FOR i IN 1..current_month LOOP
      month_key := current_year || '-' || LPAD(i::TEXT, 2, '0');
      
      IF kr.monthly_targets ? month_key THEN
        month_target := COALESCE((kr.monthly_targets->>month_key)::NUMERIC, 0);
        IF month_target > ytd_target_val THEN
          ytd_target_val := month_target;
        END IF;
      END IF;
      
      IF kr.monthly_actual ? month_key THEN
        month_actual := COALESCE((kr.monthly_actual->>month_key)::NUMERIC, 0);
        IF month_actual > ytd_actual_val THEN
          ytd_actual_val := month_actual;
        END IF;
      END IF;
    END LOOP;
    
  ELSIF kr.aggregation_type = 'min' THEN
    ytd_target_val := NULL;
    ytd_actual_val := NULL;
    FOR i IN 1..current_month LOOP
      month_key := current_year || '-' || LPAD(i::TEXT, 2, '0');
      
      IF kr.monthly_targets ? month_key THEN
        month_target := COALESCE((kr.monthly_targets->>month_key)::NUMERIC, 0);
        IF month_target > 0 AND (ytd_target_val IS NULL OR month_target < ytd_target_val) THEN
          ytd_target_val := month_target;
        END IF;
      END IF;
      
      IF kr.monthly_actual ? month_key THEN
        month_actual := COALESCE((kr.monthly_actual->>month_key)::NUMERIC, 0);
        IF month_actual > 0 AND (ytd_actual_val IS NULL OR month_actual < ytd_actual_val) THEN
          ytd_actual_val := month_actual;
        END IF;
      END IF;
    END LOOP;
    ytd_target_val := COALESCE(ytd_target_val, 0);
    ytd_actual_val := COALESCE(ytd_actual_val, 0);

  ELSIF kr.aggregation_type = 'last' THEN
    -- Percorrer do mês mais recente para o mais antigo e pegar o primeiro valor encontrado
    found_value := FALSE;
    FOR i IN REVERSE current_month..1 LOOP
      month_key := current_year || '-' || LPAD(i::TEXT, 2, '0');
      
      IF kr.monthly_targets ? month_key AND NOT found_value THEN
        month_target := (kr.monthly_targets->>month_key)::NUMERIC;
        IF month_target IS NOT NULL AND month_target <> 0 THEN
          ytd_target_val := month_target;
          found_value := TRUE;
        END IF;
      END IF;
    END LOOP;
    
    found_value := FALSE;
    FOR i IN REVERSE current_month..1 LOOP
      month_key := current_year || '-' || LPAD(i::TEXT, 2, '0');
      
      IF kr.monthly_actual ? month_key AND NOT found_value THEN
        month_actual := (kr.monthly_actual->>month_key)::NUMERIC;
        IF month_actual IS NOT NULL AND month_actual <> 0 THEN
          ytd_actual_val := month_actual;
          found_value := TRUE;
        END IF;
      END IF;
    END LOOP;
  END IF;
  
  -- Calculate YTD percentage
  IF kr.target_direction = 'minimize' THEN
    IF ytd_actual_val > 0 THEN
      ytd_percentage_val := (ytd_target_val / ytd_actual_val) * 100;
    ELSE
      ytd_percentage_val := 0;
    END IF;
  ELSE
    IF ytd_target_val > 0 THEN
      ytd_percentage_val := (ytd_actual_val / ytd_target_val) * 100;
    ELSE
      ytd_percentage_val := 0;
    END IF;
  END IF;
  
  -- Calculate yearly metrics (all 12 months)
  IF kr.aggregation_type = 'sum' OR kr.aggregation_type IS NULL THEN
    FOR i IN 1..12 LOOP
      month_key := current_year || '-' || LPAD(i::TEXT, 2, '0');
      
      IF kr.monthly_targets ? month_key THEN
        yearly_target_val := yearly_target_val + COALESCE((kr.monthly_targets->>month_key)::NUMERIC, 0);
      END IF;
      
      IF kr.monthly_actual ? month_key THEN
        yearly_actual_val := yearly_actual_val + COALESCE((kr.monthly_actual->>month_key)::NUMERIC, 0);
      END IF;
    END LOOP;
    
  ELSIF kr.aggregation_type = 'average' THEN
    avg_count := 0;
    FOR i IN 1..12 LOOP
      month_key := current_year || '-' || LPAD(i::TEXT, 2, '0');
      
      IF kr.monthly_actual ? month_key THEN
        month_actual := COALESCE((kr.monthly_actual->>month_key)::NUMERIC, 0);
        IF month_actual <> 0 THEN
          yearly_actual_val := yearly_actual_val + month_actual;
          IF kr.monthly_targets ? month_key THEN
            yearly_target_val := yearly_target_val + COALESCE((kr.monthly_targets->>month_key)::NUMERIC, 0);
          END IF;
          avg_count := avg_count + 1;
        END IF;
      END IF;
    END LOOP;
    IF avg_count > 0 THEN
      yearly_target_val := yearly_target_val / avg_count;
      yearly_actual_val := yearly_actual_val / avg_count;
    END IF;
    
  ELSIF kr.aggregation_type = 'max' THEN
    FOR i IN 1..12 LOOP
      month_key := current_year || '-' || LPAD(i::TEXT, 2, '0');
      
      IF kr.monthly_targets ? month_key THEN
        month_target := COALESCE((kr.monthly_targets->>month_key)::NUMERIC, 0);
        IF month_target > yearly_target_val THEN
          yearly_target_val := month_target;
        END IF;
      END IF;
      
      IF kr.monthly_actual ? month_key THEN
        month_actual := COALESCE((kr.monthly_actual->>month_key)::NUMERIC, 0);
        IF month_actual > yearly_actual_val THEN
          yearly_actual_val := month_actual;
        END IF;
      END IF;
    END LOOP;
    
  ELSIF kr.aggregation_type = 'min' THEN
    yearly_target_val := NULL;
    yearly_actual_val := NULL;
    FOR i IN 1..12 LOOP
      month_key := current_year || '-' || LPAD(i::TEXT, 2, '0');
      
      IF kr.monthly_targets ? month_key THEN
        month_target := COALESCE((kr.monthly_targets->>month_key)::NUMERIC, 0);
        IF month_target > 0 AND (yearly_target_val IS NULL OR month_target < yearly_target_val) THEN
          yearly_target_val := month_target;
        END IF;
      END IF;
      
      IF kr.monthly_actual ? month_key THEN
        month_actual := COALESCE((kr.monthly_actual->>month_key)::NUMERIC, 0);
        IF month_actual > 0 AND (yearly_actual_val IS NULL OR month_actual < yearly_actual_val) THEN
          yearly_actual_val := month_actual;
        END IF;
      END IF;
    END LOOP;
    yearly_target_val := COALESCE(yearly_target_val, 0);
    yearly_actual_val := COALESCE(yearly_actual_val, 0);

  ELSIF kr.aggregation_type = 'last' THEN
    found_value := FALSE;
    FOR i IN REVERSE 12..1 LOOP
      month_key := current_year || '-' || LPAD(i::TEXT, 2, '0');
      
      IF kr.monthly_targets ? month_key AND NOT found_value THEN
        month_target := (kr.monthly_targets->>month_key)::NUMERIC;
        IF month_target IS NOT NULL AND month_target <> 0 THEN
          yearly_target_val := month_target;
          found_value := TRUE;
        END IF;
      END IF;
    END LOOP;
    
    found_value := FALSE;
    FOR i IN REVERSE 12..1 LOOP
      month_key := current_year || '-' || LPAD(i::TEXT, 2, '0');
      
      IF kr.monthly_actual ? month_key AND NOT found_value THEN
        month_actual := (kr.monthly_actual->>month_key)::NUMERIC;
        IF month_actual IS NOT NULL AND month_actual <> 0 THEN
          yearly_actual_val := month_actual;
          found_value := TRUE;
        END IF;
      END IF;
    END LOOP;
  END IF;
  
  -- Calculate yearly percentage
  IF kr.target_direction = 'minimize' THEN
    IF yearly_actual_val > 0 THEN
      yearly_percentage_val := (yearly_target_val / yearly_actual_val) * 100;
    ELSE
      yearly_percentage_val := 0;
    END IF;
  ELSE
    IF yearly_target_val > 0 THEN
      yearly_percentage_val := (yearly_actual_val / yearly_target_val) * 100;
    ELSE
      yearly_percentage_val := 0;
    END IF;
  END IF;
  
  -- Calculate Q1 (Jan-Mar)
  IF kr.aggregation_type = 'sum' OR kr.aggregation_type IS NULL THEN
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
    avg_count := 0;
    FOR i IN 1..3 LOOP
      month_key := current_year || '-' || LPAD(i::TEXT, 2, '0');
      IF kr.monthly_actual ? month_key THEN
        month_actual := COALESCE((kr.monthly_actual->>month_key)::NUMERIC, 0);
        IF month_actual <> 0 THEN
          q1_actual_val := q1_actual_val + month_actual;
          IF kr.monthly_targets ? month_key THEN
            q1_target_val := q1_target_val + COALESCE((kr.monthly_targets->>month_key)::NUMERIC, 0);
          END IF;
          avg_count := avg_count + 1;
        END IF;
      END IF;
    END LOOP;
    IF avg_count > 0 THEN
      q1_target_val := q1_target_val / avg_count;
      q1_actual_val := q1_actual_val / avg_count;
    END IF;
  ELSIF kr.aggregation_type = 'max' THEN
    FOR i IN 1..3 LOOP
      month_key := current_year || '-' || LPAD(i::TEXT, 2, '0');
      IF kr.monthly_targets ? month_key THEN
        month_target := COALESCE((kr.monthly_targets->>month_key)::NUMERIC, 0);
        IF month_target > q1_target_val THEN q1_target_val := month_target; END IF;
      END IF;
      IF kr.monthly_actual ? month_key THEN
        month_actual := COALESCE((kr.monthly_actual->>month_key)::NUMERIC, 0);
        IF month_actual > q1_actual_val THEN q1_actual_val := month_actual; END IF;
      END IF;
    END LOOP;
  ELSIF kr.aggregation_type = 'min' THEN
    q1_target_val := NULL; q1_actual_val := NULL;
    FOR i IN 1..3 LOOP
      month_key := current_year || '-' || LPAD(i::TEXT, 2, '0');
      IF kr.monthly_targets ? month_key THEN
        month_target := COALESCE((kr.monthly_targets->>month_key)::NUMERIC, 0);
        IF month_target > 0 AND (q1_target_val IS NULL OR month_target < q1_target_val) THEN
          q1_target_val := month_target;
        END IF;
      END IF;
      IF kr.monthly_actual ? month_key THEN
        month_actual := COALESCE((kr.monthly_actual->>month_key)::NUMERIC, 0);
        IF month_actual > 0 AND (q1_actual_val IS NULL OR month_actual < q1_actual_val) THEN
          q1_actual_val := month_actual;
        END IF;
      END IF;
    END LOOP;
    q1_target_val := COALESCE(q1_target_val, 0);
    q1_actual_val := COALESCE(q1_actual_val, 0);
  ELSIF kr.aggregation_type = 'last' THEN
    found_value := FALSE;
    FOR i IN REVERSE 3..1 LOOP
      month_key := current_year || '-' || LPAD(i::TEXT, 2, '0');
      IF kr.monthly_targets ? month_key AND NOT found_value THEN
        month_target := (kr.monthly_targets->>month_key)::NUMERIC;
        IF month_target IS NOT NULL AND month_target <> 0 THEN
          q1_target_val := month_target;
          found_value := TRUE;
        END IF;
      END IF;
    END LOOP;
    found_value := FALSE;
    FOR i IN REVERSE 3..1 LOOP
      month_key := current_year || '-' || LPAD(i::TEXT, 2, '0');
      IF kr.monthly_actual ? month_key AND NOT found_value THEN
        month_actual := (kr.monthly_actual->>month_key)::NUMERIC;
        IF month_actual IS NOT NULL AND month_actual <> 0 THEN
          q1_actual_val := month_actual;
          found_value := TRUE;
        END IF;
      END IF;
    END LOOP;
  END IF;
  
  -- Q1 percentage
  IF kr.target_direction = 'minimize' THEN
    IF q1_actual_val > 0 THEN q1_percentage_val := (q1_target_val / q1_actual_val) * 100;
    ELSE q1_percentage_val := 0; END IF;
  ELSE
    IF q1_target_val > 0 THEN q1_percentage_val := (q1_actual_val / q1_target_val) * 100;
    ELSE q1_percentage_val := 0; END IF;
  END IF;
  
  -- Calculate Q2 (Apr-Jun)
  IF kr.aggregation_type = 'sum' OR kr.aggregation_type IS NULL THEN
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
    avg_count := 0;
    FOR i IN 4..6 LOOP
      month_key := current_year || '-' || LPAD(i::TEXT, 2, '0');
      IF kr.monthly_actual ? month_key THEN
        month_actual := COALESCE((kr.monthly_actual->>month_key)::NUMERIC, 0);
        IF month_actual <> 0 THEN
          q2_actual_val := q2_actual_val + month_actual;
          IF kr.monthly_targets ? month_key THEN
            q2_target_val := q2_target_val + COALESCE((kr.monthly_targets->>month_key)::NUMERIC, 0);
          END IF;
          avg_count := avg_count + 1;
        END IF;
      END IF;
    END LOOP;
    IF avg_count > 0 THEN
      q2_target_val := q2_target_val / avg_count;
      q2_actual_val := q2_actual_val / avg_count;
    END IF;
  ELSIF kr.aggregation_type = 'max' THEN
    FOR i IN 4..6 LOOP
      month_key := current_year || '-' || LPAD(i::TEXT, 2, '0');
      IF kr.monthly_targets ? month_key THEN
        month_target := COALESCE((kr.monthly_targets->>month_key)::NUMERIC, 0);
        IF month_target > q2_target_val THEN q2_target_val := month_target; END IF;
      END IF;
      IF kr.monthly_actual ? month_key THEN
        month_actual := COALESCE((kr.monthly_actual->>month_key)::NUMERIC, 0);
        IF month_actual > q2_actual_val THEN q2_actual_val := month_actual; END IF;
      END IF;
    END LOOP;
  ELSIF kr.aggregation_type = 'min' THEN
    q2_target_val := NULL; q2_actual_val := NULL;
    FOR i IN 4..6 LOOP
      month_key := current_year || '-' || LPAD(i::TEXT, 2, '0');
      IF kr.monthly_targets ? month_key THEN
        month_target := COALESCE((kr.monthly_targets->>month_key)::NUMERIC, 0);
        IF month_target > 0 AND (q2_target_val IS NULL OR month_target < q2_target_val) THEN
          q2_target_val := month_target;
        END IF;
      END IF;
      IF kr.monthly_actual ? month_key THEN
        month_actual := COALESCE((kr.monthly_actual->>month_key)::NUMERIC, 0);
        IF month_actual > 0 AND (q2_actual_val IS NULL OR month_actual < q2_actual_val) THEN
          q2_actual_val := month_actual;
        END IF;
      END IF;
    END LOOP;
    q2_target_val := COALESCE(q2_target_val, 0);
    q2_actual_val := COALESCE(q2_actual_val, 0);
  ELSIF kr.aggregation_type = 'last' THEN
    found_value := FALSE;
    FOR i IN REVERSE 6..4 LOOP
      month_key := current_year || '-' || LPAD(i::TEXT, 2, '0');
      IF kr.monthly_targets ? month_key AND NOT found_value THEN
        month_target := (kr.monthly_targets->>month_key)::NUMERIC;
        IF month_target IS NOT NULL AND month_target <> 0 THEN
          q2_target_val := month_target;
          found_value := TRUE;
        END IF;
      END IF;
    END LOOP;
    found_value := FALSE;
    FOR i IN REVERSE 6..4 LOOP
      month_key := current_year || '-' || LPAD(i::TEXT, 2, '0');
      IF kr.monthly_actual ? month_key AND NOT found_value THEN
        month_actual := (kr.monthly_actual->>month_key)::NUMERIC;
        IF month_actual IS NOT NULL AND month_actual <> 0 THEN
          q2_actual_val := month_actual;
          found_value := TRUE;
        END IF;
      END IF;
    END LOOP;
  END IF;
  
  -- Q2 percentage
  IF kr.target_direction = 'minimize' THEN
    IF q2_actual_val > 0 THEN q2_percentage_val := (q2_target_val / q2_actual_val) * 100;
    ELSE q2_percentage_val := 0; END IF;
  ELSE
    IF q2_target_val > 0 THEN q2_percentage_val := (q2_actual_val / q2_target_val) * 100;
    ELSE q2_percentage_val := 0; END IF;
  END IF;
  
  -- Calculate Q3 (Jul-Sep)
  IF kr.aggregation_type = 'sum' OR kr.aggregation_type IS NULL THEN
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
    avg_count := 0;
    FOR i IN 7..9 LOOP
      month_key := current_year || '-' || LPAD(i::TEXT, 2, '0');
      IF kr.monthly_actual ? month_key THEN
        month_actual := COALESCE((kr.monthly_actual->>month_key)::NUMERIC, 0);
        IF month_actual <> 0 THEN
          q3_actual_val := q3_actual_val + month_actual;
          IF kr.monthly_targets ? month_key THEN
            q3_target_val := q3_target_val + COALESCE((kr.monthly_targets->>month_key)::NUMERIC, 0);
          END IF;
          avg_count := avg_count + 1;
        END IF;
      END IF;
    END LOOP;
    IF avg_count > 0 THEN
      q3_target_val := q3_target_val / avg_count;
      q3_actual_val := q3_actual_val / avg_count;
    END IF;
  ELSIF kr.aggregation_type = 'max' THEN
    FOR i IN 7..9 LOOP
      month_key := current_year || '-' || LPAD(i::TEXT, 2, '0');
      IF kr.monthly_targets ? month_key THEN
        month_target := COALESCE((kr.monthly_targets->>month_key)::NUMERIC, 0);
        IF month_target > q3_target_val THEN q3_target_val := month_target; END IF;
      END IF;
      IF kr.monthly_actual ? month_key THEN
        month_actual := COALESCE((kr.monthly_actual->>month_key)::NUMERIC, 0);
        IF month_actual > q3_actual_val THEN q3_actual_val := month_actual; END IF;
      END IF;
    END LOOP;
  ELSIF kr.aggregation_type = 'min' THEN
    q3_target_val := NULL; q3_actual_val := NULL;
    FOR i IN 7..9 LOOP
      month_key := current_year || '-' || LPAD(i::TEXT, 2, '0');
      IF kr.monthly_targets ? month_key THEN
        month_target := COALESCE((kr.monthly_targets->>month_key)::NUMERIC, 0);
        IF month_target > 0 AND (q3_target_val IS NULL OR month_target < q3_target_val) THEN
          q3_target_val := month_target;
        END IF;
      END IF;
      IF kr.monthly_actual ? month_key THEN
        month_actual := COALESCE((kr.monthly_actual->>month_key)::NUMERIC, 0);
        IF month_actual > 0 AND (q3_actual_val IS NULL OR month_actual < q3_actual_val) THEN
          q3_actual_val := month_actual;
        END IF;
      END IF;
    END LOOP;
    q3_target_val := COALESCE(q3_target_val, 0);
    q3_actual_val := COALESCE(q3_actual_val, 0);
  ELSIF kr.aggregation_type = 'last' THEN
    found_value := FALSE;
    FOR i IN REVERSE 9..7 LOOP
      month_key := current_year || '-' || LPAD(i::TEXT, 2, '0');
      IF kr.monthly_targets ? month_key AND NOT found_value THEN
        month_target := (kr.monthly_targets->>month_key)::NUMERIC;
        IF month_target IS NOT NULL AND month_target <> 0 THEN
          q3_target_val := month_target;
          found_value := TRUE;
        END IF;
      END IF;
    END LOOP;
    found_value := FALSE;
    FOR i IN REVERSE 9..7 LOOP
      month_key := current_year || '-' || LPAD(i::TEXT, 2, '0');
      IF kr.monthly_actual ? month_key AND NOT found_value THEN
        month_actual := (kr.monthly_actual->>month_key)::NUMERIC;
        IF month_actual IS NOT NULL AND month_actual <> 0 THEN
          q3_actual_val := month_actual;
          found_value := TRUE;
        END IF;
      END IF;
    END LOOP;
  END IF;
  
  -- Q3 percentage
  IF kr.target_direction = 'minimize' THEN
    IF q3_actual_val > 0 THEN q3_percentage_val := (q3_target_val / q3_actual_val) * 100;
    ELSE q3_percentage_val := 0; END IF;
  ELSE
    IF q3_target_val > 0 THEN q3_percentage_val := (q3_actual_val / q3_target_val) * 100;
    ELSE q3_percentage_val := 0; END IF;
  END IF;
  
  -- Calculate Q4 (Oct-Dec)
  IF kr.aggregation_type = 'sum' OR kr.aggregation_type IS NULL THEN
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
    avg_count := 0;
    FOR i IN 10..12 LOOP
      month_key := current_year || '-' || LPAD(i::TEXT, 2, '0');
      IF kr.monthly_actual ? month_key THEN
        month_actual := COALESCE((kr.monthly_actual->>month_key)::NUMERIC, 0);
        IF month_actual <> 0 THEN
          q4_actual_val := q4_actual_val + month_actual;
          IF kr.monthly_targets ? month_key THEN
            q4_target_val := q4_target_val + COALESCE((kr.monthly_targets->>month_key)::NUMERIC, 0);
          END IF;
          avg_count := avg_count + 1;
        END IF;
      END IF;
    END LOOP;
    IF avg_count > 0 THEN
      q4_target_val := q4_target_val / avg_count;
      q4_actual_val := q4_actual_val / avg_count;
    END IF;
  ELSIF kr.aggregation_type = 'max' THEN
    FOR i IN 10..12 LOOP
      month_key := current_year || '-' || LPAD(i::TEXT, 2, '0');
      IF kr.monthly_targets ? month_key THEN
        month_target := COALESCE((kr.monthly_targets->>month_key)::NUMERIC, 0);
        IF month_target > q4_target_val THEN q4_target_val := month_target; END IF;
      END IF;
      IF kr.monthly_actual ? month_key THEN
        month_actual := COALESCE((kr.monthly_actual->>month_key)::NUMERIC, 0);
        IF month_actual > q4_actual_val THEN q4_actual_val := month_actual; END IF;
      END IF;
    END LOOP;
  ELSIF kr.aggregation_type = 'min' THEN
    q4_target_val := NULL; q4_actual_val := NULL;
    FOR i IN 10..12 LOOP
      month_key := current_year || '-' || LPAD(i::TEXT, 2, '0');
      IF kr.monthly_targets ? month_key THEN
        month_target := COALESCE((kr.monthly_targets->>month_key)::NUMERIC, 0);
        IF month_target > 0 AND (q4_target_val IS NULL OR month_target < q4_target_val) THEN
          q4_target_val := month_target;
        END IF;
      END IF;
      IF kr.monthly_actual ? month_key THEN
        month_actual := COALESCE((kr.monthly_actual->>month_key)::NUMERIC, 0);
        IF month_actual > 0 AND (q4_actual_val IS NULL OR month_actual < q4_actual_val) THEN
          q4_actual_val := month_actual;
        END IF;
      END IF;
    END LOOP;
    q4_target_val := COALESCE(q4_target_val, 0);
    q4_actual_val := COALESCE(q4_actual_val, 0);
  ELSIF kr.aggregation_type = 'last' THEN
    found_value := FALSE;
    FOR i IN REVERSE 12..10 LOOP
      month_key := current_year || '-' || LPAD(i::TEXT, 2, '0');
      IF kr.monthly_targets ? month_key AND NOT found_value THEN
        month_target := (kr.monthly_targets->>month_key)::NUMERIC;
        IF month_target IS NOT NULL AND month_target <> 0 THEN
          q4_target_val := month_target;
          found_value := TRUE;
        END IF;
      END IF;
    END LOOP;
    found_value := FALSE;
    FOR i IN REVERSE 12..10 LOOP
      month_key := current_year || '-' || LPAD(i::TEXT, 2, '0');
      IF kr.monthly_actual ? month_key AND NOT found_value THEN
        month_actual := (kr.monthly_actual->>month_key)::NUMERIC;
        IF month_actual IS NOT NULL AND month_actual <> 0 THEN
          q4_actual_val := month_actual;
          found_value := TRUE;
        END IF;
      END IF;
    END LOOP;
  END IF;
  
  -- Q4 percentage
  IF kr.target_direction = 'minimize' THEN
    IF q4_actual_val > 0 THEN q4_percentage_val := (q4_target_val / q4_actual_val) * 100;
    ELSE q4_percentage_val := 0; END IF;
  ELSE
    IF q4_target_val > 0 THEN q4_percentage_val := (q4_actual_val / q4_target_val) * 100;
    ELSE q4_percentage_val := 0; END IF;
  END IF;
  
  -- Update the key_result with calculated values
  UPDATE key_results SET
    current_month_target = current_month_target_val,
    current_month_actual = current_month_actual_val,
    monthly_percentage = monthly_percentage_val,
    ytd_target = ytd_target_val,
    ytd_actual = ytd_actual_val,
    ytd_percentage = ytd_percentage_val,
    yearly_target = yearly_target_val,
    yearly_actual = yearly_actual_val,
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
    updated_at = NOW()
  WHERE id = kr_id;
END;
$function$;