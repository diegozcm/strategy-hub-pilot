-- Remove status concept from Key Results

-- Remove status column from key_results table
ALTER TABLE public.key_results DROP COLUMN IF EXISTS status;

-- Remove previous_status column from key_results_history table  
ALTER TABLE public.key_results_history DROP COLUMN IF EXISTS previous_status;

-- Update the save_key_results_history function to not include status
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
      auth.uid(),
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