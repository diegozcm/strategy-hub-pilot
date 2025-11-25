-- Update the save_key_results_history trigger function to handle NULL auth.uid()
-- by using a system UUID ('00000000-0000-0000-0000-000000000000') when no user is authenticated

CREATE OR REPLACE FUNCTION public.save_key_results_history()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Only save history if this is an update (not insert)
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO public.key_results_history (
      key_result_id,
      changed_by,
      previous_title,
      previous_description,
      previous_target_value,
      previous_current_value,
      previous_monthly_targets,
      previous_monthly_actual,
      previous_yearly_target,
      previous_yearly_actual
    )
    VALUES (
      OLD.id,
      COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid), -- Use system UUID if auth.uid() is NULL
      OLD.title,
      OLD.description,
      OLD.target_value,
      OLD.current_value,
      OLD.monthly_targets,
      OLD.monthly_actual,
      OLD.yearly_target,
      OLD.yearly_actual
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Now recalculate quarter metrics for all existing KRs
DO $$
DECLARE
  kr_record RECORD;
  total_krs INTEGER := 0;
  processed_krs INTEGER := 0;
BEGIN
  -- Count total KRs
  SELECT COUNT(*) INTO total_krs FROM key_results;
  
  RAISE NOTICE 'Starting quarter metrics calculation for % key results', total_krs;
  
  -- Loop through all key results and recalculate metrics
  FOR kr_record IN SELECT id FROM key_results LOOP
    -- Call the calculate_kr_metrics function for each KR
    PERFORM calculate_kr_metrics(kr_record.id);
    processed_krs := processed_krs + 1;
  END LOOP;
  
  RAISE NOTICE 'Successfully recalculated quarter metrics for % key results', processed_krs;
END $$;