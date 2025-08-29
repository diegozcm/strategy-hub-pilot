-- Create mentor-startup relationship table
CREATE TABLE public.mentor_startup_relations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mentor_id UUID NOT NULL,
  startup_company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL,
  status CHARACTER VARYING NOT NULL DEFAULT 'active',
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(mentor_id, startup_company_id)
);

-- Create mentoring tips table
CREATE TABLE public.mentoring_tips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mentor_id UUID NOT NULL,
  startup_company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  title CHARACTER VARYING NOT NULL,
  content TEXT NOT NULL,
  category CHARACTER VARYING NOT NULL DEFAULT 'geral',
  priority CHARACTER VARYING NOT NULL DEFAULT 'media',
  is_public BOOLEAN NOT NULL DEFAULT false,
  status CHARACTER VARYING NOT NULL DEFAULT 'published',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mentor_startup_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentoring_tips ENABLE ROW LEVEL SECURITY;

-- RLS Policies for mentor_startup_relations
CREATE POLICY "Admins can manage mentor startup relations" 
ON public.mentor_startup_relations 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Mentors can view their relations" 
ON public.mentor_startup_relations 
FOR SELECT 
USING (mentor_id = auth.uid());

CREATE POLICY "Startups can view their relations" 
ON public.mentor_startup_relations 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.user_company_relations ucr 
  WHERE ucr.user_id = auth.uid() AND ucr.company_id = startup_company_id
));

-- RLS Policies for mentoring_tips
CREATE POLICY "Mentors can manage their own tips" 
ON public.mentoring_tips 
FOR ALL 
USING (mentor_id = auth.uid());

CREATE POLICY "Startups can view tips directed to them or public ones" 
ON public.mentoring_tips 
FOR SELECT 
USING (
  is_public = true OR 
  startup_company_id IN (
    SELECT ucr.company_id FROM public.user_company_relations ucr 
    WHERE ucr.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all tips" 
ON public.mentoring_tips 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create triggers for updated_at
CREATE TRIGGER update_mentor_startup_relations_updated_at
BEFORE UPDATE ON public.mentor_startup_relations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_mentoring_tips_updated_at
BEFORE UPDATE ON public.mentoring_tips
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();