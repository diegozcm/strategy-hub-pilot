-- Create kr_status_reports table
CREATE TABLE public.kr_status_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key_result_id UUID NOT NULL,
  report_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status_summary TEXT NOT NULL,
  challenges TEXT,
  achievements TEXT,
  next_steps TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.kr_status_reports ENABLE ROW LEVEL SECURITY;

-- Create policies for kr_status_reports
CREATE POLICY "Users can view status reports for company KRs" 
ON public.kr_status_reports 
FOR SELECT 
USING (EXISTS (
  SELECT 1
  FROM user_company_relations ucr
  JOIN strategic_plans sp ON (sp.id = (
    SELECT so.plan_id
    FROM strategic_objectives so
    WHERE so.id = (
      SELECT kr.objective_id
      FROM key_results kr
      WHERE kr.id = kr_status_reports.key_result_id
    )
  ))
  WHERE ucr.user_id = auth.uid() AND ucr.company_id = sp.company_id
));

CREATE POLICY "Users can create status reports for company KRs" 
ON public.kr_status_reports 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1
  FROM user_company_relations ucr
  JOIN strategic_plans sp ON (sp.id = (
    SELECT so.plan_id
    FROM strategic_objectives so
    WHERE so.id = (
      SELECT kr.objective_id
      FROM key_results kr
      WHERE kr.id = kr_status_reports.key_result_id
    )
  ))
  WHERE ucr.user_id = auth.uid() AND ucr.company_id = sp.company_id
) AND created_by = auth.uid());

CREATE POLICY "Users can update status reports for company KRs" 
ON public.kr_status_reports 
FOR UPDATE 
USING (EXISTS (
  SELECT 1
  FROM user_company_relations ucr
  JOIN strategic_plans sp ON (sp.id = (
    SELECT so.plan_id
    FROM strategic_objectives so
    WHERE so.id = (
      SELECT kr.objective_id
      FROM key_results kr
      WHERE kr.id = kr_status_reports.key_result_id
    )
  ))
  WHERE ucr.user_id = auth.uid() AND ucr.company_id = sp.company_id
));

CREATE POLICY "Users can delete status reports for company KRs" 
ON public.kr_status_reports 
FOR DELETE 
USING (EXISTS (
  SELECT 1
  FROM user_company_relations ucr
  JOIN strategic_plans sp ON (sp.id = (
    SELECT so.plan_id
    FROM strategic_objectives so
    WHERE so.id = (
      SELECT kr.objective_id
      FROM key_results kr
      WHERE kr.id = kr_status_reports.key_result_id
    )
  ))
  WHERE ucr.user_id = auth.uid() AND ucr.company_id = sp.company_id
));

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_kr_status_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_kr_status_reports_updated_at
BEFORE UPDATE ON public.kr_status_reports
FOR EACH ROW
EXECUTE FUNCTION public.update_kr_status_reports_updated_at();

-- Create indexes for better performance
CREATE INDEX idx_kr_status_reports_key_result_id ON public.kr_status_reports(key_result_id);
CREATE INDEX idx_kr_status_reports_report_date ON public.kr_status_reports(report_date);
CREATE INDEX idx_kr_status_reports_created_by ON public.kr_status_reports(created_by);

-- Alter kr_monthly_actions to make fca_id NOT NULL (after migration of existing data)
-- First, let's check if there are any actions without fca_id and create a default FCA for them
DO $$
DECLARE
  action_record RECORD;
  default_fca_id UUID;
BEGIN
  -- For each action without fca_id, create a default FCA
  FOR action_record IN 
    SELECT DISTINCT key_result_id, created_by 
    FROM kr_monthly_actions 
    WHERE fca_id IS NULL
  LOOP
    -- Create default FCA
    INSERT INTO kr_fca (
      key_result_id, 
      created_by, 
      title, 
      fact, 
      cause, 
      description, 
      priority, 
      status
    ) VALUES (
      action_record.key_result_id,
      action_record.created_by,
      'FCA Padrão para Ações Migradas',
      'Ações existentes precisavam ser associadas a um FCA',
      'Sistema anterior permitia ações sem FCA',
      'FCA criado automaticamente durante migração do sistema',
      'medium',
      'active'
    ) RETURNING id INTO default_fca_id;
    
    -- Update all actions for this KR and creator to use the default FCA
    UPDATE kr_monthly_actions 
    SET fca_id = default_fca_id 
    WHERE key_result_id = action_record.key_result_id 
      AND created_by = action_record.created_by 
      AND fca_id IS NULL;
  END LOOP;
END $$;

-- Now make fca_id NOT NULL
ALTER TABLE public.kr_monthly_actions 
ALTER COLUMN fca_id SET NOT NULL;