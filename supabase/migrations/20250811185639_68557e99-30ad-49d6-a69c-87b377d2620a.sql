-- 1) Create generic user_module_profiles table
CREATE TABLE IF NOT EXISTS public.user_module_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  module_id UUID NOT NULL,
  status VARCHAR NOT NULL DEFAULT 'active',
  profile_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, module_id)
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_user_module_profiles_user_id ON public.user_module_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_module_profiles_module_id ON public.user_module_profiles(module_id);

-- Enable RLS
ALTER TABLE public.user_module_profiles ENABLE ROW LEVEL SECURITY;

-- Policies: Admins can manage all; users can manage/view their own profile when they have access to the module
DROP POLICY IF EXISTS "Admins can manage user_module_profiles" ON public.user_module_profiles;
CREATE POLICY "Admins can manage user_module_profiles"
ON public.user_module_profiles
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Owners with module access can view their profile" ON public.user_module_profiles;
CREATE POLICY "Owners with module access can view their profile"
ON public.user_module_profiles
FOR SELECT
USING (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.user_modules um
    JOIN public.system_modules sm ON sm.id = um.module_id
    WHERE um.user_id = auth.uid()
      AND um.active = true
      AND sm.active = true
      AND sm.id = user_module_profiles.module_id
  )
);

DROP POLICY IF EXISTS "Owners with module access can insert their profile" ON public.user_module_profiles;
CREATE POLICY "Owners with module access can insert their profile"
ON public.user_module_profiles
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.user_modules um
    JOIN public.system_modules sm ON sm.id = um.module_id
    WHERE um.user_id = auth.uid()
      AND um.active = true
      AND sm.active = true
      AND sm.id = user_module_profiles.module_id
  )
);

DROP POLICY IF EXISTS "Owners with module access can update their profile" ON public.user_module_profiles;
CREATE POLICY "Owners with module access can update their profile"
ON public.user_module_profiles
FOR UPDATE
USING (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.user_modules um
    JOIN public.system_modules sm ON sm.id = um.module_id
    WHERE um.user_id = auth.uid()
      AND um.active = true
      AND sm.active = true
      AND sm.id = user_module_profiles.module_id
  )
)
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.user_modules um
    JOIN public.system_modules sm ON sm.id = um.module_id
    WHERE um.user_id = auth.uid()
      AND um.active = true
      AND sm.active = true
      AND sm.id = user_module_profiles.module_id
  )
);

DROP POLICY IF EXISTS "Owners with module access can delete their profile" ON public.user_module_profiles;
CREATE POLICY "Owners with module access can delete their profile"
ON public.user_module_profiles
FOR DELETE
USING (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.user_modules um
    JOIN public.system_modules sm ON sm.id = um.module_id
    WHERE um.user_id = auth.uid()
      AND um.active = true
      AND sm.active = true
      AND sm.id = user_module_profiles.module_id
  )
);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_user_module_profiles_updated_at ON public.user_module_profiles;
CREATE TRIGGER update_user_module_profiles_updated_at
BEFORE UPDATE ON public.user_module_profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) Data migration from startup_hub_profiles into the generic table
DO $$
DECLARE
  startup_module_id UUID;
BEGIN
  SELECT id INTO startup_module_id FROM public.system_modules WHERE slug = 'startup-hub' LIMIT 1;

  IF startup_module_id IS NOT NULL THEN
    INSERT INTO public.user_module_profiles (user_id, module_id, status, profile_data, created_at, updated_at)
    SELECT 
      shp.user_id,
      startup_module_id AS module_id,
      COALESCE(shp.status, 'active') AS status,
      jsonb_build_object(
        'type', shp.type,
        'bio', shp.bio,
        'areas_of_expertise', shp.areas_of_expertise,
        'startup_name', shp.startup_name,
        'website', shp.website
      ) AS profile_data,
      COALESCE(shp.created_at, now()),
      COALESCE(shp.updated_at, now())
    FROM public.startup_hub_profiles shp
    ON CONFLICT (user_id, module_id) DO UPDATE SET
      status = EXCLUDED.status,
      profile_data = EXCLUDED.profile_data,
      updated_at = now();
  END IF;
END $$;