-- Create enum for mentor todo status
CREATE TYPE mentor_todo_status AS ENUM ('pending', 'in_progress', 'completed');

-- Create enum for mentor todo priority
CREATE TYPE mentor_todo_priority AS ENUM ('low', 'medium', 'high');

-- Create mentor_todos table
CREATE TABLE public.mentor_todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  startup_company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status mentor_todo_status NOT NULL DEFAULT 'pending',
  priority mentor_todo_priority NOT NULL DEFAULT 'medium',
  due_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mentor_todos ENABLE ROW LEVEL SECURITY;

-- Policy: Mentors can view their own todos
CREATE POLICY "Mentors can view their own todos"
ON public.mentor_todos
FOR SELECT
USING (
  mentor_id = auth.uid() 
  AND EXISTS (
    SELECT 1 FROM public.startup_hub_profiles shp
    WHERE shp.user_id = auth.uid() 
    AND shp.type = 'mentor'
    AND shp.status = 'active'
  )
);

-- Policy: Mentors can create their own todos
CREATE POLICY "Mentors can create their own todos"
ON public.mentor_todos
FOR INSERT
WITH CHECK (
  mentor_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.startup_hub_profiles shp
    WHERE shp.user_id = auth.uid() 
    AND shp.type = 'mentor'
    AND shp.status = 'active'
  )
);

-- Policy: Mentors can update their own todos
CREATE POLICY "Mentors can update their own todos"
ON public.mentor_todos
FOR UPDATE
USING (mentor_id = auth.uid());

-- Policy: Mentors can delete their own todos
CREATE POLICY "Mentors can delete their own todos"
ON public.mentor_todos
FOR DELETE
USING (mentor_id = auth.uid());

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_mentor_todos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_mentor_todos_updated_at
BEFORE UPDATE ON public.mentor_todos
FOR EACH ROW
EXECUTE FUNCTION update_mentor_todos_updated_at();

-- Create index for faster queries
CREATE INDEX idx_mentor_todos_mentor_id ON public.mentor_todos(mentor_id);
CREATE INDEX idx_mentor_todos_startup_company_id ON public.mentor_todos(startup_company_id);
CREATE INDEX idx_mentor_todos_status ON public.mentor_todos(status);