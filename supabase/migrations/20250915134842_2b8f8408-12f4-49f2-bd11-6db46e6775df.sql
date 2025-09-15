-- Fix kr_actions_history trigger timings: AFTER for INSERT/UPDATE, BEFORE for DELETE
-- 1) Drop existing mixed-timing trigger if present
DROP TRIGGER IF EXISTS kr_monthly_actions_history_trigger ON public.kr_monthly_actions;
DROP TRIGGER IF EXISTS kr_monthly_actions_history_after ON public.kr_monthly_actions;
DROP TRIGGER IF EXISTS kr_monthly_actions_history_before_delete ON public.kr_monthly_actions;

-- 2) Ensure latest trigger function is present and handles all TG_OP cases
CREATE OR REPLACE FUNCTION public.create_kr_action_history()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  -- Handle DELETE separately (will be called by BEFORE DELETE trigger)
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

  -- Handle INSERT/UPDATE (will be called by AFTER trigger)
  INSERT INTO public.kr_actions_history (
    action_id,
    changed_by,
    change_type,
    previous_data,
    new_data,
    change_reason
  ) VALUES (
    NEW.id,
    auth.uid(),
    CASE 
      WHEN TG_OP = 'INSERT' THEN 'created'
      WHEN TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN 'status_changed'
      WHEN TG_OP = 'UPDATE' THEN 'updated'
      ELSE TG_OP::text
    END,
    CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END,
    to_jsonb(NEW),
    NULL
  );

  RETURN NEW;
END;
$function$;

-- 3) Recreate as two triggers with correct timings
CREATE TRIGGER kr_monthly_actions_history_after
  AFTER INSERT OR UPDATE ON public.kr_monthly_actions
  FOR EACH ROW
  EXECUTE FUNCTION public.create_kr_action_history();

CREATE TRIGGER kr_monthly_actions_history_before_delete
  BEFORE DELETE ON public.kr_monthly_actions
  FOR EACH ROW
  EXECUTE FUNCTION public.create_kr_action_history();