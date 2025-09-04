-- Create key_results_history table for tracking changes to key results
CREATE TABLE public.key_results_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key_result_id UUID NOT NULL,
  changed_by UUID NOT NULL,
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  change_reason TEXT,
  previous_title TEXT,
  previous_description TEXT,
  previous_target_value NUMERIC,
  previous_current_value NUMERIC,
  previous_status TEXT,
  previous_monthly_targets JSONB,
  previous_monthly_actual JSONB,
  previous_yearly_target NUMERIC,
  previous_yearly_actual NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.key_results_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for key results history
CREATE POLICY "Users can view company key results history" 
ON public.key_results_history 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM user_company_relations ucr
    JOIN strategic_plans sp ON sp.id = (
      SELECT so.plan_id FROM strategic_objectives so 
      JOIN key_results kr ON kr.objective_id = so.id 
      WHERE kr.id = key_results_history.key_result_id
    )
    WHERE ucr.user_id = auth.uid() AND ucr.company_id = sp.company_id
  )
);

CREATE POLICY "System can create key results history records" 
ON public.key_results_history 
FOR INSERT 
WITH CHECK (auth.uid() = changed_by);

-- Create trigger function to save key results history
CREATE OR REPLACE FUNCTION public.save_key_results_history()
RETURNS TRIGGER AS $$
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
      previous_status,
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
      OLD.status,
      OLD.monthly_targets,
      OLD.monthly_actual,
      OLD.yearly_target,
      OLD.yearly_actual
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on key_results table
CREATE TRIGGER save_key_results_history_trigger
  BEFORE UPDATE ON public.key_results
  FOR EACH ROW
  EXECUTE FUNCTION public.save_key_results_history();