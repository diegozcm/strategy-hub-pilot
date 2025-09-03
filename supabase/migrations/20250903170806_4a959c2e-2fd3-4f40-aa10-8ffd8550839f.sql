-- Criar tabela de action_items separada das sessões
CREATE TABLE public.action_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  status character varying NOT NULL DEFAULT 'pending',
  priority character varying NOT NULL DEFAULT 'medium',
  due_date date,
  created_by uuid NOT NULL,
  assigned_to uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT fk_action_items_session FOREIGN KEY (session_id) REFERENCES public.mentoring_sessions(id) ON DELETE CASCADE,
  CONSTRAINT fk_action_items_created_by FOREIGN KEY (created_by) REFERENCES auth.users(id),
  CONSTRAINT fk_action_items_assigned_to FOREIGN KEY (assigned_to) REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.action_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for action_items
CREATE POLICY "Mentors can manage action items for their sessions"
ON public.action_items
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.mentoring_sessions ms
    WHERE ms.id = action_items.session_id 
    AND ms.mentor_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.mentoring_sessions ms
    WHERE ms.id = action_items.session_id 
    AND ms.mentor_id = auth.uid()
  )
);

CREATE POLICY "Startups can view action items for their sessions"
ON public.action_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.mentoring_sessions ms
    JOIN public.user_company_relations ucr ON ucr.company_id = ms.startup_company_id
    WHERE ms.id = action_items.session_id 
    AND ucr.user_id = auth.uid()
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_action_items_updated_at
BEFORE UPDATE ON public.action_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Remove the action_items JSON column from mentoring_sessions since we now have a separate table
ALTER TABLE public.mentoring_sessions DROP COLUMN IF EXISTS action_items;

-- Drop mentoring_tips table completely
DROP TABLE IF EXISTS public.mentoring_tips CASCADE;