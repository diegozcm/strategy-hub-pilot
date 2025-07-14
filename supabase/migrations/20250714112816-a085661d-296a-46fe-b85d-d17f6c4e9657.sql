-- Create companies table
CREATE TABLE public.companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  mission TEXT,
  vision TEXT,
  values TEXT[],
  owner_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Create policies for companies
CREATE POLICY "Users can view companies" 
ON public.companies 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create companies" 
ON public.companies 
FOR INSERT 
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update companies" 
ON public.companies 
FOR UPDATE 
USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete companies" 
ON public.companies 
FOR DELETE 
USING (auth.uid() = owner_id);

-- Create strategic_pillars table
CREATE TABLE public.strategic_pillars (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  color VARCHAR(7) DEFAULT '#3B82F6',
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.strategic_pillars ENABLE ROW LEVEL SECURITY;

-- Create policies for strategic_pillars
CREATE POLICY "Users can view strategic pillars" 
ON public.strategic_pillars 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create strategic pillars" 
ON public.strategic_pillars 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update strategic pillars" 
ON public.strategic_pillars 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete strategic pillars" 
ON public.strategic_pillars 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Update strategic_objectives table to link with pillars
ALTER TABLE public.strategic_objectives 
ADD COLUMN pillar_id UUID REFERENCES public.strategic_pillars(id) ON DELETE CASCADE,
ADD COLUMN responsible VARCHAR(255),
ADD COLUMN deadline DATE;

-- Create project_objective_relations table
CREATE TABLE public.project_objective_relations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.strategic_projects(id) ON DELETE CASCADE,
  objective_id UUID NOT NULL REFERENCES public.strategic_objectives(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, objective_id)
);

-- Enable RLS
ALTER TABLE public.project_objective_relations ENABLE ROW LEVEL SECURITY;

-- Create policies for project_objective_relations
CREATE POLICY "Users can manage project objective relations" 
ON public.project_objective_relations 
FOR ALL 
USING (auth.uid() IS NOT NULL);

-- Create project_kr_relations table
CREATE TABLE public.project_kr_relations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.strategic_projects(id) ON DELETE CASCADE,
  kr_id UUID NOT NULL REFERENCES public.key_results(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, kr_id)
);

-- Enable RLS
ALTER TABLE public.project_kr_relations ENABLE ROW LEVEL SECURITY;

-- Create policies for project_kr_relations
CREATE POLICY "Users can manage project kr relations" 
ON public.project_kr_relations 
FOR ALL 
USING (auth.uid() IS NOT NULL);

-- Update key_results table
ALTER TABLE public.key_results 
ADD COLUMN metric_type VARCHAR(20) DEFAULT 'percentage',
ADD COLUMN frequency VARCHAR(20) DEFAULT 'monthly',
ADD COLUMN responsible VARCHAR(255),
ADD COLUMN deadline DATE;

-- Update strategic_projects table
ALTER TABLE public.strategic_projects 
ADD COLUMN responsible VARCHAR(255);

-- Create triggers for updated_at
CREATE TRIGGER update_companies_updated_at
BEFORE UPDATE ON public.companies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_strategic_pillars_updated_at
BEFORE UPDATE ON public.strategic_pillars
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();