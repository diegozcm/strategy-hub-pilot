-- Create mentoring_sessions table for tracking mentor sessions with startups
CREATE TABLE public.mentoring_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mentor_id UUID NOT NULL,
  startup_company_id UUID NOT NULL,
  session_date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration INTEGER, -- in minutes
  session_type VARCHAR NOT NULL DEFAULT 'general',
  notes TEXT,
  action_items JSONB DEFAULT '[]'::jsonb,
  beep_related_items JSONB DEFAULT '[]'::jsonb,
  follow_up_date DATE,
  status VARCHAR NOT NULL DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mentoring_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Mentors can manage their own sessions" 
ON public.mentoring_sessions 
FOR ALL 
USING (mentor_id = auth.uid())
WITH CHECK (mentor_id = auth.uid());

CREATE POLICY "Startups can view their sessions" 
ON public.mentoring_sessions 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.user_company_relations ucr 
  WHERE ucr.user_id = auth.uid() 
    AND ucr.company_id = mentoring_sessions.startup_company_id
));

CREATE POLICY "Admins can view all sessions" 
ON public.mentoring_sessions 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_mentoring_sessions_updated_at
  BEFORE UPDATE ON public.mentoring_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Extend mentoring_tips table to link with sessions
ALTER TABLE public.mentoring_tips 
ADD COLUMN session_id UUID,
ADD COLUMN beep_category_related VARCHAR[];

-- Add index for better performance
CREATE INDEX idx_mentoring_sessions_mentor_id ON public.mentoring_sessions(mentor_id);
CREATE INDEX idx_mentoring_sessions_startup_company_id ON public.mentoring_sessions(startup_company_id);
CREATE INDEX idx_mentoring_sessions_session_date ON public.mentoring_sessions(session_date);
CREATE INDEX idx_mentoring_tips_session_id ON public.mentoring_tips(session_id);