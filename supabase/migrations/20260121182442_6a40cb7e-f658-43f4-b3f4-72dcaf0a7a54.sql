-- Add responsible_id to strategic_projects table
ALTER TABLE public.strategic_projects 
ADD COLUMN IF NOT EXISTS responsible_id UUID REFERENCES public.profiles(user_id);

-- Create index for better performance on responsible_id lookups
CREATE INDEX IF NOT EXISTS idx_strategic_projects_responsible_id 
ON public.strategic_projects(responsible_id);

-- Add comment explaining the difference between owner_id and responsible_id
COMMENT ON COLUMN public.strategic_projects.responsible_id IS 'User assigned as responsible for the project (different from owner_id which is the creator)';