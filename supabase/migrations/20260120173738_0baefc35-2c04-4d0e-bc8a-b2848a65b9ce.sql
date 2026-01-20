-- Add cover image field to strategic_projects
ALTER TABLE public.strategic_projects 
ADD COLUMN IF NOT EXISTS cover_image_url TEXT;