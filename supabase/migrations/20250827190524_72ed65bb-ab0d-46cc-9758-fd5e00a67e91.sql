-- Add company_type field to companies table
ALTER TABLE public.companies 
ADD COLUMN company_type character varying DEFAULT 'regular'::character varying;

-- Create company_type enum for better type safety
CREATE TYPE public.company_type AS ENUM ('regular', 'startup');

-- Update the column to use the enum type
ALTER TABLE public.companies 
ALTER COLUMN company_type TYPE company_type USING company_type::company_type;

-- Create companies from existing startup profiles that have startup_name
INSERT INTO public.companies (name, company_type, owner_id, status, created_at, updated_at)
SELECT 
  shp.startup_name,
  'startup'::company_type,
  shp.user_id,
  'active'::character varying,
  shp.created_at,
  shp.updated_at
FROM public.startup_hub_profiles shp
WHERE shp.startup_name IS NOT NULL 
  AND shp.startup_name != ''
  AND shp.status = 'active'
  AND shp.type = 'startup'
ON CONFLICT DO NOTHING;

-- Create user_company_relations for existing startup users
INSERT INTO public.user_company_relations (user_id, company_id, role, created_at, updated_at)
SELECT 
  shp.user_id,
  c.id,
  'admin'::character varying,
  NOW(),
  NOW()
FROM public.startup_hub_profiles shp
JOIN public.companies c ON c.name = shp.startup_name AND c.company_type = 'startup' AND c.owner_id = shp.user_id
WHERE shp.startup_name IS NOT NULL 
  AND shp.startup_name != ''
  AND shp.status = 'active'
  AND shp.type = 'startup'
ON CONFLICT DO NOTHING;

-- Remove startup_name from startup_hub_profiles as it's now handled by companies
ALTER TABLE public.startup_hub_profiles 
DROP COLUMN IF EXISTS startup_name;

-- Update RLS policies for companies to handle company_type
DROP POLICY IF EXISTS "Users can view companies" ON public.companies;

CREATE POLICY "Users can view companies"
ON public.companies
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL AND (
    -- Regular companies: existing logic
    (company_type = 'regular') OR
    -- Startup companies: user must be associated via user_company_relations
    (company_type = 'startup' AND EXISTS (
      SELECT 1 FROM public.user_company_relations ucr 
      WHERE ucr.company_id = companies.id AND ucr.user_id = auth.uid()
    ))
  )
);

-- Create function to get user's startup company
CREATE OR REPLACE FUNCTION public.get_user_startup_company(_user_id uuid)
RETURNS TABLE(
  id uuid,
  name character varying,
  mission text,
  vision text,
  company_values text[],
  logo_url text,
  website text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT c.id, c.name, c.mission, c.vision, c.values as company_values, c.logo_url, 
         null::text as website, c.created_at, c.updated_at
  FROM public.companies c
  JOIN public.user_company_relations ucr ON ucr.company_id = c.id
  WHERE ucr.user_id = _user_id 
    AND c.company_type = 'startup'
    AND c.status = 'active'
  LIMIT 1;
$$;