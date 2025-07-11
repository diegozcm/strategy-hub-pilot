-- Create strategic plans table
CREATE TABLE public.strategic_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  name TEXT NOT NULL,
  vision TEXT,
  mission TEXT,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create strategic objectives table
CREATE TABLE public.strategic_objectives (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES public.strategic_plans(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  weight INTEGER DEFAULT 1 CHECK (weight >= 1 AND weight <= 10),
  owner_id UUID NOT NULL,
  target_date DATE,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'at_risk', 'delayed')),
  progress DECIMAL(5,2) DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create key results table
CREATE TABLE public.key_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  objective_id UUID NOT NULL REFERENCES public.strategic_objectives(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  target_value DECIMAL(15,2) NOT NULL,
  current_value DECIMAL(15,2) DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'number',
  owner_id UUID NOT NULL,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'at_risk', 'delayed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.strategic_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strategic_objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.key_results ENABLE ROW LEVEL SECURITY;

-- Create policies for strategic_plans
CREATE POLICY "Users can view strategic plans" 
ON public.strategic_plans 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create strategic plans" 
ON public.strategic_plans 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update strategic plans" 
ON public.strategic_plans 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

-- Create policies for strategic_objectives
CREATE POLICY "Users can view strategic objectives" 
ON public.strategic_objectives 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create strategic objectives" 
ON public.strategic_objectives 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update strategic objectives" 
ON public.strategic_objectives 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

-- Create policies for key_results
CREATE POLICY "Users can view key results" 
ON public.key_results 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create key results" 
ON public.key_results 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update key results" 
ON public.key_results 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_strategic_plans_updated_at
  BEFORE UPDATE ON public.strategic_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_strategic_objectives_updated_at
  BEFORE UPDATE ON public.strategic_objectives
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_key_results_updated_at
  BEFORE UPDATE ON public.key_results
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();