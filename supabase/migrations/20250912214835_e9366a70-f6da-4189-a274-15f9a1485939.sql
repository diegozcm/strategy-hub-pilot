-- Fix the kr_actions_history trigger to handle DELETE operations properly
DROP TRIGGER IF EXISTS kr_monthly_actions_history_trigger ON public.kr_monthly_actions;

-- Update the trigger function to handle DELETE operations correctly
CREATE OR REPLACE FUNCTION public.create_kr_action_history()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  -- For DELETE operations, insert history BEFORE the actual deletion
  IF TG_OP = 'DELETE' THEN
    INSERT INTO public.kr_actions_history (
      action_id,
      changed_by,
      change_type,
      previous_data,
      new_data,
      change_reason
    ) VALUES (
      OLD.id,
      auth.uid(),
      'deleted',
      to_jsonb(OLD),
      NULL,
      'Action deleted'
    );
    
    RETURN OLD;
  END IF;
  
  -- For INSERT and UPDATE operations
  INSERT INTO public.kr_actions_history (
    action_id,
    changed_by,
    change_type,
    previous_data,
    new_data,
    change_reason
  ) VALUES (
    COALESCE(NEW.id, OLD.id),
    auth.uid(),
    CASE 
      WHEN TG_OP = 'INSERT' THEN 'created'
      WHEN TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN 'status_changed'
      WHEN TG_OP = 'UPDATE' THEN 'updated'
      ELSE TG_OP::text
    END,
    CASE WHEN TG_OP != 'INSERT' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP != 'DELETE' THEN to_jsonb(NEW) ELSE NULL END,
    NULL
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Recreate the trigger with BEFORE DELETE to ensure history is created before the row is deleted
CREATE TRIGGER kr_monthly_actions_history_trigger
  BEFORE INSERT OR UPDATE OR DELETE ON public.kr_monthly_actions
  FOR EACH ROW
  EXECUTE FUNCTION public.create_kr_action_history();