-- Create Golden Circle table for storing company's Why, How, What responses
CREATE TABLE public.golden_circle (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  why_question TEXT,
  how_question TEXT, 
  what_question TEXT,
  created_by UUID NOT NULL,
  updated_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id)
);

-- Create Golden Circle history table for audit trail
CREATE TABLE public.golden_circle_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  golden_circle_id UUID NOT NULL,
  previous_why TEXT,
  previous_how TEXT,
  previous_what TEXT,
  changed_by UUID NOT NULL,
  change_reason TEXT,
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.golden_circle ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.golden_circle_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for golden_circle table
CREATE POLICY "Users can view company golden circle" 
ON public.golden_circle 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM user_company_relations ucr 
    WHERE ucr.user_id = auth.uid() 
    AND ucr.company_id = golden_circle.company_id
  )
);

CREATE POLICY "Users can create company golden circle" 
ON public.golden_circle 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_company_relations ucr 
    WHERE ucr.user_id = auth.uid() 
    AND ucr.company_id = golden_circle.company_id
  )
  AND auth.uid() = created_by
);

CREATE POLICY "Users can update company golden circle" 
ON public.golden_circle 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM user_company_relations ucr 
    WHERE ucr.user_id = auth.uid() 
    AND ucr.company_id = golden_circle.company_id
  )
);

CREATE POLICY "Users can delete company golden circle" 
ON public.golden_circle 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM user_company_relations ucr 
    WHERE ucr.user_id = auth.uid() 
    AND ucr.company_id = golden_circle.company_id
  )
);

-- RLS Policies for golden_circle_history table
CREATE POLICY "Users can view company golden circle history" 
ON public.golden_circle_history 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM golden_circle gc
    JOIN user_company_relations ucr ON ucr.company_id = gc.company_id
    WHERE gc.id = golden_circle_history.golden_circle_id 
    AND ucr.user_id = auth.uid()
  )
);

CREATE POLICY "System can create history records" 
ON public.golden_circle_history 
FOR INSERT 
WITH CHECK (auth.uid() = changed_by);

-- Create trigger to automatically save history on updates
CREATE OR REPLACE FUNCTION public.save_golden_circle_history()
RETURNS TRIGGER AS $$
BEGIN
  -- Only save history if this is an update (not insert)
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO public.golden_circle_history (
      golden_circle_id,
      previous_why,
      previous_how,
      previous_what,
      changed_by,
      changed_at
    )
    VALUES (
      OLD.id,
      OLD.why_question,
      OLD.how_question,
      OLD.what_question,
      NEW.updated_by,
      now()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER save_golden_circle_history_trigger
  BEFORE UPDATE ON public.golden_circle
  FOR EACH ROW
  EXECUTE FUNCTION public.save_golden_circle_history();

-- Create trigger for updating updated_at timestamp
CREATE TRIGGER update_golden_circle_updated_at
  BEFORE UPDATE ON public.golden_circle
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();