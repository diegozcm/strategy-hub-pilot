-- Create landing page draft table (without foreign key constraints on created_by/updated_by)
CREATE TABLE public.landing_page_content_draft (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_name text NOT NULL,
  content_key text NOT NULL,
  content_type text NOT NULL DEFAULT 'text',
  content_value text,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_by uuid,
  updated_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.landing_page_content_draft ENABLE ROW LEVEL SECURITY;

-- RLS policies for draft table
CREATE POLICY "Allow read access to all authenticated users"
ON public.landing_page_content_draft FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow full access to system admins"
ON public.landing_page_content_draft FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'::app_role
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'::app_role
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_landing_page_content_draft_updated_at
BEFORE UPDATE ON public.landing_page_content_draft
FOR EACH ROW
EXECUTE FUNCTION public.update_landing_page_content_updated_at();

-- Copy existing data to draft
INSERT INTO public.landing_page_content_draft 
SELECT * FROM public.landing_page_content;

-- Function to publish draft to production
CREATE OR REPLACE FUNCTION public.publish_landing_page_content()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify user is admin
  IF NOT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'::app_role
  ) THEN
    RAISE EXCEPTION 'Only admins can publish landing page content';
  END IF;

  -- Clear current content
  DELETE FROM public.landing_page_content;

  -- Copy draft to production
  INSERT INTO public.landing_page_content
  SELECT * FROM public.landing_page_content_draft;

  -- Log publication
  RAISE NOTICE 'Landing page published successfully by user %', auth.uid();
END;
$$;