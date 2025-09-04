-- Create SWOT analysis table
CREATE TABLE public.swot_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  strengths TEXT,
  weaknesses TEXT,
  opportunities TEXT,
  threats TEXT,
  created_by UUID NOT NULL,
  updated_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_swot_per_company UNIQUE (company_id)
);

-- Create SWOT history table
CREATE TABLE public.swot_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  swot_analysis_id UUID NOT NULL,
  changed_by UUID NOT NULL,
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  previous_strengths TEXT,
  previous_weaknesses TEXT,
  previous_opportunities TEXT,
  previous_threats TEXT,
  change_reason TEXT
);

-- Enable Row Level Security
ALTER TABLE public.swot_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.swot_history ENABLE ROW LEVEL SECURITY;

-- Create policies for SWOT analysis
CREATE POLICY "Users can view company swot analysis" 
ON public.swot_analysis 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM user_company_relations ucr 
  WHERE ucr.user_id = auth.uid() AND ucr.company_id = swot_analysis.company_id
));

CREATE POLICY "Users can create company swot analysis" 
ON public.swot_analysis 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_company_relations ucr 
    WHERE ucr.user_id = auth.uid() AND ucr.company_id = swot_analysis.company_id
  ) AND auth.uid() = created_by
);

CREATE POLICY "Users can update company swot analysis" 
ON public.swot_analysis 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM user_company_relations ucr 
  WHERE ucr.user_id = auth.uid() AND ucr.company_id = swot_analysis.company_id
));

CREATE POLICY "Users can delete company swot analysis" 
ON public.swot_analysis 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM user_company_relations ucr 
  WHERE ucr.user_id = auth.uid() AND ucr.company_id = swot_analysis.company_id
));

-- Create policies for SWOT history
CREATE POLICY "Users can view company swot history" 
ON public.swot_history 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM swot_analysis sa
  JOIN user_company_relations ucr ON ucr.company_id = sa.company_id
  WHERE sa.id = swot_history.swot_analysis_id AND ucr.user_id = auth.uid()
));

CREATE POLICY "System can create history records" 
ON public.swot_history 
FOR INSERT 
WITH CHECK (auth.uid() = changed_by);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates on SWOT
CREATE TRIGGER update_swot_analysis_updated_at
BEFORE UPDATE ON public.swot_analysis
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger to save SWOT history
CREATE OR REPLACE FUNCTION public.save_swot_history()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO public.swot_history (
      swot_analysis_id,
      changed_by,
      previous_strengths,
      previous_weaknesses,
      previous_opportunities,
      previous_threats
    ) VALUES (
      OLD.id,
      NEW.updated_by,
      OLD.strengths,
      OLD.weaknesses,
      OLD.opportunities,
      OLD.threats
    );
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER save_swot_history_trigger
AFTER UPDATE ON public.swot_analysis
FOR EACH ROW
EXECUTE FUNCTION public.save_swot_history();